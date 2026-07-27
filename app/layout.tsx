import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import EncabezadoInstitucional from "@/components/ui/EncabezadoInstitucional";
import PieInstitucional from "@/components/ui/PieInstitucional";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--fuente-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--fuente-serif",
  subsets: ["latin"],
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
      className={`${plexSans.variable} ${sourceSerif.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <EncabezadoInstitucional />
        <main className="flex-1">{children}</main>
        <PieInstitucional />
      </body>
    </html>
  );
}
