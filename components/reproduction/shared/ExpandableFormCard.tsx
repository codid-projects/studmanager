"use client";
import { ChevronDown, CirclePlus } from "lucide-react";
export function ExpandableFormCard({
  open,
  title,
  subtitle,
  onToggle,
  children,
}: {
  open: boolean;
  title: string;
  subtitle: string;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#e2d8d0] bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-4 text-start transition hover:bg-[#fcf8f5]"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#351d10] text-white">
          <CirclePlus
            className={`h-5 w-5 transition ${open ? "rotate-45" : ""}`}
          />
        </span>
        <span className="min-w-0 flex-1">
          <b className="block text-sm text-[#35261e]">{title}</b>
          <small className="text-[#918078]">{subtitle}</small>
        </span>
        <ChevronDown
          className={`h-5 w-5 text-[#725e52] transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-[#eee5df] bg-[#fbf8f5] p-2 sm:p-3">
          {children}
        </div>
      )}
    </section>
  );
}
