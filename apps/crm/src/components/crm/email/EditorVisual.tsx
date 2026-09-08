import Image from "@tiptap/extension-image";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Redo2,
  Undo2,
} from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

/**
 * Editor visual del cuerpo de una plantilla de correo.
 *
 * Componente controlado: recibe el HTML y avisa de cada cambio. Se apoya en
 * TipTap, que es «headless» — no trae interfaz propia—, así que la barra de
 * herramientas se arma con los mismos botones que el resto del CRM en vez de
 * meter otro estilo visual en la aplicación.
 *
 * Ojo con el ciclo de actualización: `onUpdate` avisa hacia arriba y el padre
 * devuelve el mismo HTML como `value`. Si se volcara sin comparar, cada
 * pulsación reiniciaría el contenido y el cursor saltaría al principio; por
 * eso el efecto compara antes de escribir.
 */

interface EditorVisualProps {
  value: string;
  onChange: (html: string) => void;
  /** Se llama al pulsar el botón de insertar un campo de fusión. */
  onInsertarCampo?: (insertar: (texto: string) => void) => void;
  disabled?: boolean;
}

const BotonDeFormato = ({
  activo,
  onClick,
  etiqueta,
  children,
}: {
  activo?: boolean;
  onClick: () => void;
  etiqueta: string;
  children: React.ReactNode;
}) => (
  <Button
    type="button"
    size="sm"
    variant={activo ? "default" : "ghost"}
    aria-label={etiqueta}
    title={etiqueta}
    onClick={onClick}
  >
    {children}
  </Button>
);

const BarraDeHerramientas = ({ editor }: { editor: Editor }) => {
  const ponerEnlace = () => {
    const previo = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Dirección del enlace", previo ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b p-1.5">
      <BotonDeFormato
        etiqueta="Negrita"
        activo={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </BotonDeFormato>
      <BotonDeFormato
        etiqueta="Cursiva"
        activo={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </BotonDeFormato>
      <BotonDeFormato
        etiqueta="Título"
        activo={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </BotonDeFormato>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <BotonDeFormato
        etiqueta="Lista con viñetas"
        activo={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </BotonDeFormato>
      <BotonDeFormato
        etiqueta="Lista numerada"
        activo={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </BotonDeFormato>
      <BotonDeFormato
        etiqueta="Enlace"
        activo={editor.isActive("link")}
        onClick={ponerEnlace}
      >
        <LinkIcon className="h-4 w-4" />
      </BotonDeFormato>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <BotonDeFormato
        etiqueta="Deshacer"
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="h-4 w-4" />
      </BotonDeFormato>
      <BotonDeFormato
        etiqueta="Rehacer"
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="h-4 w-4" />
      </BotonDeFormato>
    </div>
  );
};

export const EditorVisual = ({
  value,
  onChange,
  onInsertarCampo,
  disabled,
}: EditorVisualProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          // El HTML puede venir de la IA o pegado de fuera: sin esto, un
          // `javascript:` en un href se ejecutaría al pulsarlo.
          protocols: ["http", "https", "mailto"],
        },
      }),
      Image.configure({ inline: false }),
    ],
    content: value,
    editable: !disabled,
    // Lo pide TipTap en SSR (Next renderiza esto en el servidor primero):
    // sin ello avisa de que el HTML del servidor y el del cliente difieren.
    immediatelyRender: false,
    onUpdate: ({ editor: actual }) => onChange(actual.getHTML()),
  });

  // El padre puede cambiar el contenido por su cuenta (al generar con IA, o
  // al cargar la plantilla). Se compara antes de volcar para no reiniciar el
  // cursor en cada pulsación.
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  // Se le entrega al padre la forma de insertar en la posición del cursor,
  // que es lo único que necesita saber del editor.
  useEffect(() => {
    if (!editor || !onInsertarCampo) return;
    onInsertarCampo((texto: string) =>
      editor.chain().focus().insertContent(texto).run(),
    );
  }, [editor, onInsertarCampo]);

  if (!editor) return null;

  return (
    <div className="rounded-md border">
      <BarraDeHerramientas editor={editor} />
      <EditorContent
        editor={editor}
        className="prose-sm max-w-none px-3 py-2 [&_.ProseMirror]:min-h-52 [&_.ProseMirror]:outline-none [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:mt-3 [&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_p]:my-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5"
      />
    </div>
  );
};
