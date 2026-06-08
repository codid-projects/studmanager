import { ACTIVITY_OPTIONS } from "@/lib/nutrition-assistant/constants";
import type { HorseActivity } from "@/lib/nutrition-assistant/types";

interface ActivitySelectorProps {
  value: HorseActivity;
  onChange: (value: HorseActivity) => void;
  t: (key: string) => string;
}

export function ActivitySelector({ value, onChange, t }: ActivitySelectorProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-bold text-[#59483b]">{t("activity")}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as HorseActivity)}
        className="rounded-2xl border border-[#eadfd7] bg-[#fdfbf9] px-4 py-3.5 text-[#3b2b20] outline-none focus:border-[#9b7b61]"
      >
        {ACTIVITY_OPTIONS.map((activity) => (
          <option key={activity} value={activity}>{t(`activities.${activity}`)}</option>
        ))}
      </select>
    </label>
  );
}
