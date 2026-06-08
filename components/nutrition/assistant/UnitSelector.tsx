import type { UnitSystem } from "@/lib/nutrition-assistant/types";

interface UnitSelectorProps {
  value: UnitSystem;
  onChange: (value: UnitSystem) => void;
  t: (key: string) => string;
}

export function UnitSelector({ value, onChange, t }: UnitSelectorProps) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-bold text-[#59483b]">{t("unitSystem")}</legend>
      <div className="grid grid-cols-2 gap-3">
        {(["metric", "imperial"] as UnitSystem[]).map((unit) => (
          <label
            key={unit}
            className={`cursor-pointer rounded-2xl border px-4 py-3 text-center font-semibold transition ${
              value === unit
                ? "border-[#8f7158] bg-[#f4ece5] text-[#3b2b20]"
                : "border-[#eadfd7] bg-white text-[#7c6b5d]"
            }`}
          >
            <input className="sr-only" type="radio" checked={value === unit} onChange={() => onChange(unit)} />
            {t(`units.${unit}`)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
