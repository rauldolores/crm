/**
 * Catálogo de mensajes propios de Vinqulia.
 *
 * Es la única fuente de verdad de los textos de la aplicación y también del
 * tipo `CrmMessages`, así que añadir una clave aquí la vuelve obligatoria en
 * cualquier catálogo futuro.
 *
 * Vocabulario acordado: un «deal» es una **oportunidad**; se trata al usuario
 * de tú. Los marcadores `%{variable}` y los separadores de plural `||||` deben
 * conservarse tal cual.
 */
export const spanishCrmMessages = {
  resources: {
    companies: {
      name: "Empresa |||| Empresas",
      forcedCaseName: "Empresa",
      fields: {
        name: "Nombre de la empresa",
        website: "Sitio web",
        linkedin_url: "URL de LinkedIn",
        phone_number: "Teléfono",
        created_at: "Fecha de alta",
        nb_contacts: "Número de contactos",
        revenue: "Facturación",
        sector: "Sector",
        size: "Tamaño",
        tax_identifier: "Identificación fiscal",
        address: "Dirección",
        city: "Ciudad",
        zipcode: "Código postal",
        state_abbr: "Estado o provincia",
        country: "País",
        description: "Descripción",
        context_links: "Enlaces de contexto",
        sales_id: "Responsable de venta",
      },
      empty: {
        description: "Parece que tu lista de empresas está vacía.",
        title: "No hay empresas",
      },
      field_categories: {
        contact: "Contacto",
        additional_info: "Información adicional",
        address: "Dirección",
        context: "Contexto",
      },
      action: {
        create: "Crear empresa",
        edit: "Editar empresa",
        new: "Nueva empresa",
        show: "Ver empresa",
      },
      added_on: "Dada de alta el %{date}",
      followed_by: "Gestionada por %{name}",
      followed_by_you: "Gestionada por ti",
      no_contacts: "Sin contactos",
      nb_contacts: "%{smart_count} contacto |||| %{smart_count} contactos",
      nb_deals: "%{smart_count} oportunidad |||| %{smart_count} oportunidades",
      sizes: {
        one_employee: "1 empleado",
        two_to_nine_employees: "2-9 empleados",
        ten_to_forty_nine_employees: "10-49 empleados",
        fifty_to_two_hundred_forty_nine_employees: "50-249 empleados",
        two_hundred_fifty_or_more_employees: "250 empleados o más",
      },
      autocomplete: {
        create_error: "Se produjo un error al crear la empresa",
        create_item: "Crear %{item}",
        create_label: "Empieza a escribir para crear una empresa nueva",
      },
      filters: {
        only_mine: "Solo las empresas que gestiono",
      },
    },
    contacts: {
      name: "Contacto |||| Contactos",
      forcedCaseName: "Contacto",
      field_categories: {
        background_info: "Antecedentes",
        identity: "Identidad",
        misc: "Otros",
        personal_info: "Datos personales",
        position: "Puesto",
      },
      fields: {
        first_name: "Nombre",
        last_name: "Apellidos",
        last_seen: "Último contacto",
        title: "Puesto",
        company_id: "Empresa",
        email_jsonb: "Correos electrónicos",
        email: "Correo electrónico",
        phone_jsonb: "Teléfonos",
        phone_number: "Teléfono",
        linkedin_url: "URL de LinkedIn",
        background: "Antecedentes (biografía, cómo se conocieron, etc.)",
        has_newsletter: "Recibe el boletín",
        sales_id: "Responsable de venta",
      },
      action: {
        add: "Añadir contacto",
        add_first: "Añade tu primer contacto",
        create: "Crear contacto",
        edit: "Editar contacto",
        export_vcard: "Exportar a vCard",
        new: "Nuevo contacto",
        show: "Ver contacto",
      },
      background: {
        last_activity_on: "Última actividad el %{date}",
        added_on: "Dado de alta el %{date}",
        followed_by: "Gestionado por %{name}",
        followed_by_you: "Gestionado por ti",
        status_none: "Ninguno",
      },
      position_at: "%{title} en",
      position_at_company: "%{title} en %{company}",
      empty: {
        description: "Parece que tu lista de contactos está vacía.",
        title: "No hay contactos",
      },
      import: {
        title: "Importar contactos",
        button: "Importar CSV",
        complete:
          "Importación terminada. Se importaron %{importCount} contactos, con %{errorCount} errores",
        progress:
          "Importados %{importCount} de %{rowCount} contactos, con %{errorCount} errores.",
        error:
          "No se pudo importar el archivo. Asegúrate de que sea un CSV válido.",
        imported: "Importados",
        remaining_time: "Tiempo restante estimado:",
        running: "La importación está en curso, no cierres esta pestaña.",
        sample_download: "Descargar un CSV de ejemplo",
        sample_hint:
          "Este es un archivo CSV de ejemplo que puedes usar de plantilla",
        stop: "Detener la importación",
        csv_file: "Archivo CSV",
        contacts_label: "contacto |||| contactos",
        duplicates_found:
          "%{count} contacto podría ser un duplicado |||| %{count} contactos podrían ser duplicados",
        existing_contact: "ver el contacto existente",
        duplicates_more: "y %{count} más.",
      },
      duplicates: {
        title: "Ya existe un contacto parecido",
        same_email: "tiene el mismo correo",
        same_name: "tiene un nombre parecido",
      },
      inputs: {
        genders: {
          male: "Él",
          female: "Ella",
          nonbinary: "Elle",
        },
        personal_info_types: {
          work: "Trabajo",
          home: "Personal",
          other: "Otro",
        },
      },
      list: {
        error_loading: "Error al cargar los contactos",
      },
      bulk_tag: {
        action: "Etiquetar",
        back: "Volver a las etiquetas",
        create_description:
          "Crea una etiqueta nueva y aplícala a los contactos seleccionados.",
        description:
          "Elige una etiqueta existente o crea una nueva para los contactos seleccionados.",
        empty:
          "Todavía no hay etiquetas. Crea una para etiquetar los contactos seleccionados.",
        error: "No se pudo añadir la etiqueta a los contactos",
        noop: "Los contactos seleccionados ya tienen esta etiqueta",
        success:
          "Etiqueta añadida a %{smart_count} contacto |||| Etiqueta añadida a %{smart_count} contactos",
        title: "Añadir etiqueta a los contactos",
      },
      merge: {
        action: "Fusionar con otro contacto",
        confirm: "Fusionar contactos",
        current_contact: "Contacto actual (se eliminará)",
        description: "Fusiona este contacto con otro.",
        error: "No se pudieron fusionar los contactos",
        merging: "Fusionando...",
        no_additional_data: "No hay datos adicionales que fusionar",
        select_target: "Elige el contacto con el que quieres fusionar",
        success: "Contactos fusionados correctamente",
        target_contact: "Contacto destino (se conservará)",
        title: "Fusionar contacto",
        warning_description:
          "Todos los datos se transferirán al segundo contacto. Esta acción no se puede deshacer.",
        warning_title: "Atención: operación destructiva",
        what_will_be_merged: "Qué se va a fusionar:",
      },
      filters: {
        before_last_month: "Antes del mes pasado",
        before_this_month: "Antes de este mes",
        before_this_week: "Antes de esta semana",
        managed_by_me: "Gestionados por mí",
        search: "Buscar por nombre, empresa...",
        this_week: "Esta semana",
        today: "Hoy",
        tags: "Etiquetas",
        tasks: "Tareas",
      },
      hot: {
        empty_change_status:
          'Cambia el estado de un contacto añadiéndole una nota y pulsando en "Mostrar opciones".',
        empty_hint: 'Aquí aparecerán los contactos con estado "caliente".',
        title: "Contactos calientes",
      },
    },
    deals: {
      name: "Oportunidad |||| Oportunidades",
      fields: {
        name: "Nombre",
        description: "Descripción",
        company_id: "Empresa",
        contact_ids: "Contactos",
        category: "Categoría",
        amount: "Importe",
        expected_closing_date: "Fecha prevista de cierre",
        stage: "Etapa",
        pipeline: "Embudo",
        loss_reason: "Motivo de pérdida",
      },
      action: {
        back_to_deal: "Volver a la oportunidad",
        create: "Crear oportunidad",
        new: "Nueva oportunidad",
      },
      field_categories: {
        misc: "Otros",
      },
      archived: {
        action: "Archivar",
        error: "Error: la oportunidad no se archivó",
        list_title: "Oportunidades archivadas",
        success: "Oportunidad archivada",
        title: "Oportunidad archivada",
        view: "Ver las oportunidades archivadas",
      },
      inputs: {
        linked_to: "Vinculada a",
      },
      unarchived: {
        action: "Devolver al tablero",
        error: "Error: la oportunidad no se desarchivó",
        success: "Oportunidad desarchivada",
      },
      updated: "Oportunidad actualizada",
      empty: {
        before_create: "antes de crear una oportunidad.",
        description: "Parece que tu lista de oportunidades está vacía.",
        title: "No hay oportunidades",
      },
      invalid_date: "Fecha no válida",
      loss: {
        title: "¿Por qué se perdió?",
        description:
          "Estás moviendo «%{name}» a una etapa de pérdida. Anotar el motivo permite ver después dónde se están perdiendo las ventas.",
        confirm: "Guardar y mover",
        skip: "Mover sin motivo",
      },
    },
    notes: {
      name: "Nota |||| Notas",
      forcedCaseName: "Nota",
      fields: {
        status: "Estado",
        date: "Fecha",
        attachments: "Archivos adjuntos",
        contact_id: "Contacto",
        deal_id: "Oportunidad",
      },
      action: {
        add: "Añadir nota",
        add_first: "Añade tu primera nota",
        delete: "Eliminar nota",
        edit: "Editar nota",
        update: "Actualizar nota",
        add_this: "Añadir esta nota",
      },
      sheet: {
        create: "Crear nota",
        create_for: "Crear nota para %{name}",
        edit: "Editar nota",
        edit_for: "Editar la nota de %{name}",
      },
      deleted: "Nota eliminada",
      empty: "Todavía no hay notas",
      author_added: "%{name} añadió una nota",
      you_added: "Añadiste una nota",
      me: "Yo",
      list: {
        error_loading: "Error al cargar las notas",
      },
      note_for_contact: "Nota para %{name}",
      stepper: {
        hint: "Entra en la ficha de un contacto y añade una nota",
      },
      added: "Nota añadida",
      inputs: {
        add_note: "Añade una nota",
        options_hint: "(adjunta archivos o cambia los detalles)",
        show_options: "Mostrar opciones",
      },
      actions: {
        attach_document: "Adjuntar documento",
      },
      validation: {
        note_or_attachment_required:
          "Debes escribir una nota o adjuntar un archivo",
      },
    },
    sales: {
      name: "Usuario |||| Usuarios",
      fields: {
        first_name: "Nombre",
        last_name: "Apellidos",
        email: "Correo electrónico",
        administrator: "Administrador",
        disabled: "Desactivado",
      },
      create: {
        error: "Se produjo un error al crear el usuario.",
        success:
          "Usuario creado. En breve recibirá un correo para establecer su contraseña.",
        title: "Crear un usuario nuevo",
      },
      edit: {
        error: "Se produjo un error. Inténtalo de nuevo.",
        record_not_found: "No se encontró el registro",
        success: "Usuario actualizado correctamente",
        title: "Editar %{name}",
      },
      action: {
        new: "Nuevo usuario",
      },
    },
    tasks: {
      name: "Tarea |||| Tareas",
      forcedCaseName: "Tarea",
      fields: {
        text: "Descripción",
        due_date: "Fecha de vencimiento",
        type: "Tipo",
        contact_id: "Contacto",
        due_short: "vence",
      },
      action: {
        add: "Añadir tarea",
        create: "Crear tarea",
        edit: "Editar tarea",
      },
      actions: {
        postpone_next_week: "Aplazar a la semana que viene",
        postpone_tomorrow: "Aplazar a mañana",
        title: "acciones de la tarea",
      },
      added: "Tarea añadida",
      deleted: "Tarea eliminada correctamente",
      dialog: {
        create: "Crear tarea",
        create_for: "Crear tarea para %{name}",
      },
      sheet: {
        edit: "Editar tarea",
        edit_for: "Editar la tarea de %{name}",
      },
      empty: "Todavía no hay tareas",
      empty_list_hint: "Aquí aparecerán las tareas de tus contactos.",
      filters: {
        later: "Más adelante",
        overdue: "Vencidas",
        this_week: "Esta semana",
        today: "Hoy",
        tomorrow: "Mañana",
        with_pending: "Con tareas pendientes",
      },
      regarding_contact: "(Sobre: %{name})",
      updated: "Tarea actualizada",
    },
    tags: {
      name: "Etiqueta |||| Etiquetas",
      action: {
        add: "Añadir etiqueta",
        create: "Crear una etiqueta",
      },
      dialog: {
        color: "Color",
        create_title: "Crear una etiqueta nueva",
        edit_title: "Editar etiqueta",
        name_label: "Nombre de la etiqueta",
        name_placeholder: "Escribe el nombre de la etiqueta",
      },
    },
  },
  crm: {
    action: {
      reset_password: "Restablecer la contraseña",
    },
    auth: {
      first_name: "Nombre",
      last_name: "Apellidos",
      confirm_password: "Confirma la contraseña",
      confirmation_required:
        "Sigue el enlace que acabamos de enviarte por correo para confirmar tu cuenta.",
      recovery_email_sent:
        "Si tu cuenta está registrada, recibirás en breve un correo para recuperar la contraseña.",
      sign_in_failed: "No se ha podido iniciar sesión.",
      sign_in_google_workspace: "Iniciar sesión con Google Workspace",
      signup: {
        create_account: "Crear cuenta",
        create_first_user:
          "Crea la primera cuenta de usuario para terminar la instalación.",
        creating: "Creando...",
        initial_user_created: "Usuario inicial creado correctamente",
      },
      welcome_title: "Te damos la bienvenida a Vinqulia",
    },
    common: {
      activity: "Actividad",
      added: "añadió",
      details: "Detalles",
      last_activity_with_date: "última actividad %{date}",
      load_more: "Cargar más",
      misc: "Otros",
      past: "Anteriores",
      read_more: "Leer más",
      retry: "Reintentar",
      show_less: "Mostrar menos",
      copied: "¡Copiado!",
      copy: "Copiar",
      loading: "Cargando...",
      me: "Yo",
      task_count: "%{smart_count} tarea |||| %{smart_count} tareas",
    },
    changelog: {
      title: "Novedades",
    },
    reports: {
      title: "Informes",
      intro:
        "Dónde se atoran las oportunidades, quién está vendiendo y por qué se pierde. Sobre las oportunidades creadas en el periodo elegido.",
      total: "Oportunidades",
      won: "Ganadas",
      lost: "Perdidas",
      conversion: "Conversión",
      by_stage: "Oportunidades por etapa",
      by_owner: "Ventas ganadas por responsable",
      by_loss_reason: "Motivos de pérdida",
      empty: "No hay datos en este periodo.",
      no_losses: "No se perdió ninguna oportunidad en este periodo.",
      without_reason:
        "%{count} sin motivo anotado. Se pregunta al mover una oportunidad a una etapa de pérdida.",
      periods: {
        quarter: "Últimos 90 días",
        year: "Último año",
        all: "Todo",
      },
    },
    automations: {
      title: "Automatizaciones",
      intro:
        "Reglas del tipo «cuando pase esto, haz aquello». Se aplican solas, tanto si el cambio lo haces tú en la aplicación como si entra por una importación o desde otro sistema.",
      your_rules: "Tus reglas",
      new_rule: "Nueva regla",
      empty: "Aún no hay reglas. Crea la primera abajo.",
      add: "Agregar regla",
      created: "Regla creada y activa",
      create_error: "No se pudo crear la regla",
      deleted: "Regla eliminada",
      toggle: "Activar o desactivar",
      sentence: "%{when} → %{then}",
      fields: {
        name: "Nombre de la regla",
        when: "Cuando",
        stage: "Etapa",
        then: "Entonces",
        task_text: "Texto de la tarea",
        task_type: "Tipo de tarea",
        due_in_days: "Vence en (días)",
        owner: "Responsable",
      },
      when: {
        contact_created: "Se crea un contacto",
        deal_created: "Se crea una oportunidad",
        deal_stage: "Una oportunidad llega a una etapa",
        deal_stage_named: "Una oportunidad llega a «%{stage}»",
      },
      then: {
        task: "Crear una tarea",
        assign: "Asignar responsable",
        task_named: "Crear la tarea «%{text}» para dentro de %{days} días",
        assign_named: "Asignar a %{name}",
      },
    },
    api: {
      title: "API y webhooks",
      intro:
        "Conecta Vinqulia con tus otros sistemas: consulta y escribe tus datos por la API, o recibe un aviso automático cada vez que algo cambie.",
      rest: {
        title: "API REST",
        base_url: "Todas las peticiones van a esta dirección base:",
        auth: "La autenticación usa tu token de sesión de KontrolIA Auth en la cabecera Authorization. Ejemplo de consulta:",
        filters:
          "Los filtros siguen la sintaxis de PostgREST (columna=operador.valor):",
        example_ilike: "# contiene texto, sin mayúsculas",
        example_gte: "# mayor o igual",
        example_order: "# ordenar",
        example_pagination: "# paginación",
        write: "Para crear o modificar, envía JSON con POST o PATCH:",
        resources:
          "Recursos disponibles: contacts, companies, deals, tasks, contact_notes, deal_notes, tags, sales (lectura). Todo queda aislado a tu organización automáticamente.",
      },
      webhooks: {
        title: "Webhooks",
        intro:
          "Un webhook es una URL de tu sistema a la que Vinqulia avisa cada vez que se crea, cambia o elimina un contacto, empresa, oportunidad, tarea o nota. Sirve para conectar n8n, Zapier, Make o tu propio servidor.",
        add: "Agregar",
        empty: "Aún no hay webhooks. Agrega la URL de tu sistema para empezar.",
        created:
          "Webhook agregado. Copia su secreto para verificar las firmas.",
        create_error: "No se pudo agregar el webhook",
        deleted: "Webhook eliminado",
        toggle: "Activar o desactivar",
        copy_secret: "Copiar secreto",
        payload: "Cada aviso llega como POST con este cuerpo:",
        signature:
          "Verifica que el aviso es legítimo comparando la cabecera X-Vinqulia-Firma con el HMAC-SHA256 del cuerpo usando el secreto del webhook:",
      },
    },
    saved_views: {
      title: "Vistas",
      save: "Guardar vista actual…",
      name_placeholder: "Nombre de la vista",
      saved: "Vista guardada para toda la organización",
      save_error: "No se pudo guardar la vista",
      deleted: "Vista eliminada",
      delete: "Eliminar vista",
      empty: "Aún no hay vistas guardadas",
    },
    custom_fields: {
      title: "Campos personalizados",
      field_label: "Etiqueta del campo",
      field_type: "Tipo",
      field_options: "Opciones",
      options_hint: "Opción 1, Opción 2, … (solo tipo lista)",
      types: {
        text: "Texto",
        number: "Número",
        date: "Fecha",
        list: "Lista de opciones",
        checkbox: "Casilla",
      },
    },
    activity: {
      added_company: "%{name} añadió la empresa",
      you_added_company: "Añadiste la empresa",
      added_contact: "%{name} añadió a",
      you_added_contact: "Añadiste a",
      added_note: "%{name} añadió una nota sobre",
      you_added_note: "Añadiste una nota sobre",
      added_note_about_deal: "%{name} añadió una nota sobre la oportunidad",
      you_added_note_about_deal: "Añadiste una nota sobre la oportunidad",
      added_deal: "%{name} añadió la oportunidad",
      you_added_deal: "Añadiste la oportunidad",
      at_company: "en",
      to: "a",
      load_more: "Cargar más actividad",
    },
    dashboard: {
      deals_chart: "Ingresos previstos por oportunidades",
      deals_pipeline: "Embudo de oportunidades",
      latest_activity: "Actividad reciente",
      latest_activity_error: "Error al cargar la actividad reciente",
      latest_notes: "Mis últimas notas",
      latest_notes_added_ago: "añadida %{timeAgo}",
      stepper: {
        install: "Instalar Vinqulia",
        progress: "%{step}/3 completado",
        whats_next: "¿Qué sigue?",
      },
      upcoming_tasks: "Próximas tareas",
    },
    header: {
      import_data: "Importar datos",
    },
    image_editor: {
      change: "Cambiar",
      drop_hint:
        "Arrastra aquí el archivo que quieras subir, o haz clic para seleccionarlo.",
      editable_content: "Contenido editable",
      title: "Subir y redimensionar la imagen",
      update_image: "Actualizar la imagen",
    },
    import: {
      action: {
        download_error_report: "Descargar el informe de errores",
        import: "Importar",
        import_another: "Importar otro archivo",
      },
      error: {
        unable: "No se ha podido importar este archivo.",
      },
      idle: {
        description_1:
          "Puedes importar usuarios, empresas, contactos, notas y tareas.",
        description_2:
          "Los datos deben estar en un archivo JSON con esta estructura:",
      },
      status: {
        all_success: "Todos los registros se importaron correctamente.",
        complete: "Importación terminada.",
        failed: "Con errores",
        imported: "Importados",
        in_progress: "Importación en curso, no salgas de esta página.",
        some_failed: "Algunos registros no se importaron.",
        table_caption: "Estado de la importación",
      },
      title: "Importar datos",
    },
    settings: {
      about: "Acerca de",
      companies: {
        sectors: "Sectores",
      },
      dark_mode_logo: "Logo para el modo oscuro",
      deals: {
        categories: "Categorías",
        currency: "Moneda",
        pipeline_help:
          "Elige qué etapas de la oportunidad cuentan como parte del embudo.",
        pipeline_statuses: "Estados del embudo",
        stages: "Etapas",
        pipelines: "Embudos",
        pipelines_help:
          "Cada embudo tiene sus propias etapas: ventas nuevas, renovaciones, cobranza… Las oportunidades viven en un solo embudo.",
        pipeline_name: "Nombre del embudo",
        add_pipeline: "Agregar embudo",
        remove_pipeline: "Quitar embudo",
        pipeline_in_use:
          "No se puede quitar el embudo «%{name}»: todavía tiene oportunidades.",
        lost_stages: "Etapas de pérdida",
        lost_stages_help:
          "Al mover una oportunidad a una de estas etapas se preguntará por qué se perdió.",
        loss_reasons: "Motivos de pérdida",
        loss_reasons_help:
          "Las opciones que se ofrecerán al perder una oportunidad. Saber por qué se pierde es lo que convierte el historial en una decisión.",
      },
      light_mode_logo: "Logo para el modo claro",
      notes: {
        statuses: "Estados",
      },
      reset_defaults: "Restablecer los valores por defecto",
      save_error: "No se pudo guardar la configuración",
      saved: "Configuración guardada correctamente",
      saving: "Guardando...",
      tasks: {
        types: "Tipos",
      },
      preferences: "Preferencias",
      title: "Ajustes",
      app_title: "Nombre de la aplicación",
      sections: {
        branding: "Marca",
        custom_fields: "Campos personalizados",
      },
      custom_fields: {
        help: "Agrega los datos propios de tu negocio a contactos, empresas y oportunidades: una inmobiliaria puede guardar «Superficie», una escuela «Grado». Para el tipo «Lista de opciones», escribe las opciones separadas por comas.",
      },
      validation: {
        duplicate: "%{display_name} duplicados: %{items}",
        in_use:
          "No se pueden quitar %{display_name} que todavía usan algunas oportunidades: %{items}",
        validating: "Validando…",
        entities: {
          categories: "categorías",
          stages: "etapas",
        },
      },
    },
    theme: {
      dark: "Oscuro",
      label: "Tema",
      light: "Claro",
      system: "Del sistema",
    },
    language: "Idioma",
    navigation: {
      label: "Navegación del CRM",
    },
    profile: {
      inbound: {
        description:
          "Puedes empezar a enviar correos a la dirección de entrada de tu servidor, por ejemplo añadiéndola al campo %{field}. Vinqulia los procesará y añadirá notas a los contactos correspondientes.",
        title: "Correo de entrada",
      },
      mcp: {
        title: "Servidor MCP",
        description:
          "Usa esta dirección para conectar tu asistente de IA con los datos de tu CRM mediante el Model Context Protocol (MCP).",
      },
      password: {
        change: "Cambiar la contraseña",
      },
      password_reset_sent:
        "Te hemos enviado un correo para restablecer tu contraseña",
      record_not_found: "No se encontró el registro",
      title: "Perfil",
      updated: "Tu perfil se ha actualizado",
      update_error: "Se produjo un error. Inténtalo de nuevo",
    },
    validation: {
      invalid_url: "Debe ser una URL válida",
      invalid_linkedin_url: "La URL debe ser de linkedin.com",
    },
  },
} as const;

type MessageSchema<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends Record<string, unknown>
      ? MessageSchema<T[K]>
      : never;
};

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown>
    ? DeepPartial<T[K]>
    : T[K];
};

export type CrmMessages = MessageSchema<typeof spanishCrmMessages>;
export type PartialCrmMessages = DeepPartial<CrmMessages>;
