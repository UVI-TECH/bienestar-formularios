# bienestar-formularios

Digitalización de los formatos del área de salud de Bienestar Universitario de
la UNIAJC (Cali, Colombia). Next.js 16 · App Router · TypeScript · Tailwind v4 ·
Motion.

```bash
cp .env.example .env.local   # SMARTCAMPUS_MOCK=true basta para desarrollar
npm run dev                  # http://localhost:3000
npm run build
```

## Estructura

```
app/
  layout.tsx                 Fuentes, metadatos, encabezado y pie institucionales
  page.tsx                   Índice con las tarjetas hacia los formularios habilitados
  globals.css                SISTEMA DE DISEÑO: todos los tokens visuales
  enfermeria/page.tsx        Asistencia a Enfermería (BH-F-013)
  consulta-medica/page.tsx   Consulta Médica (BH-F-020)
  tamizaje/page.tsx          Tamizaje (BH-F-016), con IMC en vivo
  poliza/page.tsx            Atención por Accidente — Póliza Estudiantil
  brigadas/                  Asistencia a Brigada de Salud (BH-F-014) — evento + lista
    page.tsx
    FormularioBrigada.tsx
    SubformularioAsistente.tsx
    ListaAsistentes.tsx
    tipos.ts
  actividades/                Asistencia a Actividades Institucionales (BH-F-033)
    page.tsx                 Mismo molde que brigadas, sin datos clínicos
    FormularioActividad.tsx
    SubformularioAsistente.tsx
    ListaAsistentes.tsx
    tipos.ts
  planificacion/page.tsx      Planificación Familiar (BH-F-015)
  planificacion/PlanificacionFamiliar.tsx
  api/lookup/route.ts        POST · consulta de estudiante por documento
  api/submit/[formato]/      POST · entrega el registro genérico a Power Automate
  api/submit/brigada/        POST · entrega una brigada completa (evento + asistentes)
  api/submit/actividad/      POST · entrega una actividad completa (evento + asistentes)
components/
  forms/
    FormularioBase.tsx       Envoltura: encabezado, estado de envío, confirmación
    FormularioAtencion.tsx   Estructura común de Enfermería y Consulta Médica
    BloqueIdentificacion.tsx Identificación + consulta a Smart Campus + bloqueo
    useConsultaCedula.ts     Máquina de estados de la consulta
    AvisoConsulta.tsx        Franja con el resultado de la consulta
    ResumenRegistro.tsx      Lista de datos de la pantalla de confirmación
    SeccionFormulario.tsx    Agrupación de campos (fieldset + legend)
    RejillaCampos.tsx        Rejilla estándar de 2 o 3 columnas
    CampoContenedor.tsx      Etiqueta + control + mensaje (base de los campos)
    CampoTexto.tsx
    CampoSelect.tsx          Siempre con opción vacía "Seleccione…"
    CampoRadio.tsx           Opciones excluyentes a la vista (Sí/No, estado)
    CampoFecha.tsx           Por defecto, hoy
    CampoHora.tsx            Por defecto, ahora
    CampoTextarea.tsx
    CampoCedula.tsx          Numérico 6–12 dígitos + botón "Buscar"
    CampoCondicional.tsx     Entrada/salida con expansión de altura
    BotonEnviar.tsx          Estados reposo → enviando → éxito
    index.ts                 Barril de exportaciones
  ui/                        Encabezado, pie, código de formato, girador, checks
lib/
  catalogos.ts               SEDES, TIPOS_PERSONA, SEXO, SEMESTRES, PROGRAMAS,
                             ENFERMERAS, PROFESIONALES
  antropometria.ts           Cálculo y clasificación del IMC
  types.ts                   Tipos base de los formularios
  formatos.ts                Código (o sello), título y ruta de cada formato
  identificacion.ts          DatosIdentificacion e IDENTIFICACION_VACIA
  smartcampus.ts             Cliente del servicio externo (sólo servidor)
  limitadorTasa.ts           Límite de consultas por IP
  lookup.ts                  Cliente de /api/lookup (navegador)
  envio.ts                   Saneamiento del registro y radicados (caso_id,
                             brigada_id, actividad_id) — sólo servidor
  enviarRegistro.ts          Cliente de /api/submit/[formato] (navegador)
  enviarBrigada.ts           Cliente de /api/submit/brigada (navegador)
  enviarActividad.ts         Cliente de /api/submit/actividad (navegador)
  fechas.ts                  Fecha/hora en zona America/Bogota
  validacion.ts              Reglas de validación reutilizables
  motion.ts                  Tokens de movimiento para JavaScript
  cn.ts
```

