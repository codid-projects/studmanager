export type LocaleCode = 'ar' | 'en';

export interface ApiResult<T> {
  succeeded?: boolean;
  message?: string | null;
  statusCode?: number;
  data?: T;
  messages?: string[] | null;
}

export type ApiMessageResult = {
  succeeded: boolean;
  message: string | null;
  statusCode: number;
};

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
  localId?: number | null;
  englishName: string | null;
  arabicName: string | null;
  knownAs: string | null;
  dateofBirth: string | null;
  gender: string | null;
  color: string | null;
  horseProfileImage: string | null;
  images?: Array<string | HorseAttachmentDto> | null;
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

export interface HorseAttachmentDto {
  id: number;
  url: string | null;
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
  images: Array<string | HorseAttachmentDto> | null;
  videos: Array<string | HorseAttachmentDto> | null;
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
  images?: Array<string | HorseAttachmentDto> | null;
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

export type UploadFilePayload = {
  uri: string;
  name?: string;
  type?: string;
};

export type CreateHorsePayload = {
  EnglishName?: string;
  ArabicName?: string;
  KnownAs?: string;
  HorseProfileImage?: UploadFilePayload | File | null;
  ClearHorseProfileImage?: boolean;
  StrainEn?: string;
  StrainAr?: string;
  SpecialEn?: string;
  SpecialAr?: string;
  DateofBirth?: string;
  Gender?: string;
  BornIn?: string;
  CurrentlyIn?: string;
  Color?: string;
  Height?: string;
  AdditionalInformation?: string;
  FaceSpecialMarkings?: string;
  FrontRightLeg?: string;
  FrontLeftLeg?: string;
  BackRightLeg?: string;
  BackLeftLeg?: string;
  SpecialNotes?: string;
  RegistrationNumber?: string;
  MicrochipID?: string;
  UELNNumber?: string;
  InternationalFEIRegistrationNumber?: string;
  NationalSportRegistrationNumber?: string;
  PassportNumber?: string;
  Images?: Array<UploadFilePayload | File>;
  Videos?: string[];
  RemoveImageIds?: number[];
  NewImages?: Array<UploadFilePayload | File>;
  RemoveVideoIds?: number[];
  NewVideos?: string[];
  HorseFatherStudbookId?: number;
  HorseMotherStudbookId?: number;
  OwnerStudbookId?: number;
  BreederStudbookId?: number;
  IsStallion?: boolean;
  IsMare?: boolean;
  IsStrain?: boolean;
  IsSpecial?: boolean;
  Box?: string;
};

export type ExternalCountsDto = {
  total: number;
  female: number;
  male: number;
};

export type ExternalHorseDashboardInformation = {
  siblings: ExternalCountsDto;
  foals: ExternalCountsDto;
};

export type HorsePedigreeNode = {
  id: number;
  englishName: string | null;
  arabicName: string | null;
  horseFatherId: number | null;
  horseFatherEnglishName: string | null;
  horseFatherArabicName: string | null;
  horseMotherId: number | null;
  horseMotherEnglishName: string | null;
  horseMotherArabicName: string | null;
  gender?: string | null;
  dateofBirth?: string | null;
  generationLevel?: number | null;
  isStrain?: boolean | null;
  isSpecial?: boolean | null;
};

export type ExternalHorseSummaryItem = {
  id: number;
  englishName: string | null;
  arabicName: string | null;
  knownAs?: string | null;
  gender: string | null;
  dateofBirth: string | null;
  bornIn?: string | null;
  currentlyIn?: string | null;
  color?: string | null;
  height?: string | null;
  additionalInformation?: string | null;
  horseProfileImage?: string | null;
  images?: Array<string | HorseAttachmentDto> | null;
  videos?: Array<string | HorseAttachmentDto> | null;
  horseFatherId: number | null;
  horseMotherId: number | null;
  horseFatherEnglishName?: string | null;
  horseFatherArabicName?: string | null;
  horseMotherEnglishName?: string | null;
  horseMotherArabicName?: string | null;
  ownerId?: number | null;
  breederId?: number | null;
  isStallion?: boolean | null;
  isMare?: boolean | null;
  isVerified?: boolean | null;
  isActive?: boolean | null;
  studBreeder?: string | StudDto | null;
  studOwner?: string | StudDto | null;
  generationLevel?: number | null;
  isStrain?: boolean | null;
  isSpecial?: boolean | null;
};

export type HorseFamilyTreeItem = {
  id: number;
  englishName: string | null;
  arabicName: string | null;
  horseFatherArabicName: string | null;
  horseMotherArabicName: string | null;
  horseFatherEnglishName: string | null;
  horseMotherEnglishName: string | null;
  percentage: number | null;
  percentageFromMother: number | null;
  percentageFromFather: number | null;
  generationLevels: number[] | null;
  generationLevelsFromMother: number[] | null;
  generationLevelsFromFather: number[] | null;
};

export type ExternalTailNode = {
  id: number;
  englishName: string | null;
  arabicName: string | null;
  gender: string | null;
  dateofBirth: string | null;
  horseFatherId: number | null;
  horseMotherId: number | null;
  horseFatherEnglishName: string | null;
  horseFatherArabicName: string | null;
  horseMotherEnglishName: string | null;
  horseMotherArabicName: string | null;
  generationLevel: number;
};

export type ExternalTreeNode = {
  id: number;
  englishName: string | null;
  arabicName: string | null;
  gender: string | null;
  dateofBirth: string | null;
  microchipID: string | null;
  studBreeder: StudDto | null;
  studOwner: StudDto | null;
  strain: ExternalTreeNode | null;
  specailLine: ExternalTreeNode | null;
  horseFatherId: number | null;
  horseFatherEnglishName: string | null;
  horseFatherArabicName: string | null;
  horseMotherId: number | null;
  horseMotherEnglishName: string | null;
  horseMotherArabicName: string | null;
};

export type HorseEventHistory = {
  studbookEventId: number | null;
  eventId: number;
  eventNameEn: string | null;
  eventNameAr: string | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
  eventType: string | null;
  className: string | null;
  horseNumber: number;
  totalPoint: number;
  totalScorePercentage: number;
  rank: number;
};

export type HorseChampionHistory = {
  eventId: number;
  eventNameEn: string | null;
  eventNameAr: string | null;
  judgingType: string | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
  classId: number;
  className: string | null;
  score: number;
  rank: number;
};

export type HorseAwardHistory = {
  eventId: number;
  eventNameEn: string | null;
  eventNameAr: string | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
  award: string | null;
  judgingType: string | null;
};

export type ExternalHorseSearchItem = StudbookHorseDto;

export type ExternalStudSearchItem = {
  id: number;
  studName: string | null;
  studArabicName: string | null;
  country: string | null;
  studProfileImage: string | null;
};

export type DefaultStudDto = {
  id: number;
  studbookId: number | null;
  studName: string | null;
  studArabicName: string | null;
  studEmail: string | null;
  primaryPhoneNumber: string | null;
  secondryPhoneNumber: string | null;
  registrationNumber: string | null;
  studProfileImage: string | null;
};

export type ImportHorsePayload = {
  studbookId: number;
};

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

export type HorseSibling = RelatedHorseDto;
export type HorseOffspring = RelatedHorseDto;

export interface HorseSiblingsDto {
  all: PagedResponse<RelatedHorseDto> | null;
  dam: PagedResponse<RelatedHorseDto> | null;
  sire: PagedResponse<RelatedHorseDto> | null;
}
