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
  page.tsx                   Índice con las tarjetas hacia los cuatro formularios
  globals.css                SISTEMA DE DISEÑO: todos los tokens visuales
  enfermeria/page.tsx        Asistencia a Enfermería (BH-F-013)
  consulta-medica/page.tsx   Consulta Médica (BH-F-020)
  tamizaje/page.tsx          Tamizaje (BH-F-016), con IMC en vivo
  api/lookup/route.ts        POST · consulta de estudiante por documento
  api/submit/[formato]/      POST · entrega del registro a Power Automate
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
  envio.ts                   Saneamiento del registro (sólo servidor)
  enviarRegistro.ts          Cliente de /api/submit (navegador)
  fechas.ts                  Fecha/hora en zona America/Bogota
  validacion.ts              Reglas de validación reutilizables
  motion.ts                  Tokens de movimiento para JavaScript
  cn.ts
```

`/enfermeria`, `/consulta-medica` y `/tamizaje` están implementados. Falta
`/poliza`, que hereda el sistema de diseño, `FormularioBase` y los campos.

Enfermería y Consulta Médica comparten toda su estructura, así que ambas páginas
son un envoltorio de `FormularioAtencion`: sólo cambian el formato, la ruta de
envío y quién atiende. Tamizaje tiene su propio conjunto de campos.

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
Formatos aceptados: `enfermeria`, `consulta-medica`, `tamizaje`, `poliza`.

El cuerpo son claves planas en snake_case; el servidor agrega `registrado_en`
(ISO, reloj del servidor) y descarta cualquier clave con formato inesperado,
objeto o arreglo, para que el navegador no pueda inyectar estructuras en el
flujo. La URL del flujo vive en `PA_URL_<FORMATO>` y **nunca sale del servidor**:
ni su valor ni el cuerpo de error del flujo se reflejan en la respuesta.

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

`tamizaje` — `edad`, `peso_kg`, `talla_cm`, `imc` y `glicemia` viajan como
números, no como texto, para que Excel pueda promediarlos:

```
fecha · sede · tipo_persona · cedula · nombres · apellidos · programa ·
edad · peso_kg · talla_cm · imc · clasificacion_imc · tension_arterial ·
glicemia · auxiliar · registrado_en
```

### Índice de masa corporal

`lib/antropometria.ts` calcula IMC = peso / talla², redondeado a un decimal, y
lo clasifica con los rangos de la OMS (bajo peso, peso normal, sobrepeso,
obesidad). Se recalcula en cada tecla y se envía ya calculado, junto con la
clasificación, para que la fila pueda leerse sin repetir la cuenta.

El valor es informativo: se presenta como lectura, en texto neutro y sin
semáforos, porque acompaña la medición y no la diagnostica.

## Pendientes conocidos

- **`PROFESIONALES` está vacío en `lib/catalogos.ts`, así que `/consulta-medica`
  no se puede enviar todavía**: el campo "Médico/profesional que atiende" es
  obligatorio y aparece deshabilitado con el texto "Catálogo sin configurar".
  El formulario queda operativo apenas se pueble la lista.
- **La tensión arterial admite dos cifras de diastólica** (`###/##`, como se
  especificó), de modo que no se puede registrar 120/100. Si en la práctica se
  presentan diastólicas de tres cifras, hay que ampliar la máscara y la
  validación en `lib/validacion.ts`.
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
