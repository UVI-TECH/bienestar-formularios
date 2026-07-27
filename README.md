# bienestar-formularios

Digitalización de los formatos del área de salud de Bienestar Universitario de
la UNIAJC (Cali, Colombia). Next.js 16 · App Router · TypeScript · Tailwind v4 ·
Motion.

```bash
npm run dev     # http://localhost:3000
npm run build
```

## Estructura

```
app/
  layout.tsx              Fuentes, metadatos, encabezado y pie institucionales
  page.tsx                Índice con las tarjetas hacia los cuatro formularios
  globals.css             SISTEMA DE DISEÑO: todos los tokens visuales
components/
  forms/
    FormularioBase.tsx    Envoltura: encabezado, estado de envío, confirmación
    SeccionFormulario.tsx Agrupación de campos (fieldset + legend)
    RejillaCampos.tsx     Rejilla estándar de 2 o 3 columnas
    CampoContenedor.tsx   Etiqueta + control + mensaje (base de todos los campos)
    CampoTexto.tsx
    CampoSelect.tsx       Siempre con opción vacía "Seleccione…"
    CampoFecha.tsx        Por defecto, hoy
    CampoHora.tsx         Por defecto, ahora
    CampoTextarea.tsx
    CampoCedula.tsx       Numérico 6–12 dígitos + botón "Buscar"
    CampoCondicional.tsx  Entrada/salida con expansión de altura
    BotonEnviar.tsx       Estados reposo → enviando → éxito
    index.ts              Barril de exportaciones
  ui/                     Encabezado, pie, código de formato, girador, checks
lib/
  catalogos.ts            SEDES, TIPOS_PERSONA, SEXO, SEMESTRES, PROGRAMAS, ENFERMERAS
  types.ts                Tipos base de los formularios
  formatos.ts             Código, versión, título y ruta de cada formato
  fechas.ts               Fecha/hora en zona America/Bogota
  validacion.ts           Reglas de validación reutilizables
  motion.ts               Tokens de movimiento para JavaScript
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

## Pendientes conocidos

- `PROGRAMAS` y `ENFERMERAS` en `lib/catalogos.ts` están vacíos. Mientras lo
  estén, `CampoSelect` se muestra deshabilitado con el texto
  "Catálogo sin configurar" en lugar de un desplegable vacío.
- En `lib/formatos.ts` sólo está confirmado el código de Asistencia a Enfermería
  (`BH-F-013 · V-1-2018`). Los otros tres son marcadores de posición.
- El azul institucional es un marcador de posición.
- `CampoCedula` recibe `onBuscar` como prop; el endpoint `/api/lookup` todavía
  no existe.
- Sin autenticación y sin persistencia: el estado vive solo en memoria (React
  state). No se usa `localStorage`.
