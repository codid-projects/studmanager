"use client";

import { useEffect, useState } from "react";
import type { HorseListItemDto, LocaleCode } from "@/lib/api/types";
import {
  getOrCreateMareProfile,
  type BreedingProfile,
} from "@/lib/api/mare-breeding-client";

export function useBreedingHorse({
  locale,
  initialHorseId,
}: {
  locale: LocaleCode;
  gender: "Female" | "Male";
  initialHorseId?: string | null;
  initialHorseName?: string | null;
}) {
  const initialId =
    initialHorseId && Number.isFinite(Number(initialHorseId))
      ? Number(initialHorseId)
      : null;
  const [selectedId, setSelectedId] = useState<number | null>(initialId);
  const [profile, setProfile] = useState<BreedingProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(initialId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    getOrCreateMareProfile(locale, selectedId)
      .then((value) => active && setProfile(value))
      .catch(
        (cause) =>
          active &&
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load breeding profile",
          ),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [locale, selectedId]);

  function select(horse: HorseListItemDto) {
    setSelectedId(horse.localId ?? horse.id);
  }

  return { selectedId, profile, select, loading, error };
}
