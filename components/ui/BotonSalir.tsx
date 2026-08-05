"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      className="rounded-chip text-meta uppercase text-inst-200 underline-offset-2 transition-colors hover:text-white hover:underline disabled:opacity-60"
    >
      Salir
    </button>
  );
}
