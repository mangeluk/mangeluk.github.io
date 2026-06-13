# Requirements Document

## Introduction

Portfolio profesional interactivo con interfaz de terminal de comandos, deployado como sitio estático en GitHub Pages. El usuario navega el contenido profesional (experiencia, proyectos, skills, contacto) escribiendo comandos en la terminal. La aplicación incluye integración con IA (Google Gemini) para responder preguntas sobre el perfil, soporte de temas visuales, internacionalización (es/en), y está diseñada mobile-first con soporte completo para desktop.

El stack es Next.js con static export, Tailwind CSS, fuente monoespaciada (JetBrains Mono / Fira Code), y deploy automatizado via GitHub Actions.

---

## Glossary

- **Terminal**: El componente principal de UI que emula una terminal de comandos en el navegador.
- **Command_Registry**: El módulo que registra y resuelve todos los comandos disponibles.
- **Command**: Una instrucción que el usuario ingresa en la Terminal para obtener una respuesta.
- **History**: La lista de entradas (inputs del usuario + outputs del sistema) mostradas en la Terminal.
- **Output**: El resultado textual que la Terminal muestra tras ejecutar un Command.
- **Profile**: El objeto de datos centralizado en `src/data/profile.ts` que contiene toda la información profesional.
- **Gemini_Client**: El módulo cliente que realiza llamadas a la API de Google Gemini.
- **Theme**: El esquema de colores activo de la Terminal (dark, light, matrix).
- **Lang**: El idioma activo del contenido de la Terminal (es, en).
- **Mobile_Shortcuts**: Los botones de comandos rápidos mostrados en dispositivos móviles.
- **Welcome_Banner**: El ASCII art y mensaje de bienvenida mostrado al iniciar la Terminal.
- **Static_Export**: La salida de Next.js (`output: 'export'`) que genera archivos HTML/CSS/JS estáticos sin servidor.
- **CI_CD_Pipeline**: El flujo de GitHub Actions que construye y publica el sitio automáticamente.

---

## Requirements

### Requirement 1: Terminal Base — Entrada de Comandos e Historia

**User Story:** Como visitante del portfolio, quiero escribir comandos en una terminal y ver sus resultados, para explorar el contenido profesional de forma interactiva.

#### Acceptance Criteria

1. THE Terminal SHALL renderizar un campo de entrada de texto con un `aria-label` que identifique el campo como la entrada de comandos de la terminal, visible y posicionado al fondo de la pantalla en todo momento.
2. WHEN el usuario presiona Enter con texto no vacío en el campo de entrada, THE Terminal SHALL ejecutar el comando ingresado, agregar el comando y su Output como una nueva entrada al History, y limpiar el campo de entrada.
3. WHEN el usuario presiona Enter con el campo de entrada vacío o que contiene solo espacios, THE Terminal SHALL ignorar la acción sin agregar ninguna entrada al History.
4. THE Terminal SHALL mostrar un cursor parpadeante animado con un ciclo de 1 segundo (500ms visible / 500ms oculto) en el campo de entrada.
5. WHEN se agrega una nueva entrada al History, THE Terminal SHALL hacer scroll automático al final del área de History de modo que la entrada más reciente sea visible.
6. THE Terminal SHALL anunciar cada nuevo Output a tecnologías asistivas mediante `aria-live="polite"` en el contenedor de History.
7. WHEN el usuario presiona la tecla ArrowUp y existe al menos un comando previo en el History, THE Terminal SHALL reemplazar el contenido del campo de entrada con el comando anterior en la secuencia del historial de comandos; si ya se muestra el comando más antiguo, el contenido del campo no cambia.
8. WHEN el usuario presiona la tecla ArrowDown mientras navega el historial de comandos y existe un comando más reciente, THE Terminal SHALL reemplazar el contenido del campo de entrada con el comando siguiente; si ya se muestra el más reciente, el campo de entrada se limpia.
9. IF el Command_Registry no puede resolver el comando ingresado, THEN THE Terminal SHALL mostrar el Output de error (Requirement 16) sin lanzar una excepción no manejada.