Los siete formularios están implementados.

Enfermería y Consulta Médica comparten toda su estructura, así que ambas páginas
son un envoltorio de `FormularioAtencion`: sólo cambian el formato, la ruta de
envío y quién atiende. Tamizaje, Póliza y Planificación Familiar tienen sus
propios campos.

Póliza es el formulario más largo, y por eso sus cuatro secciones llevan marca
de paso (A–D) y separación amplia: se recorre de corrido, sin partirlo en
páginas, para que se pueda volver atrás con la vista. La sección D va en panel
destacado porque es la que decide si el caso queda abierto.

Brigada de Salud y Actividades Institucionales siguen un molde distinto:
**evento + lista**. A diferencia de los demás, un registro no es una persona
sino un evento (fecha, lugar, quién lo atiende o lo dicta) al que asisten
varias personas: los datos del evento se capturan una sola vez arriba, y los
asistentes se van agregando a una lista con su propio sub-formulario —
`SubformularioAsistente` — antes de enviar todo junto. Actividades es el mismo
patrón sin datos clínicos: sin consulta a Smart Campus ni asistente de
redacción, sólo campos de texto simples.

## Sistema de diseño

Todos los tokens viven en `app/globals.css`, dentro del bloque `@theme`. No use
valores sueltos en los componentes.

- **Color.** Rampa `--color-inst-*` (azul institucional) y `--color-neutro-*`
  (neutros cálidos), más roles semánticos: `--color-lienzo`, `--color-superficie`,
  `--color-borde`, `--color-texto`… En Tailwind se usan como `bg-inst-700`,
  `text-texto-medio`, `border-borde`.
- **Tipografía.** Source Serif 4 para títulos, IBM Plex Sans para interfaz y
  captura, IBM Plex Mono para códigos de formato. Escala propia: `text-meta`,
  `text-etiqueta`, `text-ayuda`, `text-campo`, `text-cuerpo`, `text-seccion`,
  `text-subtitulo`, `text-titulo`, `text-portada`.
- **Controles.** Las clases `control-base`, `boton-primario` y `boton-secundario`
  concentran la apariencia de campos y botones (altura mínima de 46 px, tipografía
  de 16 px para no provocar zoom en tablet).

### Cambiar el azul institucional

Reemplace los once valores `--color-inst-50 … --color-inst-950` en
`app/globals.css`. Nada más: toda la interfaz los hereda.

## Movimiento

Es funcional, no decorativo. Se define en dos sitios que deben mantenerse
sincronizados: `app/globals.css` (`--dur-*`, `--ease-salida`) para CSS, y
`lib/motion.ts` para Motion, que trabaja en segundos.

- Todas las transiciones duran entre 150 y 250 ms con la misma curva `ease-out`.
  `--default-transition-*` hace que cualquier utilidad `transition-*` de Tailwind
  las herede sin configuración extra.
- Los campos condicionales (`CampoCondicional`) entran y salen con expansión de
  altura y fade; la separación superior va dentro del bloque animado para que no
  quede un hueco al cerrarse.
- El botón de envío funde sus tres estados sobre una misma celda de rejilla, con
  un texto invisible que fija el ancho: nunca cambia de tamaño.
- Los errores aparecen con un fade corto bajo el campo. La franja de mensaje
  reserva siempre una línea, así que el formulario no salta.
- La confirmación entra con una transición breve y un visto que se dibuja una
  sola vez.
- No hay animación en cada pulsación de tecla ni en la navegación entre páginas.
- `prefers-reduced-motion` se respeta en CSS (regla global) y en JS
  (`useReducedMotion`). El girador se conserva, pero lento: indica estado.

## Consulta por documento · `POST /api/lookup`

