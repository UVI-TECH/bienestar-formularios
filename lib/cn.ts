/** Une clases descartando `false`, `null` y `undefined`. */
export function cn(...clases: Array<string | false | null | undefined>): string {
  return clases.filter(Boolean).join(" ");
}