---

### Requirement 2: Comando `help`

**User Story:** Como visitante, quiero ver la lista de comandos disponibles, para saber qué puedo hacer en la terminal.

#### Acceptance Criteria

1. WHEN el usuario ejecuta el comando `help`, THE Command_Registry SHALL retornar una lista con todos los comandos registrados, ordenada alfabéticamente, donde cada entrada incluye el nombre del comando y su descripción en una sola línea.
2. WHEN el Output del comando `help` se muestra en el Terminal, THE Terminal SHALL renderizarlo con el nombre de cada comando alineado a la izquierda en un ancho fijo de 20 caracteres, seguido de su descripción, con una entrada por línea.
3. IF el Command_Registry no contiene ningún comando registrado, THEN THE Terminal SHALL mostrar un mensaje indicando que no hay comandos disponibles.

---

### Requirement 3: Comando `about`

**User Story:** Como visitante, quiero leer una descripción profesional del dueño del portfolio, para entender su perfil rápidamente.

#### Acceptance Criteria

1. WHEN el usuario ejecuta el comando `about`, THE Command_Registry SHALL retornar la bio profesional definida en Profile para el Lang activo; si el Lang activo no tiene bio definida, SHALL usar `es` como idioma de fallback.
2. WHEN el Output del comando `about` se muestra en la Terminal, THE Terminal SHALL renderizarlo con el color de texto primario (`--text-primary`) del Theme activo.
3. IF el Profile no contiene una bio para el Lang activo ni para el idioma de fallback `es`, THEN THE Command_Registry SHALL retornar un mensaje de error indicando que el contenido no está disponible.

---

### Requirement 4: Comando `experience`

**User Story:** Como visitante, quiero ver el historial laboral del profesional, para evaluar su trayectoria.

#### Acceptance Criteria

1. WHEN el usuario ejecuta el comando `experience`, THE Command_Registry SHALL retornar el historial laboral del Profile para el Lang activo, donde cada entrada incluye empresa, rol, rango de fechas (formato YYYY–YYYY o YYYY–presente) y descripción del puesto.
2. WHEN el Output del comando `experience` se muestra en la Terminal, THE Terminal SHALL renderizar cada entrada de trabajo separada por un divisor visual (línea en blanco o separador de caracteres) para distinguirlas claramente.
3. IF el Profile no contiene historial laboral para el Lang activo, THEN THE Command_Registry SHALL usar `es` como fallback; si tampoco existe en `es`, SHALL retornar un mensaje indicando que no hay experiencia disponible.

---

### Requirement 5: Comando `projects`

**User Story:** Como visitante, quiero ver los proyectos destacados del profesional, para evaluar su trabajo práctico.

#### Acceptance Criteria

1. WHEN el usuario ejecuta el comando `projects`, THE Command_Registry SHALL retornar la lista de proyectos del Profile para el Lang activo, donde cada entrada incluye nombre del proyecto, descripción y URL; si el Lang activo no tiene proyectos definidos, SHALL usar `es` como fallback.
2. WHEN el Output del comando `projects` se muestra en la Terminal, THE Terminal SHALL renderizar cada URL de proyecto como un elemento `<a>` con atributo `target="_blank"` y `rel="noopener noreferrer"` que abre en una nueva pestaña sin cerrar la actual.
3. IF el Profile no contiene proyectos en ningún idioma, THEN THE Command_Registry SHALL retornar un mensaje indicando que no hay proyectos disponibles.

---

### Requirement 6: Comando `skills`

**User Story:** Como visitante, quiero ver el stack técnico del profesional organizado por categorías, para evaluar sus competencias técnicas.

#### Acceptance Criteria

