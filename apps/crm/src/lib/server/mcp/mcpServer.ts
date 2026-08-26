import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { decodeJwt } from "jose";
import { Pool, types } from "pg";
import { z } from "zod";

import type { AuthInfo } from "./auth";
import { TASK_LIST_HTML, TASK_LIST_UI_URI } from "./taskListUi";
import { validateReadOnly, validateWrite } from "./validateSql";

// int8 (bigint) llega como string por defecto en pg, para no perder
// precisión en valores fuera del rango seguro de un number. Los recuentos y
// montos de este CRM nunca se acercan a ese límite, así que se acepta la
// misma pérdida de precisión que ya aceptaba la función de Deno (que
// convertía bigint -> Number antes de serializar).
types.setTypeParser(types.builtins.INT8, (value: string) => parseInt(value, 10));

const connectionString = process.env.SUPABASE_DB_URL ?? "";

/**
 * Una sola instancia por contenedor de función serverless, reutilizada entre
 * invocaciones cuando el contenedor sigue caliente — igual que hacía la
 * función de Supabase Edge Functions (Pool con una sola conexión).
 */
const pool = connectionString
  ? new Pool({ connectionString, max: 1 })
  : null;

// --- Rate limiting, por usuario (claims.sub), no por IP ---
//
// Un conector alojado (Claude.ai, ChatGPT) manda el tráfico de muchos
// usuarios reales desde pocas IPs de salida, así que limitar por IP
// penalizaría a todos los usuarios de ese conector a la vez. En memoria del
// proceso: se reinicia en cada cold start y no se comparte entre instancias,
// pero es suficiente como primera barrera contra un bucle descontrolado.
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;
const llamadasPorUsuario = new Map<string, number[]>();

function excedeLimite(userId: string): boolean {
  const ahora = Date.now();
  const llamadas = (llamadasPorUsuario.get(userId) ?? []).filter(
    (marca) => ahora - marca < RATE_LIMIT_WINDOW_MS,
  );
  llamadas.push(ahora);
  llamadasPorUsuario.set(userId, llamadas);
  return llamadas.length > RATE_LIMIT_MAX;
}

// --- Database: get_schema ---

async function getSchemaData(): Promise<string> {
  if (!pool) throw new Error("Falta configurar SUPABASE_DB_URL.");
  const client = await pool.connect();
  try {
    const columnsResult = await client.query<{
      table_name: string;
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
      table_type: string;
    }>(`
      SELECT
        c.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        t.table_type
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON c.table_name = t.table_name AND c.table_schema = t.table_schema
      WHERE c.table_schema = 'crm'
      ORDER BY c.table_name, c.ordinal_position
    `);

    const fkResult = await client.query<{
      source_table: string;
      source_column: string;
      target_table: string;
      target_column: string;
    }>(`
      SELECT
        src.relname AS source_table,
        src_att.attname AS source_column,
        tgt.relname AS target_table,
        tgt_att.attname AS target_column
      FROM pg_catalog.pg_constraint con
      JOIN pg_catalog.pg_class src ON con.conrelid = src.oid
      JOIN pg_catalog.pg_namespace nsp ON src.relnamespace = nsp.oid
      JOIN pg_catalog.pg_class tgt ON con.confrelid = tgt.oid
      JOIN pg_catalog.pg_attribute src_att
        ON src_att.attrelid = con.conrelid AND src_att.attnum = ANY(con.conkey)
      JOIN pg_catalog.pg_attribute tgt_att
        ON tgt_att.attrelid = con.confrelid AND tgt_att.attnum = ANY(con.confkey)
      WHERE con.contype = 'f' AND nsp.nspname = 'crm'
      ORDER BY src.relname
    `);

    const tables = new Map<
      string,
      {
        type: string;
        columns: {
          name: string;
          type: string;
          nullable: boolean;
          default: string | null;
        }[];
      }
    >();
    for (const row of columnsResult.rows) {
      if (!tables.has(row.table_name)) {
        tables.set(row.table_name, {
          type: row.table_type === "VIEW" ? "View" : "Table",
          columns: [],
        });
      }
      tables.get(row.table_name)!.columns.push({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === "YES",
        default: row.column_default,
      });
    }

    const foreignKeys = new Map<
      string,
      { source_column: string; target_table: string; target_column: string }[]
    >();
    for (const row of fkResult.rows) {
      if (!foreignKeys.has(row.source_table)) {
        foreignKeys.set(row.source_table, []);
      }
      foreignKeys.get(row.source_table)!.push({
        source_column: row.source_column,
        target_table: row.target_table,
        target_column: row.target_column,
      });
    }

    const lines: string[] = [];
    for (const [tableName, table] of tables) {
      lines.push(`${table.type}: ${tableName}`);
      for (const col of table.columns) {
        const parts = [`  - ${col.name}: ${col.type}`];
        if (col.nullable) parts.push("(nullable)");
        if (col.default) parts.push(`default: ${col.default}`);
        lines.push(parts.join(" "));
      }
      const fks = foreignKeys.get(tableName);
      if (fks && fks.length > 0) {
        lines.push("  Foreign Keys:");
        for (const fk of fks) {
          lines.push(
            `    - ${fk.source_column} -> ${fk.target_table}.${fk.target_column}`,
          );
        }
      }
      lines.push("");
    }

    return lines.join("\n");
  } finally {
    client.release();
  }
}

