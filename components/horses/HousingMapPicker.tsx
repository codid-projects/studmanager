'use client';

import Link from 'next/link';
import { ExternalLink, Plus, Users, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { HousingMapDto, HousingUnitDto } from '@/lib/api/types';

interface HousingMapPickerProps {
  map: HousingMapDto;
  locale: 'ar' | 'en';
  selectedCode: string;
  currentHorseId?: string;
  capacitySavingCode?: string | null;
  onSelect: (code: string) => void;
  onIncreaseCapacity?: (unit: HousingUnitDto, capacity: number) => void;
}

type PlanArea = {
  id: string;
  labelAr: string;
  labelEn: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
};

type DrawingSlot = {
  code: string;
  kind: 'rect' | 'path';
  x: number;
  y: number;
  width: number;
  height: number;
  d?: string;
  labelX?: number;
  labelY?: number;
  fontSize?: number;
};

type StableSlotSource = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const PLAN_WIDTH = 1000;
const PLAN_HEIGHT = 620;

const planAreas: PlanArea[] = [
  { id: 'arena-7', labelAr: 'منيش ٧', labelEn: 'Arena 7', x: 92, y: 90, width: 74, height: 105 },
  { id: 'arena-6', labelAr: 'منيش ٦', labelEn: 'Arena 6', x: 174, y: 84, width: 82, height: 155 },
  { id: 'arena-5', labelAr: 'منيش ٥', labelEn: 'Arena 5', x: 280, y: 150, width: 82, height: 105 },
  { id: 'arena-4', labelAr: 'منيش ٤', labelEn: 'Arena 4', x: 365, y: 150, width: 82, height: 105 },
  { id: 'arena-6-small', labelAr: 'منيش ٦', labelEn: 'Arena 6', x: 450, y: 139, width: 48, height: 86 },
  { id: 'arena-2', labelAr: 'منيش ٢', labelEn: 'Arena 2', x: 692, y: 70, width: 108, height: 205 },
  { id: 'arena-8', labelAr: 'منيش ٨', labelEn: 'Arena 8', x: 393, y: 366, width: 82, height: 145 },
  { id: 'arena-3', labelAr: 'منيش ٣', labelEn: 'Arena 3', x: 555, y: 348, width: 104, height: 132 },
  { id: 'arena-1', labelAr: 'منيش ١', labelEn: 'Arena 1', x: 807, y: 384, width: 70, height: 128, rotation: 7 },
  { id: 'villa', labelAr: 'الفيلا', labelEn: 'Villa', x: 862, y: 342, width: 72, height: 72 },
  { id: 'office', labelAr: 'المكتب', labelEn: 'Office', x: 918, y: 420, width: 38, height: 26 },
  { id: 'parking', labelAr: 'موقف السيارات', labelEn: 'Parking', x: 800, y: 315, width: 75, height: 42 },
  { id: 'equipment', labelAr: 'مخزن معدات زراعية', labelEn: 'Agricultural equipment', x: 720, y: 285, width: 95, height: 42 },
  { id: 'break', labelAr: 'استراحة', labelEn: 'Break Area', x: 876, y: 92, width: 66, height: 40 },
  { id: 'workshop', labelAr: 'مبنى عمال', labelEn: 'Staff Building', x: 535, y: 197, width: 92, height: 68 },
  { id: 'kitchen', labelAr: 'مطبخ', labelEn: 'Kitchen', x: 628, y: 174, width: 48, height: 91 },
];

const fixedDrawingSlots: DrawingSlot[] = [
  { code: 'B01', kind: 'rect', x: 585, y: 62, width: 98, height: 94, labelX: 634, labelY: 109, fontSize: 13 },
  { code: 'B02', kind: 'path', x: 499, y: 362, width: 65, height: 94, d: 'M499 362H564V456H499Z', labelX: 531, labelY: 409, fontSize: 13 },
  { code: 'B03', kind: 'rect', x: 500, y: 458, width: 64, height: 56, labelX: 532, labelY: 490, fontSize: 13 },
  { code: 'B04', kind: 'rect', x: 568, y: 458, width: 64, height: 56, labelX: 600, labelY: 490, fontSize: 13 },
  { code: 'B05', kind: 'rect', x: 636, y: 458, width: 56, height: 56, labelX: 664, labelY: 490, fontSize: 13 },
  { code: 'B06', kind: 'rect', x: 452, y: 232, width: 72, height: 50, labelX: 488, labelY: 257, fontSize: 13 },
];

const fixedSlotByCode = new Map(fixedDrawingSlots.map((slot) => [slot.code, slot]));

const stableSlotSources: StableSlotSource[] = [
  { x: 24, y: 55, width: 70, height: 172 },
  { x: 101, y: 54, width: 78, height: 50 },
  { x: 249, y: 55, width: 212, height: 42 },
  { x: 250, y: 105, width: 212, height: 45 },
  { x: 492, y: 52, width: 117, height: 45 },
  { x: 493, y: 105, width: 115, height: 48 },
  { x: 26, y: 245, width: 305, height: 42 },
  { x: 352, y: 285, width: 35, height: 252 },
  { x: 377, y: 520, width: 90, height: 38 },
  { x: 480, y: 529, width: 180, height: 38 },
  { x: 700, y: 365, width: 32, height: 125 },
  { x: 718, y: 339, width: 37, height: 185 },
  { x: 755, y: 360, width: 50, height: 117 },
  { x: 707, y: 532, width: 222, height: 37 },
  { x: 900, y: 458, width: 39, height: 84 },
];

const stableDrawingSlots: DrawingSlot[] = stableSlotSources.flatMap((source, sourceIndex) => {
  const vertical = source.height > source.width;
  const count = Math.max(3, Math.floor((vertical ? source.height : source.width) / 18));
  const gap = 3;

  return Array.from({ length: count }).map((_, index) => {
    const rawWidth = vertical ? source.width : source.width / count;
    const rawHeight = vertical ? source.height / count : source.height;
    const width = vertical ? source.width - gap * 2 : rawWidth - gap;
    const height = vertical ? rawHeight - gap : source.height - gap * 2;
    const x = vertical ? source.x + gap : source.x + rawWidth * index + gap / 2;
    const y = vertical ? source.y + rawHeight * index + gap / 2 : source.y + gap;

    return {
      code: `stable-${sourceIndex}-${index}`,
      kind: 'rect',
      x,
      y,
      width,
      height,
      labelX: x + width / 2,
      labelY: y + height / 2,
      fontSize: Math.min(9, Math.max(6, Math.min(width, height) * 0.45)),
    };
  });
});

const normalizeHousingCode = (code: string) => {
  const slotIndex = code.toUpperCase().lastIndexOf('-P');
  return slotIndex > 0 ? code.slice(0, slotIndex) : code;
};

const getSlotCode = (unit: HousingUnitDto, slotNumber: number) =>
  `${normalizeHousingCode(unit.code)}-P${String(slotNumber).padStart(2, '0')}`;

const getDisplayCode = (unit: HousingUnitDto | { code: string }) => {
  const raw = String(unit.code ?? '').trim().toUpperCase();

  const bDirect = raw.match(/^B(\d{1,3})$/);
  if (bDirect) return `B${bDirect[1].padStart(2, '0')}`;

  const barn = raw.match(/^BARN[-_\s]?(\d{1,3})$/);
  if (barn) return `B${barn[1].padStart(2, '0')}`;

  const box = raw.match(/BOX[-_\s]?(\d{1,3})$/);
  if (box) return box[1];

  const lastNumber = raw.match(/(\d{1,3})$/);
  if (raw.startsWith('B') && lastNumber) return `B${lastNumber[1].padStart(2, '0')}`;
  if (lastNumber) return lastNumber[1];

  return raw;
};

const isRealSelectableUnit = (unit: HousingUnitDto) => {
  const type = String(unit.type ?? '').toLowerCase();
  const code = getDisplayCode(unit);

  return (
    type === 'barn' ||
    type === 'box' ||
    type === 'stable' ||
    fixedSlotByCode.has(code) ||
    Number.isFinite(unit.x) ||
    Number.isFinite(unit.y)
  );
};

export function HousingMapPicker({
  map,
  locale,
  selectedCode,
  currentHorseId,
  capacitySavingCode,
  onSelect,
  onIncreaseCapacity,
}: HousingMapPickerProps) {
  const [hoveredUnit, setHoveredUnit] = useState<HousingUnitDto | null>(null);
  const [hoveredArea, setHoveredArea] = useState<PlanArea | null>(null);
  const [activeUnitCode, setActiveUnitCode] = useState<string | null>(null);

  const scaleX = map.width ? PLAN_WIDTH / map.width : 1;
  const scaleY = map.height ? PLAN_HEIGHT / map.height : 1;

  const units = useMemo(() => map.units.filter(isRealSelectableUnit), [map.units]);

  const stableSlotByUnitCode = useMemo(() => {
    const boxUnits = units
      .filter((unit) => unit.type === 'box' && !fixedSlotByCode.has(getDisplayCode(unit)))
      .sort((first, second) => {
        const firstNumber = Number(getDisplayCode(first));
        const secondNumber = Number(getDisplayCode(second));

        if (Number.isFinite(firstNumber) && Number.isFinite(secondNumber)) {
          return firstNumber - secondNumber;
        }

        return getDisplayCode(first).localeCompare(getDisplayCode(second), undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      });

    return new Map(boxUnits.map((unit, index) => [unit.code, stableDrawingSlots[index]]));
  }, [units]);

  const selectedDisplayCode = selectedCode ? getDisplayCode({ code: selectedCode }) : '';
  const activeUnit = units.find((unit) => unit.code === activeUnitCode) ?? null;

  const canSelect = (unit: HousingUnitDto) =>
    unit.horses.length < unit.capacity ||
    unit.horses.some((horse) => String(horse.id) === currentHorseId);

  const statusFor = (unit: HousingUnitDto) => {
    if (
      unit.code === selectedCode ||
      normalizeHousingCode(selectedCode) === unit.code ||
      getDisplayCode(unit) === selectedDisplayCode
    ) return 'selected';
    if (unit.horses.length >= unit.capacity) return 'full';
    if (unit.horses.length > 0) return 'occupied';
    return 'available';
  };

  const slotFor = (unit: HousingUnitDto): DrawingSlot => {
    const displayCode = getDisplayCode(unit);
    const fixedSlot = fixedSlotByCode.get(displayCode);

    if (fixedSlot) return fixedSlot;

    const stableSlot = stableSlotByUnitCode.get(unit.code);

    if (stableSlot) {
      return {
        ...stableSlot,
        code: displayCode,
      };
    }

    const x = unit.x * scaleX;
    const y = unit.y * scaleY;
    const width = Math.max(unit.width * scaleX, 8);
    const height = Math.max(unit.height * scaleY, 8);

    return {
      code: displayCode,
      kind: 'rect',
      x,
      y,
      width,
      height,
      labelX: x + width / 2,
      labelY: y + height / 2,
      fontSize: width < 18 || height < 18 ? 7 : 9,
    };
  };

  const fillFor = (unit: HousingUnitDto, isHovered: boolean) => {
    const status = statusFor(unit);

    if (isHovered) return 'rgba(96,132,90,0.32)';
    if (status === 'selected') return 'rgba(75,47,26,0.26)';
    if (status === 'full') return 'rgba(184,69,60,0.24)';
    if (status === 'occupied') return 'rgba(217,137,71,0.24)';

    return unit.type === 'barn' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)';
  };

  const strokeFor = (unit: HousingUnitDto, isHovered: boolean) => {
    const status = statusFor(unit);

    if (isHovered) return '#5d493b';
    if (status === 'selected') return '#4b2f1a';
    if (status === 'full') return '#b8453c';
    if (status === 'occupied') return '#d98947';

    return 'rgba(23,19,15,0.001)';
  };

  const strokeWidthFor = (unit: HousingUnitDto, isHovered: boolean) => {
    if (isHovered) return 2.2;
    if (statusFor(unit) === 'selected') return 2;

    return 1.2;
  };

  const clearHover = () => {
    setHoveredUnit(null);
    setHoveredArea(null);
  };

  const clearTransientHover = () => {
    setHoveredUnit(null);
    setHoveredArea(null);
  };

  const hint = hoveredUnit ? (
    <UnitHint unit={hoveredUnit} locale={locale} />
  ) : hoveredArea ? (
    <AreaHint area={hoveredArea} locale={locale} />
  ) : null;

  return (
    <div className="overflow-hidden rounded-[22px] border border-[#dfd2c8] bg-white shadow-[0_12px_34px_rgba(75,47,26,0.06)]">
      <div className="flex flex-col gap-3 border-b border-[#ece2da] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold text-[#34251d]">
            {locale === 'ar' ? 'المخطط التفاعلي للمزرعة' : 'Interactive farm plan'}
          </h3>
          <p className="mt-0.5 text-xs text-[#8b796e]">
            {locale === 'ar'
              ? 'مرر فوق أي بوكس أو عنبر لإظهار رقمه وتفاصيله، ثم اختره.'
              : 'Hover any box or barn to show its number and details, then select it.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px]">
          <Legend color="#dcebd9" label={locale === 'ar' ? 'متاح' : 'Available'} />
          <Legend color="#d98947" label={locale === 'ar' ? 'مشغول' : 'Occupied'} />
          <Legend color="#b8453c" label={locale === 'ar' ? 'ممتلئ' : 'Full'} />
          <Legend color="#4b2f1a" label={locale === 'ar' ? 'محدد' : 'Selected'} />
        </div>
      </div>

      <div className="h-[132px] overflow-hidden border-b border-[#ece2da] bg-[#3d2a1b] px-4 py-3 text-white">
        <div className="h-full overflow-y-auto pr-1">
          {hint ?? (
            <div className="flex h-full items-center text-sm font-semibold text-white/75">
              {locale === 'ar'
                ? 'مرر فوق أي منطقة في المخطط لعرض التفاصيل هنا.'
                : 'Hover a map area to show details here.'}
            </div>
          )}
        </div>
      </div>

      <div className="relative bg-[#eeeae3]" onMouseLeave={clearHover}>
        <div className="overflow-auto">
          <svg
            viewBox={`0 0 ${PLAN_WIDTH} ${PLAN_HEIGHT}`}
            className="block min-h-[560px] min-w-[1000px] w-full bg-[#fbfaf7]"
            role="img"
            aria-label={locale === 'ar' ? 'خريطة إيواء الخيل' : 'Horse housing map'}
          >
            <ArchitecturalPlan />

            <rect
              x="0"
              y="0"
              width={PLAN_WIDTH}
              height={PLAN_HEIGHT}
              fill="rgba(255,255,255,0.001)"
              onMouseEnter={clearTransientHover}
            />

            {planAreas.map((area) => (
              <NonSelectableAreaOverlay
                key={area.id}
                area={area}
                onEnter={() => {
                  setHoveredUnit(null);
                  setHoveredArea(area);
                }}
              />
            ))}

            {units.map((unit) => {
              const slot = slotFor(unit);
              const enabled = canSelect(unit);
              const isHovered = hoveredUnit?.code === unit.code;
              const status = statusFor(unit);
              const displayCode = getDisplayCode(unit);
              const labelX = slot.labelX ?? slot.x + slot.width / 2;
              const labelY = slot.labelY ?? slot.y + slot.height / 2;
              const showCode = isHovered;
              const isSelected = status === 'selected';
              const isBarn = unit.type === 'barn';

              const rotation = unit.rotation
                ? `rotate(${unit.rotation} ${slot.x + slot.width / 2} ${slot.y + slot.height / 2})`
                : undefined;

              return (
                <g
                  key={unit.code}
                  transform={rotation}
                  onMouseEnter={() => {
                    setHoveredArea(null);
                    setHoveredUnit(unit);
                  }}
                  onFocus={() => {
                    setHoveredArea(null);
                    setHoveredUnit(unit);
                  }}
                  onClick={() => {
                    setHoveredArea(null);
                    setHoveredUnit(unit);
                    setActiveUnitCode(unit.code);

                    if (enabled && !isBarn) onSelect(unit.code);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-disabled={!enabled}
                  aria-label={`${locale === 'ar' ? unit.nameAr : unit.nameEn}, ${unit.horses.length}/${unit.capacity}`}
                  onKeyDown={(event) => {
                    if (enabled && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault();
                      setActiveUnitCode(unit.code);
                      if (!isBarn) onSelect(unit.code);
                    }
                  }}
                  className={enabled ? 'cursor-pointer outline-none' : 'cursor-not-allowed outline-none'}
                >
                  {slot.kind === 'path' && slot.d ? (
                    <path
                      d={slot.d}
                      fill={fillFor(unit, isHovered)}
                      stroke={strokeFor(unit, isHovered)}
                      strokeWidth={strokeWidthFor(unit, isHovered)}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  ) : (
                    <rect
                      x={slot.x}
                      y={slot.y}
                      width={slot.width}
                      height={slot.height}
                      rx="0"
                      fill={fillFor(unit, isHovered)}
                      stroke={strokeFor(unit, isHovered)}
                      strokeWidth={strokeWidthFor(unit, isHovered)}
                      vectorEffect="non-scaling-stroke"
                    />
                  )}

                  {!isHovered && (isSelected || unit.horses.length > 0) && (
                    <text
                      x={labelX}
                      y={labelY + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={status === 'selected' ? '#3d2a1b' : status === 'full' ? '#8d302b' : '#8a4f2e'}
                      fontSize={isBarn ? 10 : 7}
                      fontWeight="800"
                      pointerEvents="none"
                    >
                      {isBarn ? `${unit.horses.length}/${unit.capacity}` : getDisplayCode(unit)}
                    </text>
                  )}

                  {showCode && (
                    <>
                      <rect
                        x={labelX - Math.max(13, displayCode.length * 4.8)}
                        y={labelY - 10}
                        width={Math.max(26, displayCode.length * 9.6)}
                        height="20"
                        rx="5"
                        fill="#4b2f1a"
                        stroke="#f4d79f"
                        strokeWidth="0.8"
                        vectorEffect="non-scaling-stroke"
                        pointerEvents="none"
                      />
                      <text
                        x={labelX}
                        y={labelY + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#fff"
                        fontSize={slot.fontSize ?? 9}
                        fontWeight="800"
                        pointerEvents="none"
                      >
                        {displayCode}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {activeUnit && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#1d130d]/12 p-4">
            <div className="pointer-events-auto w-[min(34rem,calc(100%-1rem))] rounded-3xl border border-[#e0d2c7] bg-white p-5 shadow-[0_24px_70px_rgba(35,23,15,0.28)]">
              <UnitDetails
                unit={activeUnit}
                locale={locale}
                expanded={activeUnit.type === 'barn'}
                capacitySaving={capacitySavingCode === activeUnit.code}
                selectedCode={selectedCode}
                currentHorseId={currentHorseId}
                onClose={() => setActiveUnitCode(null)}
                onSelect={() => onSelect(activeUnit.code)}
                onSelectSlot={(slotNumber) => onSelect(getSlotCode(activeUnit, slotNumber))}
                onIncreaseCapacity={
                  onIncreaseCapacity
                    ? () => onIncreaseCapacity(activeUnit, activeUnit.capacity + 1)
                    : undefined
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ArchitecturalPlan() {
  return (
    <g fill="none" stroke="#17130f" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none">
      <defs>
        <pattern id="siteHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="7" stroke="#9b9188" strokeWidth="1" />
        </pattern>

        <pattern id="boxHatch" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M0 5L5 0" stroke="#d4cbc2" strokeWidth="0.7" />
        </pattern>
      </defs>

      <path d="M18 36L960 36L982 296L948 574L365 584L330 568L24 566L18 36Z" fill="#fff" strokeWidth="2.2" />

      <path d="M30 280H333C354 280 365 296 365 315V558" stroke="#bdb3a9" strokeWidth="15" />
      <path d="M360 55V272C360 292 378 305 398 305H485" stroke="#bdb3a9" strokeWidth="15" />
      <path d="M491 44V260C491 283 508 299 531 299H690" stroke="#bdb3a9" strokeWidth="15" />
      <path d="M704 275V556" stroke="#bdb3a9" strokeWidth="15" />
      <path d="M705 330H842C865 330 878 314 878 291V264" stroke="#bdb3a9" strokeWidth="15" />
      <path d="M714 529H943" stroke="#bdb3a9" strokeWidth="15" />

      <path d="M807 45H967L973 270H890C866 270 850 252 850 228V145C850 123 835 108 814 108H807Z" fill="url(#siteHatch)" strokeWidth="2" />
      <path d="M846 92C883 102 904 118 904 151C904 182 878 197 878 226C878 247 894 259 917 259" stroke="#fff" strokeWidth="28" />
      <path d="M846 92C883 102 904 118 904 151C904 182 878 197 878 226C878 247 894 259 917 259" stroke="#17130f" strokeWidth="2" />

      <StableShell x={24} y={55} width={70} height={172} />
      <StableShell x={101} y={54} width={78} height={50} />
      <StableShell x={249} y={55} width={212} height={42} />
      <StableShell x={250} y={105} width={212} height={45} />
      <StableShell x={492} y={52} width={117} height={45} />
      <StableShell x={493} y={105} width={115} height={48} />
      <StableShell x={26} y={245} width={305} height={42} />
      <StableShell x={352} y={285} width={35} height={252} />
      <StableShell x={377} y={520} width={90} height={38} />
      <StableShell x={480} y={529} width={180} height={38} />
      <StableShell x={665} y={365} width={64} height={125} />
      <StableShell x={718} y={339} width={37} height={185} />
      <StableShell x={755} y={360} width={50} height={117} />
      <StableShell x={707} y={532} width={222} height={37} />
      <StableShell x={900} y={458} width={39} height={84} />

      <rect x="92" y="90" width="74" height="105" fill="#fff" strokeWidth="1.8" />
      <rect x="174" y="84" width="82" height="155" fill="#fff" strokeWidth="1.8" />
      <rect x="280" y="150" width="82" height="105" fill="#fff" strokeWidth="1.8" />
      <rect x="365" y="150" width="82" height="105" fill="#fff" strokeWidth="1.8" />
      <rect x="450" y="139" width="48" height="86" fill="#fff" strokeWidth="1.8" />
      <path d="M692 70H800V275H692Z" fill="#fff" strokeWidth="1.8" />
      <rect x="393" y="366" width="82" height="145" fill="#fff" strokeWidth="1.8" />
      <path d="M555 348H659V480H555Z" fill="#fff" strokeWidth="1.8" />
      <path d="M807 384L877 393L865 521L795 512Z" fill="#fff" strokeWidth="1.8" />

      <rect x="585" y="62" width="98" height="94" fill="#fff" strokeWidth="1.8" />
      <path d="M499 362H564V456H499Z" fill="#fff" strokeWidth="1.8" />
      <rect x="500" y="458" width="64" height="56" fill="#fff" strokeWidth="1.8" />
      <rect x="568" y="458" width="64" height="56" fill="#fff" strokeWidth="1.8" />
      <rect x="636" y="458" width="56" height="56" fill="#fff" strokeWidth="1.8" />

      <rect x="535" y="197" width="92" height="68" fill="#fff" strokeWidth="1.5" />
      <rect x="628" y="174" width="48" height="91" fill="#fff" strokeWidth="1.5" />
      <rect x="676" y="184" width="42" height="81" fill="#fff" strokeWidth="1.5" />
      <rect x="720" y="285" width="95" height="42" fill="#fff" strokeWidth="1.5" />
      <rect x="862" y="342" width="72" height="72" fill="#fff" stroke="#e34e4e" strokeWidth="1.8" />
      <rect x="918" y="420" width="38" height="26" fill="#fff" strokeWidth="1.5" />
      <rect x="876" y="92" width="66" height="40" fill="#fff" strokeWidth="1.5" />
      <path d="M800 315H875V357H800Z" fill="#fff" strokeWidth="1.5" />

      <RoundFeature cx={481} cy={290} radius={40} spokes={6} />
      <RoundFeature cx={842} cy={475} radius={20} spokes={8} />
      <RoundFeature cx={848} cy={77} radius={21} spokes={6} />

      <path d="M625 205Q649 170 681 174" strokeWidth="1.5" />

      <g fill="#17130f" stroke="none" fontFamily="Arial, sans-serif" textAnchor="middle">
        <PlanText x={129} y={145} text="منيش (٧)" />
        <PlanText x={215} y={155} text="منيش (٦)" />
        <PlanText x={321} y={205} text="منيش (٥)" />
        <PlanText x={406} y={205} text="منيش (٤)" />
        <PlanText x={474} y={182} text="منيش (٦)" />
        <PlanText x={746} y={170} text="منيش (٢)" />
        <PlanText x={429} y={435} text="منيش (٨)" />
        <PlanText x={607} y={405} text="منيش (٣)" />
        <PlanText x={835} y={453} text="منيش (١)" />
        <PlanText x={634} y={105} text="عنبر (١)" />
        <PlanText x={531} y={407} text="عنبر الجمال (٢)" />
        <PlanText x={532} y={490} text="عنبر (٣)" />
        <PlanText x={600} y={490} text="عنبر (٤)" />
        <PlanText x={664} y={490} text="عنبر (٥)" />
        <PlanText x={898} y={381} text="الفيلا" />
        <PlanText x={937} y={436} text="المكتب" />
        <PlanText x={838} y={338} text="موقف" />
        <PlanText x={767} y={307} text="مخزن معدات" />
        <PlanText x={909} y={117} text="استراحة" />
      </g>
    </g>
  );
}

function StableShell({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  const vertical = height > width;
  const count = Math.max(3, Math.floor((vertical ? height : width) / 18));

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill="url(#boxHatch)" strokeWidth="1.6" />

      {Array.from({ length: count - 1 }).map((_, index) => {
        const ratio = (index + 1) / count;

        return vertical ? (
          <line key={index} x1={x} y1={y + height * ratio} x2={x + width} y2={y + height * ratio} strokeWidth="0.9" />
        ) : (
          <line key={index} x1={x + width * ratio} y1={y} x2={x + width * ratio} y2={y + height} strokeWidth="0.9" />
        );
      })}

      <text
        x={x + width / 2}
        y={y + height / 2}
        fill="#27201a"
        stroke="none"
        fontSize="7"
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        Stable
      </text>
    </g>
  );
}

function RoundFeature({
  cx,
  cy,
  radius,
  spokes,
}: {
  cx: number;
  cy: number;
  radius: number;
  spokes: number;
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={radius} fill="#fff" strokeWidth="1.8" />
      <circle cx={cx} cy={cy} r={radius * 0.34} fill="#fff" strokeWidth="1.3" />

      {Array.from({ length: spokes }).map((_, index) => {
        const angle = (Math.PI * 2 * index) / spokes;

        return (
          <line
            key={index}
            x1={cx + Math.cos(angle) * radius * 0.34}
            y1={cy + Math.sin(angle) * radius * 0.34}
            x2={cx + Math.cos(angle) * radius}
            y2={cy + Math.sin(angle) * radius}
            strokeWidth="1.5"
          />
        );
      })}
    </g>
  );
}

function PlanText({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y} fontSize="11" fontWeight="600">
      {text}
    </text>
  );
}

function NonSelectableAreaOverlay({
  area,
  onEnter,
}: {
  area: PlanArea;
  onEnter: () => void;
}) {
  const transform = area.rotation
    ? `rotate(${area.rotation} ${area.x + area.width / 2} ${area.y + area.height / 2})`
    : undefined;

  return (
    <g transform={transform} onMouseEnter={onEnter} className="cursor-default">
      <rect
        x={area.x}
        y={area.y}
        width={area.width}
        height={area.height}
        rx="0"
        fill="rgba(255,255,255,0.001)"
        stroke="transparent"
      />
    </g>
  );
}

function UnitDetails({
  unit,
  locale,
  expanded,
  capacitySaving,
  selectedCode,
  currentHorseId,
  onClose,
  onSelect,
  onSelectSlot,
  onIncreaseCapacity,
}: {
  unit: HousingUnitDto;
  locale: 'ar' | 'en';
  expanded: boolean;
  capacitySaving: boolean;
  selectedCode: string;
  currentHorseId?: string;
  onClose: () => void;
  onSelect: () => void;
  onSelectSlot: (slotNumber: number) => void;
  onIncreaseCapacity?: () => void;
}) {
  const horseBySlot = new Map(
    unit.horses.map((horse, index) => [horse.slotNumber ?? index + 1, horse]),
  );
  const selectedSlotNumber = selectedCode.startsWith(`${unit.code}-P`)
    ? Number(selectedCode.slice(`${unit.code}-P`.length))
    : null;
  const places = Array.from({ length: unit.capacity }).map((_, index) => horseBySlot.get(index + 1) ?? null);

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-bold text-[#2f2118]">{locale === 'ar' ? unit.nameAr : unit.nameEn}</div>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-[#7c6b60]">
            <Users className="h-3.5 w-3.5" />
            {unit.horses.length}/{unit.capacity}
          </div>
        </div>

        <span className="rounded-full bg-[#f4eee8] px-2 py-1 text-[10px] font-bold text-[#6b4b36]">
          {unit.code}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f6f1ec] text-[#4b382d] hover:bg-[#ede4dc]"
          aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {unit.type !== 'barn' && (
        <button
          type="button"
          onClick={onSelect}
          className="mt-3 w-full rounded-xl bg-[#4b2f1a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#3b2414]"
        >
          {locale === 'ar' ? 'اختيار هذا البوكس' : 'Select this box'}
        </button>
      )}

      {unit.horses.length > 0 ? (
        <div className="mt-3 max-h-32 space-y-2 overflow-auto">
          {unit.horses.map((horse) => (
            <Link
              key={horse.id}
              href={`/${locale}/horses/${horse.id}`}
              className="flex items-center justify-between gap-2 rounded-xl bg-[#faf7f3] px-3 py-2 text-sm text-[#3d2a1b] hover:bg-[#f4e9de]"
            >
              <span className="truncate">
                {(locale === 'ar' ? horse.arabicName : horse.englishName) || horse.englishName || horse.arabicName}
              </span>

              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-xl bg-[#eff6ed] px-3 py-2 text-xs font-semibold text-[#4e7653]">
          {locale === 'ar' ? 'هذا المكان متاح للتعيين.' : 'This unit is available for assignment.'}
        </div>
      )}

      {unit.type === 'barn' && expanded && (
        <div className="mt-3 border-t border-[#eee4dc] pt-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#5b4638]">
              {locale === 'ar' ? 'الأماكن داخل العنبر' : 'Barn places'}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-[#dfd2c7] px-2 py-1 text-[11px] font-bold text-[#6b4b36] disabled:opacity-50"
                onClick={onIncreaseCapacity}
                disabled={!onIncreaseCapacity || capacitySaving}
              >
                <Plus className="h-3 w-3" />
                {capacitySaving
                  ? locale === 'ar'
                    ? 'حفظ...'
                    : 'Saving...'
                  : locale === 'ar'
                    ? 'إضافة مكان'
                    : 'Add place'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {places.map((horse, index) => (
              <button
                key={index}
                type="button"
                disabled={horse ? String(horse.id) !== currentHorseId : false}
                onClick={() => onSelectSlot(index + 1)}
                className={`min-w-0 rounded-lg border px-2 py-1.5 text-[11px] ${
                  selectedSlotNumber === index + 1
                    ? 'border-[#4b2f1a] bg-[#4b2f1a] text-white'
                    : horse
                    ? String(horse.id) === currentHorseId
                      ? 'border-[#d8e8d8] bg-[#eef8ee] text-[#4e7653]'
                      : 'cursor-not-allowed border-[#e8c9ad] bg-[#fff7ef] text-[#7a4327]'
                    : 'border-[#d8e8d8] bg-[#f3faf1] text-[#4e7653]'
                } text-start transition hover:border-[#4b2f1a]`}
              >
                <div className="font-bold">
                  {locale === 'ar' ? `مكان ${index + 1}` : `Place ${index + 1}`}
                </div>
                <div className="truncate">
                  {horse
                    ? (locale === 'ar' ? horse.arabicName : horse.englishName) || horse.englishName || horse.arabicName
                    : locale === 'ar'
                      ? 'متاح'
                      : 'Available'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function UnitHint({ unit, locale }: { unit: HousingUnitDto; locale: 'ar' | 'en' }) {
  const available = Math.max(0, unit.capacity - unit.horses.length);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-bold">{locale === 'ar' ? unit.nameAr : unit.nameEn}</div>
          <div className="mt-1 text-xs text-white/75">
            {unit.type === 'barn'
              ? locale === 'ar'
                ? 'اضغط لعرض أماكن العنبر'
                : 'Click to view barn places'
              : locale === 'ar'
                ? 'اضغط لاختيار البوكس'
                : 'Click to select this box'}
          </div>
        </div>
        <span className="rounded-full bg-white/12 px-2 py-1 text-[11px] font-bold text-white">
          {unit.code}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-white/10 px-3 py-2">
          <div className="text-white/65">{locale === 'ar' ? 'مشغول' : 'Used'}</div>
          <div className="mt-0.5 text-lg font-bold">{unit.horses.length}</div>
        </div>
        <div className="rounded-xl bg-[#5f8a5d] px-3 py-2">
          <div className="text-white/75">{locale === 'ar' ? 'متاح' : 'Available'}</div>
          <div className="mt-0.5 text-lg font-bold">{available}</div>
        </div>
      </div>
    </div>
  );
}

function AreaHint({ area, locale }: { area: PlanArea; locale: 'ar' | 'en' }) {
  return (
    <div>
      <div className="text-base font-bold">
        {locale === 'ar' ? area.labelAr : area.labelEn}
      </div>
      <div className="mt-1 text-xs text-white/75">
        {locale === 'ar' ? 'منطقة داخل المخطط' : 'Plan area'}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-[#f7f3ef] px-2.5 py-1.5 text-[#5f4b3d]">
      <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}