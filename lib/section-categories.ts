// Single source of truth for the sub-categories of each sidebar section that
// uses the "category cards on the landing page → detail page" pattern.
// Used by both the dashboard grids and the in-detail tab rows (CategoryTabs).

export interface SectionCategory {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: string;
}

export const PERFORMANCE_CATEGORIES: SectionCategory[] = [
  { id: "trainings", labelAr: "التدريبات", labelEn: "Trainings", icon: "/performance/التدريبات.svg" },
  { id: "competitions", labelAr: "المسابقات", labelEn: "Competitions", icon: "/performance/المسابقات.svg" },
  { id: "haircut", labelAr: "قص الشعر", labelEn: "Haircut", icon: "/performance/قص الشعر.svg" },
];

export const NUTRITION_CATEGORIES: SectionCategory[] = [
  { id: "feed-changes", labelAr: "تغييرات الأعلاف", labelEn: "Feed Changes", icon: "/nutrition/تغييرات الأعلاف.svg" },
  { id: "monthly-supplements", labelAr: "المكملات الشهرية", labelEn: "Monthly Supplements", icon: "/nutrition/المكملات الشهرية.svg" },
  { id: "tournament-supplements", labelAr: "مكملات المهرجنات", labelEn: "Tournament Supplements", icon: "/nutrition/مكملات المهرجنات.svg" },
  { id: "nutrition-assistant", labelAr: "مساعد التغذية", labelEn: "Nutrition Assistant", icon: "/nutrition/مساعد التغذية.png" },
];

export const EXPENSES_CATEGORIES: SectionCategory[] = [
  { id: "breeding", labelAr: "التربية والتناسل", labelEn: "Breeding", icon: "/sidebar/التناسليات.svg" },
  { id: "clinics", labelAr: "العيادات", labelEn: "Clinics", icon: "/expenses/clinics.svg" },
  { id: "nutrition", labelAr: "التغذية", labelEn: "Nutrition", icon: "/expenses/nutrition.svg" },
];

export const HEALTH_CATEGORIES: SectionCategory[] = [
  { id: "blood-tests", labelAr: "تحاليل الدم", labelEn: "Blood Tests", icon: "/health/تحاليل الدم.svg" },
  { id: "worm-doses", labelAr: "جرعة الديدان", labelEn: "Worming Doses", icon: "/health/جرعة الديدان.svg" },
  { id: "hoof-care", labelAr: "العناية بالحافر و الساق", labelEn: "Hoof & Leg Care", icon: "/health/العناية  بالحافر  و الساق.svg" },
  { id: "injuries", labelAr: "الإصابات", labelEn: "Injuries", icon: "/health/الإصابات.svg" },
  { id: "vet-care", labelAr: "الرعاية البيطرية", labelEn: "Veterinary Care", icon: "/health/الرعاية البيطرية.svg" },
  { id: "weight-height", labelAr: "الوزن و الطول", labelEn: "Weight & Height", icon: "/health/الوزن و الطول.svg" },
  { id: "medications", labelAr: "الأدوية", labelEn: "Medications", icon: "/health/الأدوية.svg" },
  { id: "x-rays", labelAr: "الأشعة", labelEn: "X-Rays", icon: "/health/الأشعة.svg" },
  { id: "vaccinations", labelAr: "التطعيمات", labelEn: "Vaccinations", icon: "/health/التطعيمات.svg" },
];
