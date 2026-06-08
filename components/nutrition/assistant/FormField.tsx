interface FormFieldProps {
  label: string;
  unit?: string;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ label, unit, error, children }: FormFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-[#59483b]">
        {label} {unit && <span className="font-normal text-[#9a8879]">({unit})</span>}
      </span>
      {children}
      {error && <span className="text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}