// --- Database: query with RLS ---

async function executeQueryWithRLS(
  sql: string,
  userToken: string,
  validate: (sql: string) => string | null,
): Promise<
  { success: true; data: unknown[] } | { success: false; error: string }
> {
  const validationError = validate(sql);
  if (validationError) {
    return { success: false, error: validationError };
  }
  if (!pool) {
    return { success: false, error: "Falta configurar SUPABASE_DB_URL." };
  }

  const client = await pool.connect();
  try {
    const claimsJson = JSON.stringify(decodeJwt(userToken));

    await client.query("BEGIN");
    // El SQL de esta herramienta usa nombres de tabla sin calificar (así lo
    // documentan las descripciones de las tools), así que la conexión debe
    // resolverlos contra crm — el esquema donde vive todo el CRM — en vez del
    // "$user", public por defecto de la conexión cruda a Postgres.
    await client.query("SET LOCAL search_path TO crm, public");
    // set_config(..., is_local=true) is the parameterized equivalent of
    // SET LOCAL — avoids interpolating JWT claims into a SQL string.
    await client.query("SELECT set_config('role', 'authenticated', true)");
    await client.query(
      "SELECT set_config('request.jwt.claims', $1, true)",
      [claimsJson],
    );

    const result = await client.query(sql);
    await client.query("COMMIT");

    return { success: true, data: result.rows };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback errors
    }
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  } finally {
    client.release();
  }
}

// --- MCP Server Factory ---

