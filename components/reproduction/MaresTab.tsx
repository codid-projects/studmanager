"use client";

import MareBreedingWorkspace from "@/components/reproduction/mares/MareBreedingWorkspace";

export default function MaresTab({
  initialHorseId,
  initialHorseName,
}: {
  initialHorseId?: string | null;
  initialHorseName?: string | null;
}) {
  return (
    <MareBreedingWorkspace
      initialHorseId={initialHorseId}
      initialHorseName={initialHorseName}
    />
  );
}
