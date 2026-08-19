"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import IconoSalir from "./IconoSalir";

export default function BotonSalir() {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  async function salir() {
    if (saliendo) return;
    setSaliendo(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      router.push("/ingreso");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={salir}
      disabled={saliendo}
      className="flex h-9 items-center gap-1.5 rounded-campo border border-borde-fuerte bg-superficie px-3 text-etiqueta font-medium text-texto-medio transition-colors hover:border-neutro-400 hover:bg-superficie-tenue hover:text-texto disabled:opacity-60"
    >
      <IconoSalir className="h-3.5 w-3.5" />
      Salir
    </button>
  );
}