1. WHEN el usuario ejecuta el comando `skills`, THE Command_Registry SHALL retornar las habilidades del Profile organizadas por categoría para el Lang activo; cada categoría incluye su nombre y la lista de habilidades que contiene; si el Lang activo no tiene skills definidos, SHALL usar `es` como fallback.
2. WHEN el Output del comando `skills` se muestra en la Terminal, THE Terminal SHALL renderizar el nombre de cada categoría visualmente diferenciado del resto del texto (por ejemplo, en mayúsculas, color distinto o prefijo con caracteres especiales), con las habilidades listadas debajo de su categoría correspondiente.
3. IF el Profile no contiene skills en ningún idioma, THEN THE Command_Registry SHALL retornar un mensaje indicando que no hay habilidades disponibles.

---

### Requirement 7: Comando `contact`

**User Story:** Como visitante, quiero ver las vías de contacto del profesional, para poder comunicarme con él.

#### Acceptance Criteria

1. WHEN el usuario ejecuta el comando `contact`, THE Command_Registry SHALL retornar los canales de contacto definidos en Profile, incluyendo al menos email, LinkedIn y GitHub, con etiqueta y valor para cada canal.
2. WHEN el Output del comando `contact` se muestra en la Terminal, THE Terminal SHALL renderizar cada URL de contacto como un elemento `<a>` con `target="_blank"` y `rel="noopener noreferrer"` que abre en una nueva pestaña sin cerrar la actual.
3. IF el Profile no contiene datos de contacto, THEN THE Command_Registry SHALL retornar un mensaje indicando que la información de contacto no está disponible.

---

### Requirement 8: Comando `clear`

**User Story:** Como visitante, quiero limpiar la pantalla de la terminal, para tener una vista limpia sin historial previo.

#### Acceptance Criteria

1. WHEN el usuario ejecuta el comando `clear`, THE Terminal SHALL vaciar por completo el History eliminando todas las entradas previas, incluyendo el Welcome_Banner inicial, dejando el área de Output visualmente en blanco.
2. WHEN el usuario ejecuta el comando `clear`, THE Terminal SHALL limpiar el campo de entrada y mantener el foco en él inmediatamente después de ejecutarse.
3. WHEN el usuario ejecuta el comando `clear`, THE Terminal SHALL preservar el Theme activo, el Lang activo y cualquier preferencia persistida en localStorage sin modificarlos.

---

### Requirement 9: Comando `banner`

**User Story:** Como visitante, quiero ver el ASCII art de bienvenida en cualquier momento, para volver al estado visual inicial.

#### Acceptance Criteria

1. WHEN el usuario ejecuta el comando `banner`, THE Terminal SHALL mostrar el Welcome_Banner (ASCII art y mensaje de bienvenida) como una nueva entrada al final del History sin limpiar las entradas previas.
2. WHEN la aplicación carga en el navegador, THE Terminal SHALL mostrar el Welcome_Banner automáticamente como la primera entrada del History, antes de cualquier interacción del usuario.
3. WHEN el usuario ejecuta el comando `banner` mientras el History contiene entradas previas, THE Terminal SHALL agregar el Welcome_Banner al final sin eliminar ni modificar las entradas existentes.

---

### Requirement 10: Comando `whoami`

**User Story:** Como visitante curioso, quiero ejecutar un comando estilo unix que devuelva un one-liner profesional, para obtener una presentación rápida e informal.

#### Acceptance Criteria

1. WHEN el usuario ejecuta el comando `whoami`, THE Command_Registry SHALL retornar el valor de `whoami` definido en Profile para el Lang activo; el valor SHALL ser una cadena de texto de una sola línea sin saltos de línea, con un máximo de 160 caracteres.
2. IF el Profile no contiene una entrada `whoami` para el Lang activo, THEN THE Command_Registry SHALL usar el valor `whoami` del idioma `es` como fallback.

---

### Requirement 11: Comando `social`

