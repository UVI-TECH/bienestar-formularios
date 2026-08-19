import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Public_Sans } from "next/font/google";
import Script from "next/script";
import EncabezadoInstitucional from "@/components/ui/EncabezadoInstitucional";
import PieInstitucional from "@/components/ui/PieInstitucional";
import { SCRIPT_COLOR_TEMA } from "@/lib/temaColor";
import "./globals.css";

const publicSans = Public_Sans({
  variable: "--fuente-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--fuente-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--fuente-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Formularios · Bienestar Universitario UNIAJC",
    template: "%s · Bienestar Universitario UNIAJC",
  },
  description:
    "Registro digital de los formatos del área de salud de Bienestar Universitario de la UNIAJC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-CO"
      className={`${publicSans.variable} ${manrope.variable} ${plexMono.variable} h-full antialiased`}
      // El script de color de tema (más abajo) escribe `style` en este
      // elemento antes de que React hidrate, para aplicar el matiz guardado
      // sin parpadeo. Eso hace que el HTML del servidor y el del cliente
      // difieran sólo en ese atributo — es intencional, no un error real.
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <Script id="tema-color" strategy="beforeInteractive">
          {SCRIPT_COLOR_TEMA}
        </Script>
        <EncabezadoInstitucional />
        <main className="flex-1">{children}</main>
        <PieInstitucional />
      </body>
    </html>
  );
}