export function createMcpServer(
  authInfo: AuthInfo,
  crmBaseUrl: string,
): McpServer {
  const server = new McpServer({
    name: "atomic-crm",
    version: "1.0.0",
  });

  const limitado = () => excedeLimite(authInfo.userId);

  server.registerTool(
    "get_schema",
    {
      title: "Get Database Schema",
      description:
        "Retrieve the database schema for the user's Vinqulia instance including all tables, views, columns, types, and foreign key relationships. Views (like contacts_summary, companies_summary) are read-only and provide pre-joined/aggregated data. Use them for search and list queries.",
      annotations: { readOnlyHint: true },
    },
    async () => {
      if (limitado()) {
        return {
          content: [{ type: "text" as const, text: "Rate limit exceeded. Try again in a minute." }],
          isError: true,
        };
      }
      const schema = await getSchemaData();
      return { content: [{ type: "text" as const, text: schema }] };
    },
  );

  server.registerTool(
    "query",
    {
      title: "Query CRM Data",
      description: `Read data from the user's CRM instance using SQL SELECT queries.

IMPORTANT: Before using this tool, you MUST call the get_schema tool first to understand what tables and columns are available in the database.

Use this tool when the user asks about their CRM data such as:
- Contacts, companies, and deals
- Sales pipeline and forecasting data
- Customer interactions and notes
- Tasks and follow-ups
- Custom fields and metadata

Row Level Security (RLS) is enforced - queries automatically return only data the authenticated user has permission to access.

Use the *_summary views (contacts_summary, companies_summary) for queries that need aggregated data or search capabilities.

To filter by the current user, if the table has a sales_id column, add a WHERE sales_id = auth.uid() clause to your query.

This tool only supports SELECT queries. For INSERT, UPDATE, or DELETE operations, use the mutate tool.

Examples:
- "SELECT id, first_name, last_name, email_fts FROM contacts_summary WHERE email_fts LIKE '%@company.com%'"
- "SELECT name, stage, amount FROM deals WHERE created_at > NOW() - INTERVAL '30 days' ORDER BY amount DESC"
- "SELECT COUNT(*) as total_tasks, type FROM tasks WHERE done_date IS NULL GROUP BY type"
- "SELECT c.first_name, c.last_name, co.name as company_name FROM contacts c JOIN companies co ON c.company_id = co.id WHERE co.sector = 'Technology'"`,
      inputSchema: z.object({
        sql: z.string().describe("The SQL SELECT query to execute"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ sql }: { sql: string }) => {
      if (limitado()) {
        return {
          content: [{ type: "text" as const, text: "Rate limit exceeded. Try again in a minute." }],
          isError: true,
        };
      }
      console.warn(`[MCP query] user=${authInfo.userId} sql=${sql}`);
      const result = await executeQueryWithRLS(
        sql,
        authInfo.token,
        validateReadOnly,
      );
      if (result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      }
      return {
        content: [{ type: "text" as const, text: `Error: ${result.error}` }],
        isError: true,
      };
    },
  );

  server.registerTool(
    "mutate",
    {
      title: "Mutate CRM Data",
      description: `Create, update, or delete data in the user's CRM instance using SQL.

IMPORTANT: Before using this tool, you MUST call the get_schema tool first to understand what tables and columns are available in the database.

Use this tool for data modifications such as:
- Creating new contacts, companies, deals, tasks, or notes
- Updating existing records
- Deleting records

Row Level Security (RLS) is enforced - mutations only affect data the authenticated user has permission to modify.

IMPORTANT: Never specify sales_id in INSERT or UPDATE statements — it is automatically set to the authenticated user by a database trigger.

For read-only queries, use the query tool instead.

Examples:
- "INSERT INTO contacts (first_name, last_name, email) VALUES ('John', 'Doe', 'john@example.com')"
- "UPDATE deals SET stage = 'won-deal' WHERE id = 123"
- "DELETE FROM tasks WHERE id = 456"`,
      inputSchema: z.object({
        sql: z
          .string()
          .describe("The SQL INSERT, UPDATE, or DELETE statement to execute"),
      }),
      annotations: { destructiveHint: true },
    },
    async ({ sql }: { sql: string }) => {
      if (limitado()) {
        return {
          content: [{ type: "text" as const, text: "Rate limit exceeded. Try again in a minute." }],
          isError: true,
        };
      }
      console.warn(`[MCP mutate] user=${authInfo.userId} sql=${sql}`);
      const result = await executeQueryWithRLS(
        sql,
        authInfo.token,
        validateWrite,
      );
      if (result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      }
      return {
        content: [{ type: "text" as const, text: `Error: ${result.error}` }],
        isError: true,
      };
    },
  );

  // --- UI resource for the task-list MCP App ---

  // Inject the CRM base URL into the task-list guest HTML
  // so contact names can link back to the CRM
  const taskListHtml = TASK_LIST_HTML.replace(
    /__CRM_BASE_URL__/g,
    crmBaseUrl,
  );

  server.registerResource(
    "task-list-ui",
    TASK_LIST_UI_URI,
    {
      title: "Task List UI",
      description: "Interactive list of tasks with mark-as-done buttons.",
      mimeType: "text/html;profile=mcp-app",
    },
    async (uri: URL) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html;profile=mcp-app",
          text: taskListHtml,
        },
      ],
    }),
  );

  const taskSchema = z.object({
    id: z
      .number()
      .int()
      .describe("Task id — required for the mark-as-done action"),
    text: z.string().nullable().optional().describe("Task description"),
    type: z
      .string()
      .nullable()
      .optional()
      .describe("Task category/type (rendered as a pill)"),
    due_date: z.string().nullable().optional().describe("ISO date string"),
    done_date: z
      .string()
      .nullable()
      .optional()
      .describe("ISO timestamp if already done; null or omitted for pending"),
    contact_name: z
      .string()
      .nullable()
      .optional()
      .describe("Full name of the linked contact, if any"),
    contact_id: z
      .number()
      .int()
      .nullable()
      .optional()
      .describe(
        "Id of the linked contact — used to render the contact name as a link to the CRM contact page",
      ),
  });
  type Task = z.infer<typeof taskSchema>;

  server.registerTool(
    "display_task_list",
    {
      title: "Display Task List",
      description: `Render an array of task rows as an interactive UI (MCP App) where the user can mark each task as done.

This tool is presentational: it does not query the database. Fetch the rows yourself via the query tool (joining contacts for contact_name when useful), then pass them here. Prefer this over replying with a bulleted list of tasks.

Each task should include at least: id (required, used for the mark-as-done action), text, type, due_date, done_date, and optionally contact_name + contact_id (the UI renders the name as a link to the CRM contact page when contact_id is provided).`,
      inputSchema: {
        tasks: z.array(taskSchema).describe("Array of task objects to render"),
      },
      annotations: { readOnlyHint: true },
      _meta: {
        ui: {
          resourceUri: TASK_LIST_UI_URI,
          visibility: ["model"],
        },
      },
    },
    ({ tasks }: { tasks: Task[] }) => {
      console.warn(
        `[MCP display_task_list] user=${authInfo.userId} count=${tasks.length}`,
      );
      // content carries the display text (used by Claude's guest HTML);
      // structuredContent carries the typed data (used by ChatGPT's Apps SDK
      // convention). Supplying both keeps the guest host-agnostic.
      return {
        content: [{ type: "text" as const, text: JSON.stringify(tasks) }],
        structuredContent: { tasks },
      };
    },
  );

  server.registerTool(
    "complete_task",
    {
      title: "Mark Task Done",
      description:
        "Mark a single task as done by id. Used by the task-list UI when the user clicks a task's checkmark, and also callable directly by the model.",
      inputSchema: {
        id: z
          .number()
          .int()
          .positive()
          .describe("The id of the task to mark as done"),
      },
      annotations: { idempotentHint: true },
      _meta: {
        ui: {
          visibility: ["model", "app"],
        },
      },
    },
    async ({ id }: { id: number }) => {
      if (limitado()) {
        return {
          content: [{ type: "text" as const, text: "Rate limit exceeded. Try again in a minute." }],
          isError: true,
        };
      }
      // RETURNING id lets us distinguish a successful update from an
      // RLS-blocked or non-existent row (executeQueryWithRLS would otherwise
      // report success on 0 rows affected).
      const sql = `UPDATE tasks SET done_date = NOW() WHERE id = ${id} RETURNING id`;
      console.warn(`[MCP complete_task] user=${authInfo.userId} id=${id}`);
      const result = await executeQueryWithRLS(
        sql,
        authInfo.token,
        validateWrite,
      );
      if (!result.success) {
        return {
          content: [{ type: "text" as const, text: `Error: ${result.error}` }],
          isError: true,
        };
      }
      if (result.data.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: task ${id} not found or permission denied.`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [
          { type: "text" as const, text: `Task ${id} marked as done.` },
        ],
      };
    },
  );

  return server;
}