**User Story:** Como visitante, quiero ver los links a redes sociales del profesional con iconos ASCII, para acceder rápidamente a sus perfiles.

#### Acceptance Criteria

1. WHEN el usuario ejecuta el comando `social`, THE Command_Registry SHALL retornar las redes sociales definidas en Profile, donde cada entrada incluye el nombre de la red, al menos un carácter no alfanumérico como ícono ASCII, y la URL del perfil.
2. WHEN el Output del comando `social` se muestra en la Terminal, THE Terminal SHALL renderizar cada URL como un elemento `<a>` con `target="_blank"` y `rel="noopener noreferrer"` que abre la URL en una nueva pestaña sin cerrar la actual.
3. IF el Profile no contiene redes sociales definidas, THEN THE Command_Registry SHALL retornar un mensaje indicando que no hay perfiles sociales disponibles.

---

### Requirement 12: Comando `download cv`

**User Story:** Como reclutador, quiero descargar el CV del profesional en PDF desde la terminal, para tenerlo en mi dispositivo.

#### Acceptance Criteria

1. WHEN el usuario ejecuta el comando `download cv` y el Profile contiene una URL de CV válida, THE Terminal SHALL iniciar la descarga del archivo PDF usando un elemento `<a>` con atributo `download` apuntando a la URL del CV definida en Profile, y mostrar un mensaje de confirmación en el Output.
2. IF el Profile no contiene una URL de CV o la URL está vacía, THEN THE Command_Registry SHALL retornar un mensaje de error con el color `--text-error` indicando que el CV no está disponible actualmente.
3. WHEN el usuario ejecuta `download cv`, THE Terminal SHALL continuar siendo interactiva después de iniciada la descarga, sin bloquear el campo de entrada.

---

### Requirement 13: Comando `ask <pregunta>` — Integración con IA

**User Story:** Como visitante, quiero hacer preguntas en lenguaje natural sobre el profesional, para obtener respuestas personalizadas sin memorizar comandos.

#### Acceptance Criteria

1. WHEN el usuario ejecuta `ask <pregunta>` con texto no vacío como argumento, THE Gemini_Client SHALL construir un request a la API de Google Gemini que incluya el contenido serializado de `profile.ts` como contexto en el system prompt y la pregunta del usuario como mensaje del usuario.
2. WHEN la llamada a Gemini está en progreso, THE Terminal SHALL mostrar un indicador de carga visible y no vacío en el Output que se actualice al menos una vez por segundo hasta recibir la respuesta.
3. WHEN la llamada a Gemini retorna exitosamente, THE Terminal SHALL reemplazar el indicador de carga con el texto de la respuesta recibida en el Output.
4. IF la llamada a Gemini falla con un error de red o un código de error HTTP de la API, THEN THE Terminal SHALL reemplazar el indicador de carga con un mensaje de error en color `--text-error` que indique si el fallo fue de red o incluya el código de error HTTP recibido.
5. WHEN el usuario ejecuta `ask` sin argumentos o solo con espacios, THE Command_Registry SHALL retornar un mensaje de uso que muestre la sintaxis correcta: `ask <pregunta>`.
6. THE Gemini_Client SHALL incluir en el system prompt la instrucción de restringir las respuestas al perfil profesional y de limitar cada respuesta a un máximo de 3 párrafos.
7. THE Gemini_Client SHALL leer la API key desde la variable de entorno `NEXT_PUBLIC_GEMINI_KEY`.
8. IF la variable de entorno `NEXT_PUBLIC_GEMINI_KEY` está ausente o vacía al momento de ejecutar `ask`, THEN THE Gemini_Client SHALL retornar inmediatamente un error sin realizar ninguna llamada HTTP a la API de Gemini, y THE Terminal SHALL mostrar un mensaje de error en color `--text-error` indicando que la API key no está configurada.

---

### Requirement 14: Comando `theme <dark|light|matrix>`

