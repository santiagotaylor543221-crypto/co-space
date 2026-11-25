"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

let openDialogs = 0;
let previousOverflow = "";

export default function AdminDialog({ title, children, onClose, locked = false, wide = false }: {
  title: string; children: ReactNode; onClose: () => void; locked?: boolean; wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const { t } = useI18n();
  useEffect(() => {
    const dialog = ref.current;
    if (openDialogs === 0) previousOverflow = document.body.style.overflow;
    openDialogs += 1;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      openDialogs -= 1;
      if (openDialogs === 0) document.body.style.overflow = previousOverflow;
    };
  }, []);
  return <dialog ref={ref} aria-labelledby={id} onCancel={(event) => { event.preventDefault(); event.stopPropagation(); if (!locked) onClose(); }}
    className={`fixed inset-0 m-auto max-h-[92dvh] w-[calc(100%_-_2rem)] overflow-y-auto rounded-3xl border border-line bg-surface p-5 text-ink shadow-xl backdrop:bg-ink/40 backdrop:backdrop-blur-xs sm:p-7 ${wide ? "max-w-5xl" : "max-w-md"}`}>
    <div className="mb-6 flex items-start justify-between gap-4 border-b border-line pb-4">
      <h2 id={id} className="font-heading text-2xl font-semibold">{title}</h2>
      <button type="button" onClick={onClose} disabled={locked} aria-label={t("Cerrar")} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl hover:bg-background disabled:opacity-40"><X size={20} /></button>
    </div>
    {children}
  </dialog>;
}
