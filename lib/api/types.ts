export type LocaleCode = 'ar' | 'en';

export interface ApiResult<T> {
  succeeded?: boolean;
  message?: string | null;
  statusCode?: number;
  data?: T;
  messages?: string[] | null;
}

export interface PagedResponse<T> {
  data: T[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  succeeded?: boolean;
  messages?: string[] | null;
  extraInfo?: unknown;
}

export interface RoleDto {
  id: number;
  name: string | null;
  arabicName: string | null;
}

export interface AuthResponseDto {
  accessToken: string | null;
  expiresAt: string;
  userId: number;
  username: string | null;
  fullName: string | null;
  userProfileImage: string | null;
  roles: RoleDto[] | null;
}

export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface HorseListItemDto {
  id: number;
  englishName: string | null;
  arabicName: string | null;
  knownAs: string | null;
  dateofBirth: string | null;
  gender: string | null;
  color: string | null;
  horseProfileImage: string | null;
  strainEn: string | null;
  strainAr: string | null;
  specialEn: string | null;
  specialAr: string | null;
  isActive: boolean;
}

export interface StudDto {
  id: number;
  studName: string | null;
  studArabicName: string | null;
  studEmail: string | null;
  primaryPhoneNumber: string | null;
  secondryPhoneNumber: string | null;
  registrationNumber: string | null;
  video: string | null;
  studProfileImage: string | null;
}

export interface HorseInfoDto extends HorseListItemDto {
  studbookId: number | null;
  bornIn: string | null;
  currentlyIn: string | null;
  height: string | null;
  additionalInformation: string | null;
  type: string | null;
  faceSpecialMarkings: string | null;
  frontRightLeg: string | null;
  frontLeftLeg: string | null;
  backRightLeg: string | null;
  backLeftLeg: string | null;
  specialNotes: string | null;
  registrationNumber: string | null;
  microchipID: string | null;
  uelnNumber: string | null;
  internationalFEIRegistrationNumber: string | null;
  nationalSportRegistrationNumber: string | null;
  passportNumber: string | null;
  images: string[] | null;
  videos: string[] | null;
  isStallion: boolean;
  isMare: boolean;
  isStrain: boolean;
  isSpecial: boolean;
  owner: StudDto | null;
  breeder: StudDto | null;
}

export interface StudbookHorseDto {
  id: number;
  englishName: string | null;
  arabicName: string | null;
  knownAs: string | null;
  horseProfileImage: string | null;
  horseFatherId: number | null;
  horseMotherId: number | null;
  horseFatherArabicName: string | null;
  horseMotherArabicName: string | null;
  horseFatherEnglishName: string | null;
  horseMotherEnglishName: string | null;
  dateofBirth: string | null;
  gender: string | null;
  bornIn: string | null;
  currentlyIn: string | null;
  color: string | null;
  isActive: boolean;
  isMare: boolean | null;
  isStallion: boolean | null;
  strain: string | null;
  specialLine: string | null;
  strainAr: string | null;
  specialLineAr: string | null;
  studBreeder: string | null;
  studOwner: string | null;
}

export interface ImportHorseDto {
  studbookId: number;
  strain?: string | null;
  specialLine?: string | null;
  strainAr?: string | null;
  specialLineAr?: string | null;
}

export interface RelatedHorseDto {
  englishName: string | null;
  arabicName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  fatherEnglishName: string | null;
  fatherArabicName: string | null;
  motherEnglishName: string | null;
  motherArabicName: string | null;
}

export interface HorseSiblingsDto {
  all: PagedResponse<RelatedHorseDto> | null;
  dam: PagedResponse<RelatedHorseDto> | null;
  sire: PagedResponse<RelatedHorseDto> | null;
}