**User Story:** Como visitante, quiero cambiar el tema visual de la terminal, para personalizar mi experiencia de navegación.

#### Acceptance Criteria

1. WHEN el usuario ejecuta `theme dark`, THE Terminal SHALL aplicar el Theme `dark` de modo que el color de fondo y el color de texto primario del panel terminal sean visualmente distinguibles entre sí y distintos a los aplicados por los Themes `light` y `matrix`.
2. WHEN el usuario ejecuta `theme light`, THE Terminal SHALL aplicar el Theme `light` con un ratio de contraste entre texto primario y fondo de al menos 4.5:1 conforme a WCAG 2.1 AA, con fondo visualmente claro.
3. WHEN el usuario ejecuta `theme matrix`, THE Terminal SHALL aplicar el Theme `matrix` con fondo negro y un color de texto primario verde distinto al del Theme `dark`, e incluir un efecto visual observable (por ejemplo, brillo o sombra) que diferencie este tema de los demás.
4. IF el usuario ejecuta `theme` sin argumentos o con un valor no reconocido, THEN THE Command_Registry SHALL retornar un mensaje que liste los valores válidos (`dark`, `light`, `matrix`) sin modificar el Theme activo.
5. WHEN el usuario ejecuta `theme <valor>` con un valor válido, THE Terminal SHALL persistir el identificador del Theme en `localStorage` bajo una clave fija.
6. WHEN la aplicación carga en el navegador, THE Terminal SHALL leer el identificador de Theme almacenado en `localStorage` y aplicarlo; IF no existe ningún valor almacenado, THEN SHALL aplicar el Theme `dark` por defecto.

---

### Requirement 15: Comando `lang <es|en>`

**User Story:** Como visitante, quiero cambiar el idioma del contenido de la terminal, para leer el portfolio en mi idioma preferido.

#### Acceptance Criteria

1. WHEN el usuario ejecuta `lang es`, THE Terminal SHALL establecer el Lang activo a `es`; todos los comandos de contenido (`about`, `experience`, `projects`, `skills`, `contact`, `social`, `whoami`, `ask`) retornarán su Output en español para las ejecuciones posteriores a este cambio.
2. WHEN el usuario ejecuta `lang en`, THE Terminal SHALL establecer el Lang activo a `en`; todos los comandos de contenido retornarán su Output en inglés para las ejecuciones posteriores a este cambio.
3. IF el usuario ejecuta `lang` sin argumentos o con un valor no reconocido, THEN THE Command_Registry SHALL retornar un mensaje que liste los códigos válidos (`es`, `en`) sin modificar el Lang activo.
4. WHEN el usuario ejecuta `lang <código>` con un código válido y diferente al Lang activo, THE Terminal SHALL persistir el código de idioma en `localStorage` bajo una clave fija.
5. WHEN la aplicación carga en el navegador, THE Terminal SHALL leer el código de idioma almacenado en `localStorage` y establecerlo como Lang activo; IF no existe ningún valor almacenado o la lectura falla, THEN SHALL aplicar `es` como Lang por defecto.

---

### Requirement 16: Manejo de Comandos Desconocidos

**User Story:** Como visitante, quiero recibir una respuesta útil cuando escribo un comando no reconocido, para saber que debo tipear `help`.

#### Acceptance Criteria

1. WHEN el usuario ejecuta una cadena de texto que no coincide con ningún comando registrado en el Command_Registry, THE Terminal SHALL mostrar en el Output un mensaje con el color `--text-error` que incluya el token ingresado y sugiera ejecutar `help` para ver los comandos disponibles.
2. WHEN el mensaje de comando no encontrado se muestra en el Output, THE Terminal SHALL mantener el campo de entrada activo y enfocado para que el usuario pueda continuar escribiendo comandos sin intervención adicional.

---

### Requirement 17: Diseño Visual — Fondo e Imagen

**User Story:** Como visitante, quiero ver una terminal con fondo visual atractivo, para que el portfolio tenga identidad visual propia.