Trae los datos de un estudiante desde el servicio REST de la oficina Smart
Campus (`POST /api/v1/aulas-virtuales/estudiantes/consultar`, sin autenticación).

```
Cuerpo:     { cedula: string, tipoPersona?: string }
Respuesta:  { encontrado: boolean, nombres?, apellidos?, programa?, semestre? }
```

Hacia Smart Campus se envía `{ documento, peunId }` y se recibe un sobre
`{ codigo, mensaje, valor }`, con la persona dentro de `valor`:

```json
{ "codigo": 200, "mensaje": "Estudiante obtenido con éxito",
  "valor": { "nombre": "…", "apellido": "…", "programa": "…",
             "codigoPrograma": "…", "facultad": "…", "correoInstitucional": "…",
             "correoPersonal": "…", "grupos": [], "unidadDocente": "…",
             "usuario": "…", "documentoIdentidad": "…" } }
```

De ahí sólo se publican **nombres, apellidos y programa**: los correos, la
facultad y los grupos no salen del servidor porque el formulario no los
necesita. `valor: null` con código 200 significa "sin registro para ese
documento y ese periodo", y se traduce a `encontrado: false`.

> El Swagger del servicio declara la `Persona` como cuerpo directo del 200, pero
> el servicio responde con el sobre. `lib/smartcampus.ts` admite las dos formas
> porque documentación y comportamiento no coinciden.
> Documentación viva: `http://smartcampus.uniajc.edu.co:9000/<contexto>/swagger-ui.html`

**El servicio no devuelve el semestre**, así que ese campo lo elige siempre
quien registra, incluso cuando la consulta encuentra a la persona.

Esa forma de respuesta **no cambia nunca**. Las condiciones de error viajan en
el código HTTP y el cuerpo sigue siendo `{ encontrado: false }`, para que un
cliente que sólo lea el JSON no se rompa:

| Código | Situación                                          |
| ------ | -------------------------------------------------- |
| `200`  | Consulta resuelta (encontrado o no)                 |
| `400`  | Cuerpo ilegible, o cédula ausente o inválida        |
| `429`  | Más de 10 consultas por minuto desde la misma IP    |
| `502`  | Smart Campus falló, no respondió o está sin configurar |

La respuesta cruda del servicio externo nunca se reenvía: `lib/smartcampus.ts`
la mapea a los cuatro campos publicados y descarta el resto. Un `tipoPersona`
distinto de `Estudiante` se resuelve como no encontrado sin salir a la red,
porque Smart Campus sólo conoce estudiantes.

### Variables de entorno

Las tres están documentadas en `.env.example`. Con `SMARTCAMPUS_MOCK=true` el
endpoint no sale a la red: devuelve datos falsos deterministas derivados de la
cédula, con 400 ms de latencia simulada. **Las cédulas terminadas en 0 responden
"no encontrado"**, para poder probar ese camino sin tocar código.

### Comportamiento en el formulario

`BloqueIdentificacion` conecta `CampoCedula` con el endpoint:

- **Encontrado** → los campos se rellenan y quedan en sólo lectura, con un aviso
  y el enlace "Editar manualmente" para liberarlos si el registro está
  desactualizado.
- **No encontrado o error** → no hay nada que bloquear: los campos siguen
  editables y el aviso explica qué pasó.
- **Si cambia el documento** después de una consulta, los datos traídos se
  borran. Dejarlos sería peor que no tenerlos: se podría registrar la atención
  de una persona a nombre de otra.

Un programa que venga de Smart Campus y no esté en el catálogo local se agrega
como opción del `CampoSelect` en lugar de perderse en silencio.

En `/enfermeria` la consulta sólo se ofrece cuando el tipo de persona es
**Estudiante**: para docentes y administrativos el botón "Buscar" ni aparece,
porque Smart Campus no los conoce.

## Envío de registros · `POST /api/submit/[formato]`

Entrega el registro al flujo de Power Automate que lo agrega como fila en Excel.
Formatos aceptados: `enfermeria`, `consulta-medica`, `tamizaje`, `poliza`,
`planificacion`.

