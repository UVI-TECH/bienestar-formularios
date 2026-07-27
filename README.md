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
  api/lookup/route.ts        POST · consulta de estudiante por documento
components/
  forms/
    FormularioBase.tsx       Envoltura: encabezado, estado de envío, confirmación
    BloqueIdentificacion.tsx Identificación + consulta a Smart Campus + bloqueo
    useConsultaCedula.ts     Máquina de estados de la consulta
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
  catalogos.ts               SEDES, TIPOS_PERSONA, SEXO, SEMESTRES, PROGRAMAS, ENFERMERAS
  types.ts                   Tipos base de los formularios
  formatos.ts                Código (o sello), título y ruta de cada formato
  identificacion.ts          DatosIdentificacion e IDENTIFICACION_VACIA
  smartcampus.ts             Cliente del servicio externo (sólo servidor)
  limitadorTasa.ts           Límite de consultas por IP
  lookup.ts                  Cliente de /api/lookup (navegador)
  fechas.ts                  Fecha/hora en zona America/Bogota
  validacion.ts              Reglas de validación reutilizables
  motion.ts                  Tokens de movimiento para JavaScript
  cn.ts
```

Los formularios (`/enfermeria`, `/consulta-medica`, `/tamizaje`, `/poliza`) aún
no existen: esta entrega es el índice, la base y los componentes.

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
Campus (`estudiantes/consultar`, sin autenticación).

```
Cuerpo:     { cedula: string, tipoPersona?: string }
Respuesta:  { encontrado: boolean, nombres?, apellidos?, programa?, semestre? }
```

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

## Pendientes conocidos

- `PROGRAMAS` y `ENFERMERAS` en `lib/catalogos.ts` están vacíos. Mientras lo
  estén, `CampoSelect` se muestra deshabilitado con el texto
  "Catálogo sin configurar" en lugar de un desplegable vacío.
- **Accidente por Póliza Estudiantil** es un instrumento nuevo y todavía no
  tiene código en Isolución. En `lib/formatos.ts` lleva `sello` en lugar de
  `codigo`/`version`, y se muestra con borde punteado. Cuando Calidad le asigne
  código, cámbielo allí: el resto de la aplicación se adapta sola.
- El azul institucional es un marcador de posición.
- **`SMARTCAMPUS_PEUN_ID` está sin definir** (hay que pedírselo a la oficina
  Smart Campus), así que el proyecto corre en modo simulado.
- **El mapeo de la respuesta de Smart Campus es una conjetura.** En
  `lib/smartcampus.ts`, `mapearRespuesta` prueba varios nombres de clave
  (`nombres`/`nombre`/`primerNombre`, etc.) porque no conocemos el contrato
  real. Al recibirlo, hay que dejar sólo las claves correctas.
- **El límite de consultas vive en memoria del proceso.** Se reinicia en cada
  despliegue y, con varias instancias, cada una lleva su propia cuenta. Antes de
  producción hay que migrarlo a Upstash Redis (`lib/limitadorTasa.ts` tiene el
  TODO).
- Sin autenticación y sin persistencia: el estado vive solo en memoria (React
  state). No se usa `localStorage`.