#### Acceptance Criteria

1. WHEN la aplicación carga en el navegador, THE Terminal SHALL mostrar una imagen de fondo que cubra el 100% del área visible sin deformación ni pixelado, centrada en el viewport, de modo que la imagen no deje áreas sin cubrir en ninguna resolución soportada.
2. WHEN la imagen de fondo está visible, THE Terminal SHALL mostrar sobre ella un overlay semitransparente oscuro que garantice un ratio de contraste de al menos 4.5:1 entre el texto del panel terminal y el fondo combinado (overlay + imagen), conforme a WCAG 2.1 AA.
3. THE Terminal SHALL aplicar la fuente JetBrains Mono o Fira Code a todo el contenido textual (entrada, salida, prompt, banner), con una cadena de fallback que incluya al menos una fuente genérica `monospace`, y un tamaño mínimo de 14px.
4. IF la imagen de fondo no puede cargarse (error de red o archivo no encontrado), THEN THE Terminal SHALL mostrar un color de fondo sólido oscuro como fallback, manteniendo la legibilidad del texto.

---

### Requirement 18: Layout Responsivo — Desktop

**User Story:** Como visitante en desktop, quiero ver la terminal centrada y bien dimensionada, para una experiencia cómoda en pantalla grande.

#### Acceptance Criteria

1. WHILE el viewport tiene un ancho mayor o igual a 768px, THE Terminal SHALL renderizarse centrada horizontal y verticalmente en el viewport, con un ancho máximo de 900px y una altura de 80% del alto del viewport.
2. WHILE el viewport tiene un ancho mayor o igual a 768px, THE Terminal SHALL mostrar el campo de entrada fijo y siempre visible al fondo del panel, mientras el área de History tiene scroll interno independiente.
3. WHEN se agrega una nueva entrada al History en desktop, THE Terminal SHALL hacer scroll automático al final del área de History de modo que la entrada más reciente quede visible sin acción del usuario.

---

### Requirement 19: Layout Responsivo — Mobile

**User Story:** Como visitante en móvil, quiero que la terminal ocupe toda la pantalla y tenga botones de comandos rápidos, para una experiencia táctil cómoda.

#### Acceptance Criteria

1. WHILE el viewport tiene un ancho menor a 768px, THE Terminal SHALL ocupar el 100% del alto del viewport usando la unidad `100dvh`, de modo que el área visible se ajuste automáticamente cuando el teclado virtual de iOS o Android está abierto o cerrado.
2. WHILE el viewport tiene un ancho menor a 768px, THE Terminal SHALL mostrar el componente Mobile_Shortcuts con botones para `help`, `about`, `projects`, `contact` y `clear`, posicionados de forma fija inmediatamente sobre el teclado virtual cuando está abierto, y sobre el campo de entrada cuando el teclado está cerrado.
3. WHEN el usuario toca un botón de Mobile_Shortcuts, THE Terminal SHALL ejecutar el comando correspondiente y agregarlo al History exactamente igual que si el usuario lo hubiera escrito en el campo de entrada y presionado Enter; los shortcuts SHALL permanecer activos durante el procesamiento de comandos normales y desactivarse únicamente si el comando `ask` está esperando respuesta de la API.
4. WHILE el viewport tiene un ancho menor a 768px, THE Terminal SHALL aplicar un tamaño de fuente mínimo de 14px en el campo de entrada para prevenir el zoom automático de iOS al enfocar el input.
5. WHEN el usuario toca cualquier área del panel Terminal en mobile que no sea un enlace ni un botón de Mobile_Shortcuts, THE Terminal SHALL enfocar automáticamente el campo de entrada.

---

### Requirement 20: Datos del Perfil — Fuente Única de Verdad

**User Story:** Como desarrollador del portfolio, quiero que toda la información profesional esté centralizada en un único archivo, para facilitar la actualización del contenido sin tocar lógica de UI.

