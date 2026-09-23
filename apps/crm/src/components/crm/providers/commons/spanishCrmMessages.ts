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
      merge: {
        action: "Fusionar con otra empresa",
        title: "Fusionar empresa",
        description:
          "La misma empresa dada de alta dos veces: todo lo de esta pasa a la que elijas y esta se elimina.",
        current_company: "Empresa actual (se eliminará)",
        target_company: "Empresa destino (se conservará)",
        what_will_be_merged: "Qué pasa a la empresa destino:",
        contacts: "%{smart_count} contacto |||| %{smart_count} contactos",
        deals: "%{smart_count} oportunidad |||| %{smart_count} oportunidades",
        tickets: "%{smart_count} ticket |||| %{smart_count} tickets",
        data: "Los datos que le falten a la empresa destino (dirección, web, teléfono…) se toman de esta.",
        warning_title: "Atención: no se puede deshacer",
        warning_description:
          "Contactos, oportunidades, tickets, cotizaciones, contratos y facturas quedarán en la empresa destino.",
        confirm: "Fusionar empresas",
        merging: "Fusionando…",
        select_target: "Elige la empresa con la que quieres fusionar",
        success: "Empresas fusionadas",
        error: "No se pudieron fusionar las empresas",
      },
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
        tax_regime: "Régimen fiscal (para facturar)",
        cfdi_use: "Uso del CFDI (para facturar)",
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
      nb_tickets: "%{smart_count} ticket |||| %{smart_count} tickets",
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
        lead_score: "Puntaje",
      },
      status_auto: {
        automatic:
          "Se calcula solo con la actividad: notas, tareas hechas y oportunidades abiertas. Si lo cambias, tu elección manda 14 días.",
        manual_until:
          "Fijado a mano. Vuelve a calcularse solo a partir del %{date}.",
      },
      lead_score: {
        label: "Puntaje: %{score}",
        hot: "Caliente",
        warm: "Tibio",
        cold: "Frío",
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
      archive: {
        action: "Archivar contacto",
        restore: "Recuperar contacto",
        badge: "Archivado el %{date}",
        confirm_title: "¿Archivar este contacto?",
        confirm_description:
          "Dejará de aparecer en las listas y en los selectores, pero conserva sus notas, tareas y oportunidades. Puedes recuperarlo cuando quieras.",
        archived: "Contacto archivado",
        restored: "Contacto recuperado",
        error: "No se pudo archivar el contacto",
        bulk_action: "Archivar",
        bulk_confirm_title:
          "¿Archivar %{smart_count} contacto? |||| ¿Archivar %{smart_count} contactos?",
        bulk_archived:
          "%{smart_count} contacto archivado |||| %{smart_count} contactos archivados",
        filter: "Archivados",
        filter_only: "Solo archivados",
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
      send_email: {
        action: "Enviar correo",
        to: "Para: %{email}",
        subject: "Asunto",
        message: "Mensaje",
        send: "Enviar",
        sending: "Enviando...",
        cancel: "Cancelar",
        success: "Correo enviado",
        error: "No se pudo enviar el correo",
      },
      send_whatsapp: {
        action: "Enviar WhatsApp",
        to: "Para: %{phone}",
        message: "Mensaje",
        send: "Enviar",
        sending: "Enviando...",
        cancel: "Cancelar",
        success: "WhatsApp enviado",
        error: "No se pudo enviar el mensaje",
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
        probability: "Probabilidad de cierre",
        stage: "Etapa",
        pipeline: "Embudo",
        loss_reason: "Motivo de pérdida",
      },
      no_amount: "Sin importe",
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
      weighted: "%{amount} ponderado",
      weighted_help:
        "Importe × probabilidad de cierre de la etapa (%{probability} %). Se configura en Ajustes → Oportunidades.",
      history: {
        title: "Historial",
        empty: "Sin cambios registrados.",
        system: "Sistema",
        unassigned: "sin responsable",
        created: "Oportunidad creada en %{stage}",
        stage: "Etapa: %{from} → %{to}",
        amount: "Importe: %{from} → %{to}",
        sales_id: "Responsable: %{to}",
        won: "Ganada y archivada",
        archived: "Archivada en %{stage}",
        unarchived: "Devuelta al tablero",
      },
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
      board: {
        show_more_of: "Ver %{count} más de %{total}",
        truncated:
          "El tablero muestra %{shown} de %{total} oportunidades abiertas. Filtra por empresa, categoría o responsable para ver el resto.",
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
        ticket_id: "Ticket",
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
    tickets: {
      name: "Ticket |||| Tickets",
      forcedCaseName: "Ticket",
      fields: {
        subject: "Asunto",
        description: "Descripción",
        status: "Estado",
        contact_id: "Contacto",
        company_id: "Empresa",
        sales_id: "Responsable",
        created_at: "Creado",
        priority: "Prioridad",
        category: "Categoría",
        source: "Origen",
        resolution: "Motivo de cierre",
        last_activity_at: "Última actividad",
        closed_at: "Cerrado",
        due_at: "Vence",
        first_response_at: "Primera respuesta",
        deal_id: "Oportunidad relacionada",
        contract_id: "Contrato relacionado",
      },
      sla: {
        response_pending: "Responder en %{time}",
        response_overdue: "Sin responder: venció hace %{time}",
        response_met: "Primera respuesta a tiempo",
        response_late: "Primera respuesta con %{time} de retraso",
        due_pending: "Vence en %{time}",
        due_overdue: "Vencido hace %{time}",
        due_met: "Resuelto a tiempo",
        due_late: "Resuelto con %{time} de retraso",
      },
      reply: {
        action: "Responder por correo",
        title: "Responder al cliente",
        no_email: "El contacto no tiene correo registrado",
        success: "Respuesta enviada y guardada en el ticket",
        error: "No se pudo enviar la respuesta",
      },
      views: {
        table: "Tabla",
        board: "Tablero",
      },
      board: {
        show_more: "Ver %{count} más",
      },
      ai: {
        summarize: "Resumen con IA",
        summary_title: "Resumen del hilo (IA)",
        summary_note_prefix: "Resumen generado con IA:",
        save_as_note: "Guardar como nota",
        summary_saved: "Resumen guardado como nota",
        summary_error: "No se pudo generar el resumen",
        classify: "Sugerir prioridad y categoría con IA",
        classify_empty: "Escribe el asunto o la descripción primero",
        classify_error: "No se pudo obtener la sugerencia",
      },
      survey: {
        title: "Encuesta de satisfacción",
        rating_1: "Muy mala",
        rating_2: "Mala",
        rating_3: "Regular",
        rating_4: "Buena",
        rating_5: "Excelente",
      },
      merge: {
        action: "Fusionar",
        title: "Fusionar tickets",
        description:
          "Las notas y el historial del ticket descartado pasan al que conserves; el descartado se cierra como duplicado.",
        other: "Fusionar con",
        keep: "Conservar",
        confirm: "Fusionar",
        success: "Tickets fusionados",
        error: "No se pudieron fusionar los tickets",
      },
      action: {
        new: "Nuevo ticket",
        create: "Crear ticket",
        edit: "Editar ticket",
        assign_me: "Asignármelo",
        close_many: "Cerrar seleccionados",
      },
      unassigned: "Sin asignar",
      no_category: "Sin categoría",
      filters: {
        mine: "Mis tickets",
        unassigned: "Sin asignar",
        open: "Solo abiertos",
        overdue: "Vencidos",
      },
      sources: {
        manual: "Creado a mano",
        web_form: "Formulario web",
        mcp: "Asistente de IA",
        api: "API",
        voice_agent: "Agente de voz",
        email: "Correo",
      },
      dates: {
        created: "Creado el %{date}",
        closed: "Cerrado el %{date}",
      },
      close: {
        title: "Cerrar ticket",
        description:
          "Indica cómo terminó. Queda en el historial y en los informes; puedes reabrirlo después.",
        note: "Nota de cierre (opcional)",
        note_placeholder: "Qué se hizo o qué se le dijo al cliente",
        confirm: "Cerrar ticket",
      },
      duplicates: {
        title:
          "Este contacto ya tiene %{smart_count} ticket abierto |||| Este contacto ya tiene %{smart_count} tickets abiertos",
      },
      history: {
        title: "Historial",
        empty: "Sin cambios registrados.",
        system: "Sistema",
        created: "Ticket creado",
        status: "Estado: %{from} → %{to}",
        priority: "Prioridad: %{from} → %{to}",
        category: "Categoría: %{from} → %{to}",
        sales_id: "Asignado a %{to}",
      },
      notifications: {
        update_error: "No se pudo actualizar el ticket",
        closed_many:
          "%{smart_count} ticket cerrado |||| %{smart_count} tickets cerrados",
        assigned_many:
          "%{smart_count} ticket asignado a ti |||| %{smart_count} tickets asignados a ti",
      },
      empty: {
        title: "No hay tickets",
        description: "Parece que tu lista de tickets está vacía.",
      },
      open_of_total: "%{open} abiertos de %{total}",
      other_from_contact: "Otros tickets de este contacto",
      other_count:
        "%{smart_count} ticket más de este contacto |||| %{smart_count} tickets más de este contacto",
      no_other_from_contact: "Este contacto no tiene más tickets.",
    },
    customer_summary: {
      name: "Cliente |||| Clientes",
      forcedCaseName: "Cliente",
      empty: {
        title: "Aún no hay clientes",
        description:
          "Una empresa pasa a ser cliente cuando registras su primera compra o contrato, a mano desde su ficha o desde tu sistema de facturación.",
      },
    },
    products: {
      name: "Producto |||| Productos",
      forcedCaseName: "Producto",
      empty:
        "Aún no hay productos. Conecta tu catálogo en Ajustes → Conectores y sincronízalo.",
      active: "Activo",
      inactive: "Ya no está en el catálogo",
      fields: {
        name: "Producto",
        sku: "SKU",
        unit_price: "Precio",
        active: "Estado",
        synced_at: "Sincronizado",
      },
    },
    invoices: {
      name: "Factura |||| Facturas",
      forcedCaseName: "Factura",
      empty:
        "Aún no hay facturas. Se piden desde una cotización aceptada, en su oportunidad.",
      download_pdf: "Descargar PDF",
      download_xml: "Descargar XML",
      fields: {
        folio: "Folio",
        company_id: "Empresa",
        quote_id: "Cotización",
        status: "Estado",
        total: "Total",
        issued_at: "Fecha",
        downloads: "Descargas",
      },
      filters: {
        from: "Desde",
        to: "Hasta",
      },
      status: {
        stamped: "Timbrada",
        draft: "Sin timbrar",
        cancelled: "Cancelada",
        error: "Con error",
      },
    },
    quotes: {
      name: "Cotización |||| Cotizaciones",
      forcedCaseName: "Cotización",
      empty:
        "Aún no hay cotizaciones. Se crean desde la ficha de una oportunidad.",
      fields: {
        number: "Folio",
        title: "Título",
        company_id: "Empresa",
        contact_id: "Contacto",
        deal_id: "Oportunidad",
        status: "Estado",
        total: "Total",
        sent_at: "Enviada",
        valid_until: "Vigencia",
        created_at: "Creada",
        sales_id: "Responsable",
      },
      filters: {
        from: "Creada desde",
        to: "Creada hasta",
      },
      sent_on: "enviada el %{date}",
    },
    affiliates: {
      name: "Afiliado |||| Afiliados",
      forcedCaseName: "Afiliado",
      empty: {
        title: "No hay afiliados",
        description:
          "Un contacto se vuelve afiliado solo cuando gana una oportunidad en el embudo configurado en Módulos > Afiliados.",
      },
    },
    sales: {
      name: "Usuario |||| Usuarios",
      cannot_delete_self:
        "No puedes eliminar tu propio usuario. Quita tu selección para borrar a los demás.",
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
        no_due_date: "Sin fecha",
        overdue: "Vencidas",
        this_week: "Esta semana",
        today: "Hoy",
        tomorrow: "Mañana",
        with_pending: "Con tareas pendientes",
      },
      views: {
        calendar: "Calendario",
        list: "Lista",
      },
      calendar: {
        day_count: "%{smart_count} tarea |||| %{smart_count} tareas",
        day_empty: "No hay tareas para este día.",
        more: "+%{smart_count} más |||| +%{smart_count} más",
        next_month: "Mes siguiente",
        previous_month: "Mes anterior",
        today: "Hoy",
      },
      show_done: "Mostrar completadas",
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
    reports: {
      title: "Informes",
      intro:
        "Dónde se atoran las oportunidades, quién está vendiendo y por qué se pierde. Sobre las oportunidades creadas en el periodo elegido.",
      total: "Oportunidades",
      won: "Ganadas",
      lost: "Perdidas",
      conversion: "Conversión",
      by_stage: "Oportunidades por etapa",
      forecast: {
        title: "Pronóstico",
        intro:
          "Lo que sigue abierto en este embudo, por el mes en que se espera cerrar. Ponderado = importe × probabilidad de cierre de su etapa (Ajustes → Oportunidades).",
        open: "Abierto",
        weighted: "Ponderado",
        open_count: "Oportunidades abiertas",
        no_date: "Sin fecha prevista o más adelante",
        by_stage: "Por etapa",
        stage: "Etapa",
        count: "Nº",
        amount: "Importe",
        probability: "Prob.",
        weighted_amount: "Ponderado",
        empty: "No hay oportunidades abiertas en este embudo.",
      },
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
      support: {
        title: "Soporte",
        created: "Tickets creados",
        closed: "Cerrados",
        open_now: "Abiertos ahora",
        overdue_now: "Vencidos ahora",
        first_response: "Primera respuesta (media)",
        resolution: "Resolución (media)",
        sla: "Resueltos en plazo",
        csat: "Satisfacción (CSAT)",
        hours: "%{count} h",
        days: "%{count} días",
        footnote:
          "%{reopened} reaperturas en el periodo · %{surveys} encuestas respondidas · el cumplimiento se calcula sobre %{sla_count} tickets cerrados con plazo.",
        by_category: "Tickets creados por categoría",
        by_owner: "Tickets abiertos por responsable",
        no_open: "No hay tickets abiertos.",
      },
      quotes: {
        title: "Cotizaciones",
        empty: "No se emitió ninguna cotización en este periodo.",
        issued: "Emitidas",
        quoted: "Importe cotizado",
        accepted: "Importe aceptado",
        pending: "Pendiente de respuesta",
        acceptance:
          "Tasa de aceptación: %{rate} % de las %{count} que ya tuvieron respuesta.",
      },
    },
    public_forms: {
      title: "Formularios web",
      intro:
        "Un enlace o iframe que pegas en tu propia página web. Según el tipo que elijas, cada envío crea un contacto o abre un ticket de soporte solo — nadie de tu equipo tiene que capturarlo a mano.",
      add: "Agregar",
      name_placeholder: "Nombre del formulario (ej. Contacto sitio web)",
      empty: "Aún no hay formularios. Crea el primero arriba.",
      open: "Abrir",
      copy_link: "Copiar enlace",
      copy_iframe: "Copiar iframe",
      toggle: "Activar o desactivar",
      deleted: "Formulario eliminado",
      type: {
        lead: "Captación de contactos",
        ticket: "Ticket de soporte",
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
        template: "Plantilla",
        template_help:
          "Solo aparecen las plantillas activas. El asunto, el cuerpo y el diseño salen de ella.",
        due_in_days: "Vence en (días)",
        due_in_days_help: "Déjalo vacío si la tarea no lleva fecha límite.",
        owner: "Responsable",
        days_after: "Tras cuántos días sin respuesta",
        days_after_help:
          "Se revisa cada hora. Cuenta desde que se envió; solo cotizaciones enviadas o vistas que siguen vigentes. Avisa una sola vez por cotización.",
        days_before: "Con cuántos días de antelación",
        days_before_help:
          "Se revisa cada hora. La tarea o el correo van al contacto de la empresa con actividad más reciente; una empresa sin contactos no recibe aviso.",
        hours_after: "Tras cuántas horas",
        hours_after_help:
          "Se revisa cada hora. Solo tickets abiertos; avisa una sola vez por ticket.",
        priority: "Solo con prioridad",
        any_priority: "Cualquier prioridad",
      },
      when: {
        contact_created: "Se crea un contacto",
        deal_created: "Se crea una oportunidad",
        deal_stage: "Una oportunidad llega a una etapa",
        deal_stage_named: "Una oportunidad llega a «%{stage}»",
        renewal_due: "Se acerca la renovación de un contrato",
        renewal_due_named:
          "Faltan %{days} días para que se renueve un contrato",
        quote_unanswered: "Una cotización lleva días sin respuesta",
        quote_unanswered_named:
          "Una cotización lleva %{days} días enviada sin respuesta",
        ticket_created: "Se crea un ticket",
        ticket_created_named: "Se crea un ticket con prioridad «%{priority}»",
        ticket_unanswered: "Un ticket lleva horas sin primera respuesta",
        ticket_unanswered_named:
          "Un ticket lleva %{hours} horas sin primera respuesta",
        ticket_unassigned: "Un ticket lleva horas sin responsable",
        ticket_unassigned_named:
          "Un ticket lleva %{hours} horas sin responsable",
        ticket_overdue: "Un ticket lleva horas vencido",
        ticket_overdue_named: "Un ticket lleva %{hours} horas vencido",
        ticket_closed: "Se cierra un ticket",
      },
      then: {
        task: "Crear una tarea",
        assign: "Asignar responsable",
        email: "Enviar un correo",
        task_named: "Crear la tarea «%{text}» para dentro de %{days} días",
        task_named_no_due: "Crear la tarea «%{text}», sin fecha límite",
        assign_named: "Asignar a %{name}",
        email_named: "Enviar el correo de la plantilla «%{name}»",
      },
    },
    billing: {
      title: "Plan y facturación",
      intro:
        "Tu plan, lo que llevas consumido y los planes disponibles. Los cobros se hacen en Stripe; aquí nunca se guardan datos de tarjetas.",
      your_plan: "Tu plan",
      plan_named: "Plan %{plan}",
      current_plan: "Tu plan actual",
      plans_title: "Planes disponibles",
      loading_plans: "Cargando planes…",
      no_plans: "Esta aplicación no tiene planes publicados.",
      checking: "Consultando tu plan…",
      retry: "Volver a comprobar",
      choose_plan: "Elegir este plan",
      interval_monthly: "Mensual",
      interval_yearly: "Anual",
      per_year: "al año",
      yearly_equivalent: "equivale a %{amount} al mes",
      save_percent: "Ahorra %{percent}%",
      switch_to_yearly: "Cambiar a anual",
      switch_to_monthly: "Cambiar a mensual",
      yearly_suffix: "(anual)",
      free_plan_hint:
        "Se asigna automáticamente o lo asigna un administrador de KontrolIA Auth.",
      ask_admin:
        "Solo un administrador de tu organización puede cambiar de plan.",
      trial_days:
        "%{smart_count} día de prueba |||| %{smart_count} días de prueba",
      unlimited: "sin límite",
      open_portal: "Gestionar suscripción",
      update_payment_method: "Actualizar método de pago",
      manual_subscription:
        "Suscripción asignada a mano: para cambiarla, habla con quien administra KontrolIA Auth.",
      not_required: "Esta aplicación no exige plan para tu organización.",
      self_hosted:
        "Esta instalación no usa planes: funciona por cuenta propia, sin límites de consumo ni cobros.",
      no_subscription: "Tu organización no tiene ningún plan asignado.",
      renews_on: "se renueva el %{date}",
      ends_on: "termina el %{date}",
      usage_title: "Consumo",
      usage_of: "%{used} de %{limit} %{period}",
      usage_unlimited: "%{used} · sin límite",
      overage_notice:
        "Tus %{limit} %{name} %{period} se agotaron; cada extra cuesta %{price}.",
      overage_accumulated: "%{units} extra · %{amount} %{period}",
      overage_price: "extra a %{price} por unidad",
      overage_periods: {
        day: "de hoy",
        month: "del mes",
        year: "del año",
        lifetime: "del plan",
      },
      no_limits: "Tu plan no tiene límites de consumo.",
      status: {
        trialing: "En periodo de prueba",
        active: "Activo",
        past_due: "Pago pendiente",
        canceled: "Cancelado",
        expired: "Vencido",
      },
      blocked: {
        no_subscription: {
          title: "Elige un plan para empezar",
          text: "Tu organización todavía no tiene un plan para esta aplicación. Elige uno para continuar.",
        },
        past_due: {
          title: "Actualiza tu método de pago",
          text: "El último cobro de tu plan %{plan} no se pudo realizar. Actualiza tu tarjeta para recuperar el acceso.",
        },
        canceled: {
          title: "Tu plan terminó",
          text: "La suscripción al plan %{plan} se canceló. Elige un plan para volver a entrar.",
        },
        expired: {
          title: "Tu plan terminó",
          text: "La suscripción al plan %{plan} venció. Elige un plan para volver a entrar.",
        },
        seats: {
          title: "Tu organización no tiene cupo para más usuarios",
          text: "%{detail} Pide a un administrador que amplíe el plan, o que libere un lugar.",
        },
      },
      return: {
        checking: "Confirmando tu pago… puede tardar unos segundos.",
        ok_title: "¡Listo! Ya tienes el plan %{plan}",
        ok_text: "Tu organización ya puede usar todo lo que incluye.",
        enter: "Entrar",
        pending_title: "Tu pago está en camino",
        pending_text:
          "Stripe nos avisará en unos segundos. Si ya pagaste, vuelve a comprobar; si no, tu plan aparecerá en cuanto llegue la confirmación.",
        session_lost_title: "Perdimos tu sesión al comprobar",
        session_lost_text:
          "Tu pago no se pierde por esto: solo hace falta refrescar la página para retomar la sesión y ver tu plan.",
        reload: "Refrescar la página",
      },
      errors: {
        generic: "No se pudo completar la operación. Inténtalo de nuevo.",
        unreachable:
          "No se pudo consultar tu plan en KontrolIA Auth. Revisa tu conexión e inténtalo de nuevo.",
      },
      enterprise: {
        name: "Enterprise",
        tagline: "Para operaciones grandes o que necesitan el dato en casa",
        // Resumen de apps/web/content/enterprise.ts: si cambian los precios
        // allí, cambia esto.
        from: "Desde $79,000 MXN / año",
        from_detail:
          "Licencia anual en nube dedicada; en tus servidores desde $99,000. Implementación aparte.",
        features: {
          dedicated:
            "Instancia solo para ti: tu base, tu dominio, tus respaldos",
          modalities: "En nuestra nube o instalado en tus servidores",
          unlimited: "Todos los módulos, sin límite de contactos ni embudos",
          implementation: "Implementación acompañada y migración de tus datos",
          sla: "SLA y soporte con responsable asignado",
          integrations: "Integraciones a medida y SSO",
        },
        action: "Hablemos",
        details: "Ver qué incluye y estimar tu inversión",
        dialog_title: "Plan Enterprise",
        dialog_description:
          "Los mismos datos que pide la página de Enterprise. Con esto preparamos la propuesta antes de llamarte; lo que ya sabemos viene puesto.",
        name_field: "Tu nombre",
        company_field: "Empresa",
        email_field: "Correo de contacto",
        email_placeholder: "a@tuempresa.com",
        phone_field: "Teléfono o WhatsApp (opcional)",
        mode_field: "Modalidad",
        mode_cloud: "Nube dedicada — la operamos nosotros",
        mode_onpremise: "En tus servidores — el dato no sale de tu casa",
        users_field: "Usuarios que entrarían al CRM",
        users_help:
          "De aquí sale la banda de precio. Viene con los que usan tu CRM hoy; cámbialo si van a ser más.",
        message_field: "Cuéntanos de tu proyecto",
        message_placeholder:
          "Infraestructura, integraciones, equipo, plazos… lo que nos ayude a entender qué necesitas.",
        cancel: "Cancelar",
        send: "Enviar",
        sending: "Enviando...",
        success: "Listo, en breve te contactamos",
        error: "No se pudo enviar tu mensaje",
      },
    },
    timeline: {
      title: "Línea de tiempo",
      empty: "Todavía no hay actividad con este contacto.",
      count: "%{smart_count} evento |||| %{smart_count} eventos",
      loading: "Cargando…",
      open: "Abrir",
      search: {
        placeholder: "Buscar en notas, tareas y demás…",
        label: "Buscar en la línea de tiempo",
        empty: "Nada coincide con «%{q}».",
      },
      filters: {
        label: "Filtrar la línea de tiempo",
        all: "Todo",
        tasks: "Tareas",
        deals: "Oportunidades",
        tickets: "Tickets",
        quotes: "Cotizaciones",
      },
      events: {
        note: "Nota",
        task: "Tarea",
        task_done: "Tarea completada",
        deal: "Oportunidad creada",
        deal_stage: "Cambio de etapa",
        deal_stage_detail: "de %{from} a %{to}",
        deal_won: "Oportunidad ganada",
        deal_archived: "Oportunidad archivada",
        ticket: "Ticket abierto",
        ticket_closed: "Ticket cerrado",
        quote: "Cotización enviada",
        quote_accepted: "Cotización aceptada",
        quote_rejected: "Cotización rechazada",
      },
    },
    team: {
      invite_action: "Invitar",
      dialog_title: "Invitar a tu organización",
      dialog_description:
        "Se le enviará un correo de invitación con el rol que elijas.",
      email_field: "Correo electrónico",
      role_field: "Rol",
      role_placeholder: "Elige un rol",
      loading_roles: "Cargando roles…",
      no_roles: "Tu organización todavía no tiene roles para invitar.",
      cancel: "Cancelar",
      send: "Enviar invitación",
      sending: "Enviando…",
      success: "Invitación enviada",
      error: "No se pudo enviar la invitación",
      error_loading_roles: "No se pudieron cargar los roles de tu organización",
      no_organization: "Tu cuenta no tiene una organización activa.",
      members_title: "Miembros",
      members_intro:
        "Quiénes forman parte de esta organización en KontrolIA Auth y qué rol tienen.",
      no_members: "Todavía no hay miembros.",
      you: "Tú",
      member_status_active: "Activo",
      member_status_suspended: "Suspendido",
      remove_member: "Quitar",
      remove_member_confirm:
        "¿Quitar a %{email} de la organización? Dejará de tener acceso a todo lo de esta organización.",
      member_removed: "Miembro quitado",
      invitations_title: "Invitaciones",
      no_invitations: "No hay invitaciones pendientes.",
      invitation_expires: "vence el %{date}",
      invitation_accepted: "aceptada",
      revoke_invitation: "Revocar",
      invitation_revoked: "Invitación revocada",
      only_admins:
        "Solo un Owner o Admin de la organización puede invitar o quitar miembros.",
      loading: "Cargando…",
    },
    organizations: {
      title: "Organizaciones",
      intro:
        "Cada organización es un espacio de trabajo aparte, con sus propios datos, su equipo y su plan. Puedes crear una nueva y contratarle un plan aunque la actual no tenga ninguno.",
      yours_title: "Tus organizaciones",
      active: "Activa",
      switch: "Cambiar",
      rename: "Renombrar",
      role_owner: "Owner",
      role_admin: "Admin",
      role_member: "Miembro",
      new_action: "Nueva organización",
      new_dialog_title: "Nueva organización",
      new_dialog_description:
        "Serás Owner y administrador de %{app} en ella. Después podrás contratarle un plan e invitar a tu equipo.",
      name_field: "Nombre de la organización",
      name_placeholder: "Mi empresa",
      create: "Crear",
      creating: "Creando…",
      created: "Organización creada. Cambiando a ella…",
      created_with_warning:
        "La organización se creó, pero quedó configuración pendiente: %{detail}",
      rename_dialog_title: "Renombrar organización",
      save: "Guardar",
      saving: "Guardando…",
      renamed: "Nombre actualizado",
      cancel: "Cancelar",
      error_loading: "No se pudieron cargar tus organizaciones.",
      back: "Volver a la aplicación",
    },
    quotes: {
      section_title: "Cotizaciones",
      new: "Nueva cotización",
      edit_title: "Editar %{number}",
      empty:
        "Sin cotizaciones. Crea una para mandarle al cliente un documento que pueda aceptar desde su correo.",
      from_template: "Desde plantilla",
      choose_template: "Elige una plantilla…",
      fields: {
        title: "Título",
        valid_until: "Válida hasta",
        currency: "Moneda",
        contract_period: "Al aceptarse",
        contract_period_help:
          "Con periodicidad, al aceptarse nace un contrato que se renueva; sin ella, una compra puntual (módulo Clientes).",
        items: "Líneas",
        description: "Concepto",
        quantity: "Cant.",
        unit_price: "Precio",
        discount_pct: "Desc. %",
        tax_rate: "IVA %",
        notes: "Alcance y condiciones",
        notes_help:
          "Va debajo de las líneas en el documento: qué incluye, qué no, forma de pago, plazos.",
      },
      period: {
        none: "Compra puntual",
        monthly: "Contrato mensual",
        quarterly: "Contrato trimestral",
        yearly: "Contrato anual",
      },
      subtotal: "Subtotal",
      tax: "IVA",
      total: "Total",
      no_lines: "Añade al menos una línea con concepto.",
      created: "Cotización creada",
      updated: "Cotización actualizada",
      deleted: "Cotización eliminada",
      save_error: "No se pudo guardar la cotización",
      status: {
        draft: "Borrador",
        sent: "Enviada",
        viewed: "Vista",
        accepted: "Aceptada",
        rejected: "Rechazada",
        expired: "Vencida",
      },
      valid_until_short: "vence %{date}",
      viewed_on: "vista el %{date}",
      accepted_by: "aceptó %{name}",
      actions: "Acciones",
      view: "Ver como el cliente",
      copy_link: "Copiar enlace",
      link_copied: "Enlace copiado",
      download_pdf: "Descargar PDF",
      send: "Enviar",
      resend: "Reenviar",
      send_title: "Enviar %{number}",
      send_description:
        "El cliente recibe un correo con el enlace para verla y aceptarla. Al abrirlo, la cotización pasa a «Vista».",
      send_to: "Enviar a",
      send_to_placeholder: "Vacío = el correo del contacto de la oportunidad",
      send_template: "Plantilla de correo",
      send_template_default: "Correo estándar (sin plantilla)",
      send_message: "Mensaje",
      send_message_placeholder:
        "Opcional. Un par de líneas para acompañar la cotización.",
      sent_to: "Enviada a %{email}",
      send_error: "No se pudo enviar",
      list: {
        pending: "Pendientes de respuesta",
        accepted: "Aceptadas",
        acceptance_rate: "Tasa de aceptación",
        acceptance_rate_help: "Aceptadas entre las que ya tuvieron respuesta",
        count: "%{smart_count} cotización |||| %{smart_count} cotizaciones",
      },
      pick_product: "Elegir del catálogo",
      search_product: "Buscar producto por nombre o SKU…",
      no_products: "Sin productos que coincidan.",
      mark_accepted: "Marcar aceptada (acordado por otro medio)",
      mark_rejected: "Marcar rechazada",
      marked_accepted: "Cotización aceptada",
      marked_rejected: "Cotización rechazada",
      settings: {
        title: "Cotizaciones",
        intro:
          "Quién emite las cotizaciones, el IVA por defecto y las plantillas con líneas y condiciones listas para usar.",
        issuer: "Emisor",
        issuer_help:
          "Lo que aparece en la cabecera del documento que ve el cliente.",
        issuer_name: "Nombre comercial o razón social",
        issuer_tax_id: "RFC",
        issuer_address: "Dirección",
        issuer_email: "Correo",
        issuer_phone: "Teléfono",
        logo_upload: "Subir logo",
        logo_replace: "Cambiar logo",
        logo_remove: "Quitar",
        logo_empty: "Sin logo",
        logo_help:
          "PNG o JPG, hasta 2 MB. Sale en la cabecera del documento que ve el cliente y en el PDF. Se guarda al pulsar Guardar, como el resto del emisor.",
        logo_uploaded: "Logo subido. Pulsa Guardar para dejarlo fijo.",
        logo_error: "No se pudo subir el logo",
        issuer_logo: "Logo",
        tax_rate: "IVA por defecto (%)",
        templates: "Plantillas",
        templates_help:
          "Al crear una cotización puedes partir de una plantilla: rellena título, líneas, condiciones y vigencia.",
        new_template: "Nueva plantilla",
        template_name: "Nombre de la plantilla",
        template_valid_days: "Vigencia (días)",
        no_templates: "Sin plantillas todavía.",
        saved: "Guardado",
        save_error: "No se pudo guardar",
        delete_template: "Eliminar plantilla",
      },
    },
    email_templates: {
      title: "Plantillas de correo",
      action: {
        new: "Nueva plantilla",
        create: "Crear plantilla",
      },
      fields: {
        name: "Nombre de la plantilla",
        subject: "Asunto",
        subject_help:
          "Puedes usar campos aquí también, por ejemplo: Hola {{contacto.nombre}}",
        body: "Cuerpo del correo",
        active: "Activa",
        updated_at: "Última modificación",
        cta_text: "Texto del botón",
        cta_text_help:
          "Déjalo vacío si el correo no pide ninguna acción concreta.",
        cta_url: "A dónde lleva el botón",
        accent_color: "Color principal",
        accent_color_help:
          "En hexadecimal, por ejemplo #2563eb. Se usa en los títulos, los enlaces y el botón.",
        footer_text: "Texto del pie",
      },
      design: "Diseño del correo",
      active: "Activa",
      inactive: "Inactiva",
      merge_fields: "Campos que se rellenan solos",
      merge_fields_help:
        "Pulsa uno para insertarlo donde tengas el cursor. Al enviar, cada campo se sustituye por el dato real del contacto, su empresa o la oportunidad.",
      preview: "Vista previa",
      ai_title: "Generar con inteligencia artificial",
      ai_intro:
        "Describe qué quieres que diga el correo y se redacta solo, usando los campos disponibles. Después lo puedes ajustar a mano.",
      ai_placeholder:
        "Ej. Dale la bienvenida al contacto, dile que en breve le llamamos para agendar la demo, e invítalo a hacer su diagnóstico.",
      generate: "Generar",
      generating: "Generando...",
      upload_logo: "Subir logo",
      uploading_logo: "Subiendo...",
      logo_uploaded: "Logo subido. Aparece en la cabecera del correo.",
      generated: "Plantilla generada. Revísala antes de guardar.",
      entity_contact: "Contacto",
      entity_company: "Empresa",
      entity_deal: "Oportunidad",
      entity_contract: "Contrato",
      entity_quote: "Cotización",
      entity_ticket: "Ticket",
      empty: {
        title: "No hay plantillas",
        description:
          "Crea una plantilla para reutilizar el mismo correo desde las automatizaciones.",
      },
    },
    ai: {
      title: "Inteligencia artificial",
      intro:
        "La IA que redacta plantillas de correo y resume hilos. Viene incluida: no tienes que contratar nada aparte ni pegar ninguna clave.",
      provider: "Proveedor",
      api_key: "Clave de API",
      api_key_placeholder: "Pega aquí la clave de tu proveedor",
      api_key_saved:
        "Ya hay una clave guardada — escribe una nueva para reemplazarla",
      api_key_help:
        "Se guarda del lado del servidor y no vuelve a mostrarse nunca, ni siquiera a un administrador.",
      model: "Modelo",
      model_default: "El recomendado",
      model_default_help:
        "Deja que Vinqulia elija por ti. Es lo que conviene salvo que tengas un motivo concreto.",
      model_other: "Otro",
      model_other_help:
        "Escribe el identificador exacto, tal como lo publica tu proveedor. Úsalo si acaba de salir un modelo que no está en la lista.",
      active: "Usar la IA con esta configuración",
      saved: "Configuración de IA guardada",
      included:
        "Incluida en tu plan, con %{provider}. No necesitas contratar nada ni pegar ninguna clave: enciéndela y ya está.",
      not_configured:
        "La IA no está disponible en esta instalación: falta configurar su clave en el servidor. Mientras tanto, las plantillas se escriben a mano.",
    },
    deals: {
      win_blocked: {
        title: "Todavía no se puede dar por ganada",
        description:
          "«%{name}» no tiene nada que represente el ingreso. Registra una de estas tres cosas y vuélvela a mover:",
        quote: "Una cotización aceptada de esta oportunidad.",
        contract: "Un contrato de esta empresa (pestaña Cliente de su ficha).",
        purchase: "Una compra registrada de esta empresa.",
        setting:
          "Esta exigencia se apaga en Ajustes → Oportunidades, si prefieres marcar las ganadas antes de tener el papel.",
        open: "Abrir la oportunidad",
      },
    },
    customers: {
      tab: "Cliente",
      stage_none: "Sin etapa",
      risk: {
        filter: "En riesgo",
        at_risk: "Cliente en riesgo",
        support: "Soporte",
        open: "%{smart_count} ticket abierto |||| %{smart_count} tickets abiertos",
        overdue:
          "%{smart_count} ticket vencido |||| %{smart_count} tickets vencidos",
        see_tickets: "Ver tickets",
      },
      renews_in_days: "en %{smart_count} día |||| en %{smart_count} días",
      renews_on: "renueva el",
      contracts: "Contratos y suscripciones",
      no_contracts: "Sin contratos con periodicidad.",
      one_time_contracts: "Contratos de pago único",
      purchases: "Compras",
      no_purchases: "Sin compras registradas.",
      new_contract: "Añadir contrato",
      new_purchase: "Registrar compra",
      contract_created: "Contrato guardado",
      purchase_created: "Compra registrada",
      save_error: "No se pudo guardar",
      fields: {
        lifecycle_stage: "Etapa del cliente",
        total_spent: "Total comprado",
        nb_purchases: "Compras",
        recurring_amount: "Recurrente",
        nb_recurring_contracts:
          "%{smart_count} contrato con periodicidad |||| %{smart_count} contratos con periodicidad",
        one_time_amount: "Pago único",
        nb_one_time_contracts:
          "%{smart_count} contrato de pago único |||| %{smart_count} contratos de pago único",
        won_amount: "Ganado en oportunidades",
        nb_won_deals:
          "%{smart_count} oportunidad ganada |||| %{smart_count} oportunidades ganadas",
        next_renewal_on: "Próxima renovación",
        support: "Soporte",
        contract_name: "Nombre del contrato o plan",
        amount: "Importe",
        billing_period: "Periodicidad",
        started_on: "Inicio",
        renews_on: "Renueva o vence el",
        renews_on_help: "Es la fecha sobre la que avisan las automatizaciones.",
        status: "Estado",
        description: "Qué se vendió",
        description_help:
          "Se guarda tal cual: si el producto cambia de nombre después, esta compra sigue diciendo lo que fue.",
        purchased_on: "Fecha",
        reference: "Folio o referencia",
      },
      period: {
        monthly: "Mensual",
        quarterly: "Trimestral",
        yearly: "Anual",
        one_time: "Pago único",
      },
      contract_status: {
        active: "Activo",
        paused: "Pausado",
        cancelled: "Cancelado",
        expired: "Vencido",
      },
      purchase_status: {
        paid: "Pagada",
        pending: "Pendiente",
        cancelled: "Cancelada",
        refunded: "Reembolsada",
      },
    },
    email: {
      title: "Correo saliente",
      intro:
        "Por qué servidor salen los correos que envía el CRM. Mientras no configures uno, no se puede enviar correo desde las fichas ni desde las automatizaciones.",
      server_title: "Servidor de envío",
      provider: "Proveedor",
      api_key: "Clave de API",
      api_key_placeholder: "Pega aquí la clave de tu proveedor",
      api_key_saved:
        "Ya hay una clave guardada — escribe una nueva para reemplazarla",
      api_key_help:
        "La clave se guarda cifrada del lado del servidor y no vuelve a mostrarse nunca, ni siquiera a un administrador. Si la pierdes, genera otra en tu proveedor y pégala aquí.",
      from_email: "Correo del remitente",
      from_email_help:
        "Tiene que ser una dirección de un dominio verificado en tu proveedor; si no, rechazará los envíos.",
      from_name: "Nombre del remitente",
      active: "Enviar correo con esta configuración",
      saved: "Configuración de correo guardada",
      inherited:
        "Ahora mismo estás enviando con la configuración general de la instalación. Guarda la tuya para enviar desde tu propio dominio.",
      test_title: "Enviar una prueba",
      test_intro:
        "Manda un correo de prueba para comprobar que la configuración funciona antes de usarla de verdad.",
      test_send: "Enviar prueba",
      test_sent: "Correo de prueba enviado",
    },
    connectors: {
      title: "Conectores",
      intro:
        "De dónde salen tus productos y quién timbra tus facturas. Tú eliges a cada proveedor y lo conectas con tus propias credenciales; el CRM no guarda nada de eso en su código.",
      status: {
        connected: "Conectado",
        error: "La última llamada falló",
      },
      last_sync: "Última sincronización",
      never_synced: "Todavía no se ha sincronizado.",
      see_products: "Ver productos",
      invoicing_hint:
        "Las facturas se piden desde una cotización aceptada, en su oportunidad.",
      see_invoices: "Ver facturas",
      sync_now: "Sincronizar ahora",
      synced:
        "%{smart_count} producto sincronizado |||| %{smart_count} productos sincronizados",
      edit: "Cambiar ajustes",
      disconnect: "Desconectar",
      disconnect_confirm:
        "¿Desconectar este proveedor? Lo ya sincronizado o facturado se conserva; solo dejará de usarse hasta que lo vuelvas a conectar.",
      disconnected: "Proveedor desconectado",
      connect: "Conectar",
      connect_with: "Conectar con %{name}",
      open_site: "Abrir sitio del proveedor",
      test_and_save: "Probar y conectar",
      steps_title: "Cómo conseguir lo que pide %{name}",
      secret_kept: "Guardada. Escribe una nueva solo si quieres cambiarla.",
    },
    invoices: {
      dialog_title: "Facturar %{number}",
      dialog_description:
        "Revisa los datos fiscales del cliente. La factura la timbra tu proveedor de facturación y queda ligada a esta cotización.",
      fields: {
        legal_name: "Razón social",
        rfc: "RFC",
        zipcode: "Código postal fiscal",
        tax_regime: "Régimen fiscal",
        cfdi_use: "Uso del CFDI",
        payment_form: "Forma de pago",
        email: "Correo para la factura",
        email_help:
          "Opcional. El proveedor le manda la factura a este correo si lo tiene configurado.",
      },
      choose_regime: "Elige el régimen fiscal…",
      payment_form_default: "La habitual del conector",
      issue: "Facturar",
      issue_action: "Facturar esta cotización",
      stamped: "Factura %{folio} timbrada",
      not_stamped:
        "La factura se creó pero no se timbró; revísala en tu proveedor.",
      invoiced_as: "Facturada como %{folio}",
    },
    modules: {
      title: "Módulos",
      catalog: {
        title: "Catálogo de módulos",
        intro:
          "Activa o desactiva funcionalidades para tu organización. Cada módulo es independiente: apagarlo no borra sus datos, solo lo oculta.",
        updated: "Módulo actualizado",
        update_error: "No se pudo actualizar el módulo",
        active_hint: "Activo. Aparece en el menú lateral bajo Módulos.",
        connector_hint:
          "Funciona con un proveedor conectado; se activa solo al conectarlo en",
      },
      customers: {
        name: "Clientes",
        description:
          "Lo que pasa después de la venta: qué ha comprado cada cliente, qué tiene contratado y cuándo le vence. Se alimenta a mano o desde tu sistema de facturación por API.",
      },
      products: {
        name: "Productos",
        description:
          "Tu catálogo de productos y precios, traído de donde ya lo tienes (Shopify…), para elegirlos al armar una cotización.",
      },
      invoicing: {
        name: "Facturas",
        description:
          "Las facturas que tu proveedor de facturación (Faqturia…) timbra desde una cotización aceptada, con su PDF y XML.",
      },
      affiliates: {
        name: "Afiliados",
        description:
          "Gestiona afiliados que revenden tus servicios: cuando ganan una oportunidad en el embudo que configures, aparecen aquí con su código de referido y su comisión.",
      },
    },
    affiliates: {
      config: {
        title: "Configuración de Afiliados",
        intro:
          "Define qué oportunidad ganada convierte a un contacto en afiliado, y cómo se arma su URL de referidos.",
        link: "Configurar módulo",
        pipeline_title: "Embudo de afiliación",
        pipeline: "Embudo",
        completion_stages_help:
          "Elige qué etapas de ese embudo cuentan como «afiliación completa». Al ganar una oportunidad en una de estas etapas, el contacto se vuelve afiliado.",
        commercial_title: "Condiciones comerciales",
        default_commission: "Comisión por defecto (%)",
        default_commission_help:
          "Se usa como punto de partida al crear un afiliado nuevo; se puede ajustar por afiliado después.",
        url_title: "URL de referidos",
        url_template: "Plantilla de la URL",
        url_template_help:
          "Usa {id} donde debe ir el código de cada afiliado, por ejemplo: https://tudominio.com?ref={id}. Cada afiliado ve su propia URL ya armada en su ficha.",
        saved: "Configuración guardada",
        save_error: "No se pudo guardar la configuración",
      },
      fields: {
        contact_id: "Contacto",
        company_id: "Empresa",
        referral_code: "Código de referido",
        referral_code_help:
          "Es el {id} de tu URL de referidos. Solo minúsculas, números y guiones — lo puedes personalizar, pero debe ser único.",
        commission_percentage: "Comisión (%)",
        active: "Activo",
        inactive: "Inactivo",
        kontrolia_auth_user_id: "Usuario de KontrolIA Auth",
        kontrolia_auth_user_id_help:
          "Vincula este afiliado con la cuenta que le creaste en KontrolIA Auth, para que solo vea las empresas y contactos que gestiona. Déjalo vacío mientras no tenga cuenta todavía.",
        referral_url: "URL de referidos",
        referral_url_not_configured:
          "Configura la plantilla de URL en Módulos > Afiliados > Configurar módulo para verla aquí.",
      },
      commissions: {
        title: "Negocio referido",
        referred_companies: "Clientes traídos",
        won_deals: "Oportunidades ganadas",
        won_amount: "Importe ganado",
        commission_amount: "Comisión",
        no_percentage:
          "Sin porcentaje de comisión configurado todavía: edita el afiliado para asignárselo.",
      },
      validation: {
        referral_code_format:
          "Solo minúsculas, números y guiones, sin empezar ni terminar en guión.",
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
        auth_api_key:
          "Para una integración externa (un formulario en otro sitio, un bot, tu propio sistema) usa una clave de API en su lugar, con el mismo formato de cabecera. Tiene acceso a los mismos recursos que una sesión — trátala como la contraseña de un usuario más: crea una abajo.",
        filters:
          "Los filtros siguen la sintaxis de PostgREST (columna=operador.valor):",
        example_ilike: "# contiene texto, sin mayúsculas",
        example_gte: "# mayor o igual",
        example_order: "# ordenar",
        example_pagination: "# paginación",
        write: "Para crear o modificar, envía JSON con POST o PATCH:",
        resources:
          "Recursos disponibles: contacts, companies, deals, tasks, contact_notes, deal_notes, tickets, ticket_notes, tags, sales (lectura). Todo queda aislado a tu organización automáticamente.",
      },
      keys: {
        title: "Claves de API",
        intro:
          "Para que un sistema externo cree o gestione datos sin que nadie inicie sesión — un formulario propio, un bot, tu propio backend. Cada clave tiene acceso a los mismos datos que un usuario con sesión iniciada, así que trátala con el mismo cuidado: solo un administrador puede crearla, y puedes desactivarla o borrarla en cualquier momento desde aquí.",
        name_placeholder: "Nombre de la clave (ej. Formulario del sitio)",
        add: "Crear clave",
        empty: "Aún no hay claves de API.",
        toggle: "Activar o desactivar",
        deleted: "Clave eliminada",
        reveal_title: "Copia esta clave ahora — no se vuelve a mostrar",
        reveal_warning:
          "Por seguridad, Vinqulia solo guarda un hash de la clave. Si la pierdes, tendrás que crear una nueva.",
        reveal_dismiss: "Ya la copié",
      },
      endpoints: {
        title: "Recursos y ejemplos",
        intro:
          "Cada recurso admite las cuatro operaciones estándar en su propia dirección. Este es el ejemplo de un registro real de cada uno:",
      },
      attachments: {
        title: "Adjuntos",
        intro:
          "Para adjuntar un archivo a una nota (contact_notes, deal_notes o ticket_notes), primero súbelo aquí en base64 y usa la respuesta como un elemento del arreglo attachments al crear o editar la nota. Límite: 10 MB por archivo.",
        response: "La respuesta trae el objeto listo para usar:",
      },
      customers: {
        title: "Clientes: compras y contratos",
        intro:
          "Con el módulo Clientes activo, tu sistema de facturación, ERP o tienda puede registrar cada venta en el CRM. El catálogo y las facturas siguen viviendo allá; aquí solo se guarda lo necesario para saber qué ha comprado cada cliente y ofrecerle lo siguiente.",
        reconciliation:
          "No hace falta conocer los ids del CRM: el cliente se identifica por RFC, por correo o por tu propio identificador (externalId), y el CRM lo resuelve a la empresa correcta. Si no la encuentra responde 422 sin crear nada — nunca da de alta una empresa a ciegas, para no acabar con la misma tres veces.",
        idempotent:
          "Reenviar la misma compra (mismo origen + externalId) la actualiza en vez de duplicarla: un reintento o una resincronización no ensucian los datos.",
        contracts:
          "Para contratos y suscripciones, POST /api/clientes/contratos con la misma forma (nombre, periodicidad, importe, renuevaEl…). Reenviarlo actualiza el contrato, que es lo que pasa cuando cambia de importe o se renueva.",
      },
      quotes: {
        title: "Cotizaciones",
        intro:
          "Las cotizaciones y sus líneas se leen y escriben como cualquier otro recurso (quotes, quote_items). Los totales los calcula el CRM: manda las líneas con cantidad, precio, descuento e IVA, y subtotal, tax_total y total salen solos. El folio (COT-2026-0001) también.",
        webhook:
          "Para facturar al aceptarse, suscribe un webhook a quotes.updated y actúa cuando status pase a accepted: el cuerpo trae la cotización completa, y sus líneas se leen de quote_items. Así la factura la emite tu sistema con sus propios productos y CFDI; el CRM no factura.",
        public_link:
          "public_token es el enlace que ve el cliente (/cotizacion/<token>): trátalo como un secreto, porque quien lo tenga puede aceptar la cotización.",
      },
      webhooks: {
        title: "Webhooks",
        intro:
          "Un webhook es una URL de tu sistema a la que Vinqulia avisa cada vez que se crea, cambia o elimina un contacto, empresa, oportunidad, tarea, nota o ticket. Sirve para conectar n8n, Zapier, Make o tu propio servidor.",
        add: "Agregar",
        empty: "Aún no hay webhooks. Agrega la URL de tu sistema para empezar.",
        created:
          "Webhook agregado. Copia su secreto para verificar las firmas.",
        create_error: "No se pudo agregar el webhook",
        deleted: "Webhook eliminado",
        toggle: "Activar o desactivar",
        copy_secret: "Copiar secreto",
        payload: "Cada aviso llega como POST con este cuerpo:",
        events: "Eventos disponibles (uno por recurso, según lo que pase):",
        signature:
          "Verifica que el aviso es legítimo comparando la cabecera X-Vinqulia-Firma con el HMAC-SHA256 del cuerpo usando el secreto del webhook. Calcúlalo sobre el cuerpo CRUDO tal como llega, no sobre el JSON reserializado: cambiaría espacios y orden de claves y no cuadraría nunca.",
        retries:
          "Si tu servidor no responde con un código 2xx, el aviso se reintenta hasta 5 veces con esperas crecientes (1, 3, 9, 27 y 81 minutos). Como un mismo evento puede llegar más de una vez, usa X-Vinqulia-Evento-Id para descartar repetidos.",
        loops:
          "Si tu sistema responde al aviso escribiendo de vuelta en el CRM, suscríbete solo a los eventos que necesites (por ejemplo, únicamente «created»). Suscribirse también a «updated» haría que tu propia escritura te volviera como un aviso nuevo, y los dos sistemas se llamarían sin parar.",
        events_title: "Eventos:",
        events_all: "Todos",
        events_count: "%{smart_count} evento |||| %{smart_count} eventos",
        events_help:
          "Elige qué avisos quieres recibir. Sin ninguno marcado llegan todos. Si tu sistema responde escribiendo de vuelta en el CRM, marca solo «created»: con «updated» tu propia escritura te volvería como aviso nuevo y entrarían en bucle.",
        events_error: "No se pudieron guardar los eventos",
      },
      mcp: {
        title: "MCP (para asistentes de IA)",
        intro:
          "Vinqulia expone un servidor MCP para que un asistente de IA (como Claude) consulte y modifique tus datos por instrucciones en lenguaje natural. Conéctalo con esta dirección:",
        auth: "La autenticación usa el mismo token de sesión de KontrolIA Auth. El servidor expone estas herramientas:",
        tool_get_schema:
          "obtiene las tablas, columnas y relaciones disponibles (siempre se llama primero).",
        tool_query: "ejecuta una consulta SELECT de solo lectura.",
        tool_mutate: "crea, modifica o elimina registros con SQL.",
        tool_display_task_list:
          "muestra una lista de tareas como una interfaz interactiva.",
        tool_complete_task: "marca una tarea como hecha por su id.",
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
      deals_chart_empty:
        "Aún no hay importes en las oportunidades. Pon un importe a una oportunidad y aquí verás la previsión por mes.",
      deals_pipeline: "Embudo de oportunidades",
      latest_activity: "Actividad reciente",
      open_tickets: "Tickets abiertos",
      open_tickets_empty:
        "No hay tickets abiertos. Ningún cliente espera respuesta.",
      open_tickets_all: "Ver los %{total} tickets abiertos",
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
      companies: {
        sectors: "Sectores",
      },
      deals: {
        categories: "Categorías",
        currency: "Moneda",
        pipeline_help:
          "Marca cuáles de las etapas de arriba significan que la oportunidad se ganó. El CRM las usa para calcular tu tasa de conversión en Informes.",
        pipeline_statuses: "Etapas ganadas",
        stages: "Etapas",
        pipelines: "Embudos",
        pipelines_help:
          "Cada embudo tiene sus propias etapas: ventas nuevas, renovaciones, cobranza… Las oportunidades viven en un solo embudo.",
        pipeline_name: "Nombre del embudo",
        add_pipeline: "Agregar embudo",
        remove_pipeline: "Quitar embudo",
        pipeline_in_use:
          "No se puede quitar el embudo «%{name}»: todavía tiene oportunidades.",
        probability: "Probabilidad de cierre (%)",
        probability_help:
          "Probabilidad (0-100) de que una oportunidad en cada etapa acabe ganándose; con ella se calcula el importe ponderado y el pronóstico de Informes. Si la dejas vacía, el CRM la estima por el orden de la etapa (ganadas 100, perdidas 0).",
        lost_stages: "Etapas perdidas",
        lost_stages_help:
          "Marca cuáles significan que la oportunidad se perdió. Al mover una oportunidad a una de ellas, el CRM preguntará el motivo.",
        win_rule: "Qué hace falta para dar una oportunidad por ganada",
        win_rule_help:
          "Con esto encendido, una oportunidad solo pasa a una etapa ganada si tiene detrás una cotización aceptada, o un contrato o una compra de esa empresa. Es lo que evita un embudo lleno de ganadas que nunca fueron dinero.",
        win_rule_label: "Exigir cotización, contrato o compra",
        loss_reasons: "Motivos de pérdida",
        loss_reasons_help:
          "Las opciones que se ofrecerán al perder una oportunidad. Saber por qué se pierde es lo que convierte el historial en una decisión.",
      },
      notes: {
        statuses: "Estados",
        types: "Tipos de actividad",
        types_help:
          "Cómo se registró el contacto: llamada, reunión, WhatsApp, correo… Aparecen como iconos al añadir una nota.",
      },
      reset_defaults: "Restablecer los valores por defecto",
      save_error: "No se pudo guardar la configuración",
      saved: "Configuración guardada correctamente",
      saving: "Guardando...",
      tasks: {
        types: "Tipos",
      },
      tickets: {
        priorities: "Prioridades",
        priorities_help:
          "De menor a mayor urgencia. El orden manda: la lista y el panel destacan las de abajo.",
        categories: "Categorías",
        categories_help:
          "Para clasificar y filtrar. Los tickets que llegan del agente de voz o de un formulario con «[categoría]» en el asunto caen en la que coincida.",
        sla: "Plazos de atención (SLA)",
        sla_help:
          "Horas objetivo por prioridad, desde que se crea el ticket. La primera respuesta la cuenta la primera nota o correo de una persona del equipo. Vacío = sin plazo. Cambiar la prioridad de un ticket recalcula sus plazos.",
        sla_first_response: "Primera respuesta (h)",
        sla_resolution: "Resolución (h)",
      },
      preferences: "Preferencias",
      title: "Ajustes",
      sections: {
        custom_fields: "Campos personalizados",
        tools: "Herramientas",
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
    access: {
      denied_title: "No tienes acceso a esta aplicación",
      denied_text:
        "Tu cuenta de KontrolIA Auth es válida, pero esta organización no tiene %{app} contratado, o tu cuenta no tiene un rol asignado ahí. Si perteneces a otra organización, cámbiate arriba; si no, pide a quien la administre que te dé acceso.",
    },
    profile: {
      mcp: {
        title: "Servidor MCP",
        description:
          "Usa esta dirección para conectar tu asistente de IA con los datos de tu CRM mediante el Model Context Protocol (MCP).",
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