El cuerpo son claves planas en snake_case; el servidor agrega `registrado_en`
(ISO, reloj del servidor) y descarta cualquier clave con formato inesperado,
objeto o arreglo, para que el navegador no pueda inyectar estructuras en el
flujo. La URL del flujo vive en `PA_URL_<FORMATO>` y **nunca sale del servidor**:
ni su valor ni el cuerpo de error del flujo se reflejan en la respuesta.
`planificacion` es la única excepción al nombre de variable: por razones
históricas usa `PA_URL_GUARDAR_PLANIFICACION` en vez de `PA_URL_PLANIFICACION`
(ver `variableDeFlujo` en `lib/envio.ts`).

| Código | Situación                                        |
| ------ | ------------------------------------------------ |
| `200`  | `{ ok: true }` · registro entregado              |
| `400`  | Cuerpo ilegible o sin campos utilizables          |
| `404`  | Formato desconocido                               |
| `502`  | El flujo falló, no respondió o no está configurado |

Con `SUBMIT_MOCK=true` nada sale a la red: el registro se escribe en la consola
del servidor y se responde éxito tras 500 ms.

### Columnas por formato

Los campos que no aplican al tipo de persona van **vacíos, no ausentes**, para
que la tabla conserve siempre las mismas columnas.

`enfermeria` y `consulta-medica` — idénticos salvo la última clave:

```
fecha · hora · sede · tipo_persona · cedula · nombres · apellidos ·
programa · semestre · dependencia · motivo · procedimiento ·
enfermera (o profesional) · registrado_en
```

`tamizaje` — `edad`, `peso`, `talla`, `imc` y `glicemia` viajan como números,
no como texto, para que Excel pueda promediarlos. `peso` va en kilogramos y
`talla` en centímetros:

```
fecha · sede · tipo_persona · cedula · nombres · apellidos · programa ·
edad · peso · talla · imc · clasificacion_imc · tension_arterial ·
glicemia · auxiliar · registrado_en
```

La tensión arterial se captura con máscara `###/###` y se valida por rangos:
sistólica 60–250 mmHg, diastólica 30–150 mmHg y sistólica mayor que la
diastólica.

`poliza` — el servidor agrega `caso_id`, además de `registrado_en`. Los
teléfonos van como **texto**, para no perder el cero inicial ni que Excel los
convierta a notación científica; `area_protegida` y `ambulancia` van como
`"Sí"`/`"No"`, que se lee mejor que un booleano en los informes:

```
caso_id · fecha_accidente · hora_accidente · sede · lugar_accidente ·
hora_ingreso · cedula · nombres · apellidos · sexo · programa · semestre ·
telefono_estudiante · telefono_familiar · enfermera · atencion_inicial ·
area_protegida · hora_llamada · medico_area_protegida · ambulancia ·
tipo_remision · centro_medico · diagnostico_presuntivo · hora_egreso ·
acompanante · observaciones · estado · registrado_en
```

`planificacion` — mismo criterio que enfermeria/consulta-medica, sin `hora` ni
`dependencia`:

```
fecha · sede · tipo_persona · cedula · nombres · apellidos · programa ·
semestre · medicamento · observacion · profesional · registrado_en
```

### Índice de masa corporal

`lib/antropometria.ts` calcula IMC = peso / talla², redondeado a un decimal, y
lo clasifica con los rangos de la OMS (bajo peso, peso normal, sobrepeso,
obesidad). Se recalcula en cada tecla y se envía ya calculado, junto con la
clasificación, para que la fila pueda leerse sin repetir la cuenta.

El valor es informativo: se presenta como lectura, en texto neutro y sin
semáforos, porque acompaña la medición y no la diagnostica.

## Eventos con lista de asistentes · `POST /api/submit/brigada` y `POST /api/submit/actividad`

Brigada de Salud y Actividades Institucionales no son un registro por persona:
son **un evento al que asisten varias personas**. Por eso no pasan por el
endpoint genérico de arriba — su cuerpo trae un arreglo (`asistentes`), y
`sanearRegistro` descarta arreglos a propósito para los formatos de fila plana
— sino por su propia ruta, que sanea el arreglo a mano y limita cuántos
asistentes admite por envío (300 en brigada, 500 en actividad).