#### Acceptance Criteria

1. THE Profile SHALL exportar desde `src/data/profile.ts` un objeto tipado con claves `es` y `en` que contengan, para cada idioma, los datos de bio, experiencia laboral, proyectos, skills, contacto, redes sociales, URL del CV y texto de `whoami`.
2. WHEN el Lang activo cambia, THE Command_Registry SHALL acceder a los datos de contenido usando la clave del Lang activo sobre el objeto Profile, sin transformaciones adicionales de idioma en la capa de UI.
3. THE Command_Registry SHALL obtener los datos para los comandos de contenido (`about`, `experience`, `projects`, `skills`, `contact`, `social`, `whoami`, `ask`) exclusivamente del objeto Profile importado; ningún texto de contenido profesional SHALL estar codificado como literal en componentes de UI o en el Command_Registry.
4. IF el objeto Profile no contiene la clave del Lang activo o el campo requerido para un comando específico, THEN THE Command_Registry SHALL usar el valor de la clave `es` como fallback; si tampoco existe en `es`, SHALL retornar un mensaje de error indicando que el contenido no está disponible.

---

### Requirement 21: Deploy Estático — Static Export y GitHub Pages

**User Story:** Como dueño del portfolio, quiero que el sitio se publique automáticamente en GitHub Pages al hacer push a `main`, para mantener el portfolio siempre actualizado sin intervención manual.

#### Acceptance Criteria

1. THE Static_Export SHALL configurar Next.js con `output: 'export'` en `next.config.js` de modo que `next build` genere únicamente archivos estáticos HTML, CSS y JS en el directorio `/out`, sin dependencias de runtime de servidor Node.js.
2. WHEN se detecta un push a la rama `main`, THE CI_CD_Pipeline SHALL ejecutar `npm ci` seguido de `next build` usando Node.js 20, inyectando `NEXT_PUBLIC_GEMINI_KEY` desde los secrets del repositorio como variable de entorno de build.
3. WHEN el build de Next.js finaliza exitosamente, THE CI_CD_Pipeline SHALL publicar el contenido del directorio `/out` en GitHub Pages usando el token `GITHUB_TOKEN` provisto por Actions.
4. IF el build de Next.js falla, THEN THE CI_CD_Pipeline SHALL marcar el workflow como fallido, registrar el error en el log del workflow, y no publicar ningún contenido nuevo en GitHub Pages.
5. THE Static_Export SHALL configurar `images: { unoptimized: true }` en `next.config.js` para compatibilidad con el export estático.
6. IF el repositorio no es del tipo `username.github.io` sino un repositorio de proyecto, THEN THE Static_Export SHALL configurar `basePath` y `assetPrefix` en `next.config.js` con el nombre del repositorio para que los assets se resuelvan correctamente bajo la sub-ruta de GitHub Pages.

---

### Requirement 22: Accesibilidad

**User Story:** Como visitante que usa tecnologías asistivas, quiero poder interactuar con la terminal y recibir los outputs del sistema, para acceder al portfolio de forma equitativa.

#### Acceptance Criteria

1. THE Terminal SHALL asignar al campo de entrada de comandos un atributo `aria-label` con un valor que identifique explícitamente el propósito del campo (por ejemplo, "Entrada de comandos de la terminal").
2. THE Terminal SHALL marcar el contenedor del área de History con `aria-live="polite"` y `aria-atomic="false"` de modo que los screen readers anuncien cada nuevo Output individualmente al agregarse al History.
3. WHILE cualquier Theme está activo, THE Terminal SHALL mantener un ratio de contraste de al menos 4.5:1 entre el color de texto primario y el color de fondo del panel terminal, conforme a WCAG 2.1 nivel AA.
4. THE Terminal SHALL asignar `role="button"` y un `aria-label` descriptivo a cada botón de Mobile_Shortcuts para que sean anunciados correctamente por screen readers.
