import type { TranslationMessages } from "ra-core";

/**
 * Traducción al español de los mensajes del framework (ra-core) y de los de
 * autenticación de ra-supabase.
 *
 * Se mantiene dentro del repositorio en lugar de instalar un paquete de idioma:
 * `ra-supabase-language-spanish` no existe y `ra-language-spanish` está
 * congelado en la versión 1.0.0, incompatible con ra-core 5.x.
 *
 * Reglas de estilo: se trata al usuario de tú, y los marcadores `%{variable}`
 * y los separadores de plural `||||` deben conservarse tal cual.
 */
export const spanishCoreMessages: TranslationMessages = {
  ra: {
    action: {
      add_filter: "Añadir filtro",
      add: "Añadir",
      back: "Volver",
      bulk_actions:
        "1 elemento seleccionado |||| %{smart_count} elementos seleccionados",
      cancel: "Cancelar",
      clear_array_input: "Vaciar la lista",
      clear_input_value: "Borrar el valor",
      clone: "Duplicar",
      confirm: "Confirmar",
      create: "Crear",
      create_item: "Crear %{item}",
      delete: "Eliminar",
      edit: "Editar",
      export: "Exportar",
      list: "Lista",
      refresh: "Actualizar",
      remove_filter: "Quitar este filtro",
      remove_all_filters: "Quitar todos los filtros",
      remove: "Quitar",
      reset: "Restablecer",
      save: "Guardar",
      search: "Buscar",
      search_columns: "Buscar columnas",
      select_all: "Seleccionar todo",
      select_all_button: "Seleccionar todo",
      select_row: "Seleccionar esta fila",
      show: "Ver",
      sort: "Ordenar",
      undo: "Deshacer",
      unselect: "Quitar selección",
      expand: "Desplegar",
      close: "Cerrar",
      open_menu: "Abrir el menú",
      close_menu: "Cerrar el menú",
      update: "Actualizar",
      move_up: "Subir",
      move_down: "Bajar",
      open: "Abrir",
      toggle_theme: "Cambiar entre modo claro y oscuro",
      select_columns: "Columnas",
      update_application: "Recargar la aplicación",
    },
    boolean: {
      true: "Sí",
      false: "No",
      null: " ",
    },
    page: {
      create: "Crear %{name}",
      dashboard: "Panel",
      edit: "%{name} %{recordRepresentation}",
      error: "Algo ha salido mal",
      list: "%{name}",
      loading: "Cargando",
      not_found: "No encontrado",
      show: "%{name} %{recordRepresentation}",
      empty: "Todavía no hay %{name}.",
      invite: "¿Quieres crear el primero?",
      access_denied: "Acceso denegado",
      authentication_error: "Error de autenticación",
    },
    input: {
      file: {
        upload_several:
          "Arrastra aquí los archivos que quieras subir, o haz clic para seleccionarlos.",
        upload_single:
          "Arrastra aquí el archivo que quieras subir, o haz clic para seleccionarlo.",
      },
      image: {
        upload_several:
          "Arrastra aquí las imágenes que quieras subir, o haz clic para seleccionarlas.",
        upload_single:
          "Arrastra aquí la imagen que quieras subir, o haz clic para seleccionarla.",
      },
      references: {
        all_missing: "No se han encontrado los datos relacionados.",
        many_missing:
          "Al menos uno de los elementos relacionados ya no está disponible.",
        single_missing: "El elemento relacionado ya no está disponible.",
      },
      password: {
        toggle_visible: "Ocultar la contraseña",
        toggle_hidden: "Mostrar la contraseña",
      },
    },
    message: {
      about: "Acerca de",
      access_denied: "No tienes permisos para acceder a esta página",
      are_you_sure: "¿Seguro que quieres continuar?",
      authentication_error:
        "El servidor de autenticación devolvió un error y no se han podido verificar tus credenciales.",
      auth_error: "Se produjo un error al validar el token de autenticación.",
      bulk_delete_content:
        "¿Seguro que quieres eliminar este %{name}? |||| ¿Seguro que quieres eliminar estos %{smart_count} elementos?",
      bulk_delete_title:
        "Eliminar %{name} |||| Eliminar %{smart_count} %{name}",
      bulk_update_content:
        "¿Seguro que quieres actualizar %{name} %{recordRepresentation}? |||| ¿Seguro que quieres actualizar estos %{smart_count} elementos?",
      bulk_update_title:
        "Actualizar %{name} %{recordRepresentation} |||| Actualizar %{smart_count} %{name}",
      clear_array_input: "¿Seguro que quieres vaciar la lista entera?",
      delete_content: "¿Seguro que quieres eliminar este %{name}?",
      delete_title: "Eliminar %{name} %{recordRepresentation}",
      details: "Detalles",
      error:
        "Se produjo un error en la aplicación y no se pudo completar tu petición.",
      invalid_form: "El formulario no es válido. Revisa los errores",
      loading: "Espera un momento",
      no: "No",
      not_found:
        "La dirección es incorrecta o el enlace que seguiste no es válido.",
      select_all_limit_reached:
        "Hay demasiados elementos para seleccionarlos todos. Solo se han seleccionado los primeros %{max}.",
      unsaved_changes:
        "Algunos de tus cambios no se han guardado. ¿Seguro que quieres descartarlos?",
      yes: "Sí",
      placeholder_data_warning:
        "Problema de red: no se han podido actualizar los datos.",
    },
    navigation: {
      clear_filters: "Quitar los filtros",
      no_filtered_results: "No hay %{name} con los filtros actuales.",
      no_results: "No se ha encontrado ningún %{name}",
      no_more_results:
        "La página %{page} no existe. Prueba con la página anterior.",
      page_out_of_boundaries: "La página %{page} no existe",
      page_out_from_end: "No se puede avanzar más allá de la última página",
      page_out_from_begin: "No se puede retroceder antes de la página 1",
      page_range_info: "%{offsetBegin}-%{offsetEnd} de %{total}",
      partial_page_range_info:
        "%{offsetBegin}-%{offsetEnd} de más de %{offsetEnd}",
      current_page: "Página %{page}",
      page: "Ir a la página %{page}",
      first: "Ir a la primera página",
      last: "Ir a la última página",
      next: "Ir a la página siguiente",
      previous: "Ir a la página anterior",
      page_rows_per_page: "Filas por página:",
      skip_nav: "Ir al contenido",
    },
    sort: {
      sort_by: "Ordenar por %{field_lower_first} %{order}",
      ASC: "de forma ascendente",
      DESC: "de forma descendente",
    },
    auth: {
      auth_check_error: "Inicia sesión para continuar",
      user_menu: "Perfil",
      username: "Usuario",
      password: "Contraseña",
      email: "Correo electrónico",
      sign_in: "Iniciar sesión",
      sign_in_error: "No se ha podido iniciar sesión, inténtalo de nuevo",
      logout: "Cerrar sesión",
    },
    notification: {
      updated:
        "Elemento actualizado |||| %{smart_count} elementos actualizados",
      created: "Elemento creado",
      deleted: "Elemento eliminado |||| %{smart_count} elementos eliminados",
      bad_item: "Elemento incorrecto",
      item_doesnt_exist: "El elemento no existe",
      http_error: "Error de comunicación con el servidor",
      data_provider_error:
        "Error del proveedor de datos. Consulta la consola para más detalles.",
      i18n_error:
        "No se han podido cargar las traducciones del idioma indicado",
      canceled: "Acción cancelada",
      logged_out: "Tu sesión ha terminado, vuelve a iniciar sesión.",
      not_authorized: "No tienes permiso para acceder a este recurso.",
      application_update_available: "Hay una versión nueva disponible.",
      offline: "Sin conexión. No se han podido obtener los datos.",
    },
    validation: {
      required: "Obligatorio",
      minLength: "Debe tener al menos %{min} caracteres",
      maxLength: "Debe tener como máximo %{max} caracteres",
      minValue: "Debe ser como mínimo %{min}",
      maxValue: "Debe ser como máximo %{max}",
      number: "Debe ser un número",
      email: "Debe ser un correo electrónico válido",
      oneOf: "Debe ser uno de estos valores: %{options}",
      regex: "Debe seguir un formato concreto (regexp): %{pattern}",
      unique: "No puede repetirse",
    },
    saved_queries: {
      label: "Búsquedas guardadas",
      query_name: "Nombre de la búsqueda",
      new_label: "Guardar la búsqueda actual...",
      new_dialog_title: "Guardar la búsqueda actual como",
      remove_label: "Eliminar la búsqueda guardada",
      remove_label_with_name: 'Eliminar la búsqueda "%{name}"',
      remove_dialog_title: "¿Eliminar la búsqueda guardada?",
      remove_message:
        "¿Seguro que quieres quitar ese elemento de tus búsquedas guardadas?",
      help: "Filtra la lista y guarda esta búsqueda para usarla más adelante",
    },
    guesser: {
      empty: {
        title: "No hay datos que mostrar",
        message: "Revisa tu proveedor de datos",
      },
    },
    configurable: {
      customize: "Personalizar",
      configureMode: "Configurar esta página",
      inspector: {
        title: "Inspector",
        content:
          "Pasa el cursor sobre los elementos de la interfaz para configurarlos",
        reset: "Restablecer los ajustes",
        hideAll: "Ocultar todo",
        showAll: "Mostrar todo",
      },
      Datagrid: {
        title: "Tabla de datos",
        unlabeled: "Columna sin nombre n.º %{column}",
      },
      SimpleForm: {
        title: "Formulario",
        unlabeled: "Campo sin nombre n.º %{input}",
      },
      SimpleList: {
        title: "Lista",
        primaryText: "Texto principal",
        secondaryText: "Texto secundario",
        tertiaryText: "Texto terciario",
      },
    },
  },
};

/** Mensajes de autenticación de ra-supabase traducidos al español. */
export const spanishSupabaseMessages = {
  "ra-supabase": {
    auth: {
      email: "Correo electrónico",
      confirm_password: "Confirma la contraseña",
      sign_in_with: "Iniciar sesión con %{provider}",
      forgot_password: "¿Has olvidado tu contraseña?",
      reset_password: "Restablecer la contraseña",
      password_reset:
        "Te hemos enviado un correo con un enlace para restablecer tu contraseña.",
      missing_tokens: "Faltan los tokens de acceso y de actualización",
      back_to_login: "Volver al inicio de sesión",
    },
    reset_password: {
      forgot_password: "¿Has olvidado tu contraseña?",
      forgot_password_details:
        "Escribe tu correo electrónico y te enviaremos las instrucciones.",
    },
    set_password: {
      new_password: "Elige tu contraseña",
    },
    validation: {
      password_mismatch: "Las contraseñas no coinciden",
    },
  },
};