```
POST /api/submit/brigada
{ fecha, empresa, profesional, sede,
  asistentes: [{ documento, nombres, apellidos, tipo_persona, semestre,
                 programa, motivo_consulta }, …] }
→ { ok, brigada_id, asistentes }

POST /api/submit/actividad
{ tema, facilitador, fecha, hora_inicio, hora_fin, lugar,
  asistentes: [{ nombres_apellidos, documento, cargo, dependencia, correo }, …] }
→ { ok, actividad_id, asistentes }
```

El servidor agrega `registrado_en` y el radicado del evento (ver abajo); igual
que en el endpoint genérico, la URL del flujo — `PA_URL_GUARDAR_BRIGADA` o
`PA_URL_GUARDAR_ACTIVIDAD` — nunca sale del servidor, y con `SUBMIT_MOCK=true`
ninguna de las dos rutas sale a la red.

En pantalla, cada asistente se arma en su propio sub-formulario
(`SubformularioAsistente`) y se agrega a una lista (`ListaAsistentes`) que
entra animada; el botón de envío queda deshabilitado
(`FormularioBase.enviarDeshabilitado`) hasta que el evento es válido y hay al
menos un asistente en la lista.

### Radicados (`caso_id`, `brigada_id`, `actividad_id`)

Póliza, Brigada de Salud y Actividades Institucionales necesitan un
identificador propio para el registro. Los tres salen de la misma función,
`generarRadicado` en `lib/envio.ts`, con el formato
`{prefijo}-{AAAA}-{6 caracteres base 36}` — `AP-2026-1KP4ZC`,
`BRG-2026-1KP4ZC`, `ACT-2026-1KP4ZC` —, tomando el año en hora de Colombia. Lo
genera el servidor y se devuelve al navegador para mostrarlo en la
confirmación.

Es la llave que une el registro con lo que dependa de él (los seguimientos y
la carpeta de soportes de un caso, la lista de asistentes de una brigada o
actividad), así que la prioridad es que no se repita. El sufijo son **los
milisegundos del reloj en base 36**, no un número al azar: como los registros
reales están separados por segundos o minutos, dos radicados del mismo prefijo
sólo coinciden si

- el servidor los sella en el **mismo milisegundo**, o
- están separados por un múltiplo exacto de 25,2 días **al milisegundo**
  (≈ 1 en 2 176 millones).

Medido sobre 5 000 registros de un año separados entre 1 y 600 s: **ninguna
colisión**. Como efecto secundario el sufijo crece con el tiempo, así que dentro
de una misma ventana de 25 días los radicados quedan en orden cronológico.

> El alfabeto base 36 en mayúsculas incluye caracteres que se confunden al
> dictar o teclear (`0`/`O`, `1`/`I`). Como el radicado se copia de la pantalla
> de confirmación, en la práctica no estorba; si se va a dictar por teléfono,
> conviene cambiar a un alfabeto sin ambigüedades (Crockford base 32).

## Pendientes conocidos

- **Accidente por Póliza Estudiantil** es un instrumento nuevo y todavía no
  tiene código en Isolución. En `lib/formatos.ts` lleva `sello` en lugar de
  `codigo`/`version`, y se muestra con borde punteado. Cuando Calidad le asigne
  código, cámbielo allí: el resto de la aplicación se adapta sola.
- El azul institucional es un marcador de posición.
- **Falta el host de Smart Campus.** Conocemos la ruta, el cuerpo y la
  respuesta, y el código ya los implementa, pero `SMARTCAMPUS_URL` necesita la
  URL completa. Hasta entonces el proyecto corre con `SMARTCAMPUS_MOCK=true` y
  la integración real no se ha podido probar contra el servicio.
- **Faltan las URL de los flujos de Power Automate** (`PA_URL_*`), así que el
  envío corre con `SUBMIT_MOCK=true`.
- **El límite de consultas vive en memoria del proceso.** Se reinicia en cada
  despliegue y, con varias instancias, cada una lleva su propia cuenta. Antes de
  producción hay que migrarlo a Upstash Redis (`lib/limitadorTasa.ts` tiene el
  TODO).
- Sin autenticación y sin persistencia: el estado vive solo en memoria (React
  state). No se usa `localStorage`.
