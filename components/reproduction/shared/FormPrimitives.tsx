"use client";
import { LoaderCircle } from "lucide-react";

export const fieldClass =
  "h-10 w-full rounded-[7px] border border-[#d7d0ca] bg-white px-3 text-[11px] text-[#3b302a] outline-none focus:border-[#351d10]";

export function FormSection({
  title,
  icon,
  tone = "white",
  children,
  className = "",
}: {
  title: string;
  icon?: React.ReactNode;
  tone?: "white" | "sage";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[8px] border border-[#ded8d2] p-4 ${tone === "sage" ? "bg-[#f5f6ed]" : "bg-white"} ${className}`}
    >
      <h3 className="mb-4 flex items-center gap-2 border-b border-[#ddd7d1] pb-3 text-[13px] font-semibold text-[#2f251f]">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

export function FormField({
  label,
  required,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-[10px] text-[#584c46]">
        {label}
        {required && <b className="text-red-500"> *</b>}
      </span>
      {children}
    </label>
  );
}

export function FormActions({
  locale,
  saving,
  title,
}: {
  locale: "ar" | "en";
  saving: boolean;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
      <button
        disabled={saving}
        className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#351d10] px-6 text-[12px] font-semibold text-white disabled:opacity-60"
      >
        {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
        {saving
          ? locale === "ar"
            ? "جارٍ الحفظ..."
            : "Saving..."
          : locale === "ar"
            ? "حفظ السجل"
            : "Save record"}
      </button>
      <p className="text-[11px] text-[#6e625c]">
        <span className="block text-[9px] text-[#aaa09a]">
          {locale === "ar" ? "الخدمة المختارة" : "Selected service"}
        </span>
        {title}
      </p>
    </div>
  );
}
