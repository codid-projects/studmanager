export type LocaleCode = 'ar' | 'en';

export interface ApiResult<T> {
  succeeded?: boolean;
  message?: string | null;
  statusCode?: number;
  data?: T;
  messages?: string[] | null;
}

export type OffspringSummaryDto = {
  male: number;
  female: number;
  total: number;
};

export type DashboardDto = {
  horsesInStud: OffspringSummaryDto | null;
  birthedThisYear: OffspringSummaryDto | null;
  bredByStud: OffspringSummaryDto | null;
  sales: number | null;
  expenses: number | null;
  profit: number | null;
};

export type ActivityDto = {
  id: number;
  type: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  entityType: string | null;
  entityId: number;
  metadata: string | null;
  createdAt: string | null;
  createdBy: string | null;
};

export type ActivityTypeEnum = 1 | 2 | 3;

export type CalendarEventType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type CalendarEventDto = {
  id: number;
  title: string;
  titleAr: string;
  description: string | null;
  descriptionAr: string | null;
  start: string;
  end: string | null;
  allDay: boolean;
  type: string;
  color: string | null;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
};

export type CalendarEventPayload = {
  title: string;
  titleAr: string;
  description?: string | null;
  descriptionAr?: string | null;
  eventDate: string;
  endDate?: string | null;
  isAllDay: boolean;
  eventType: CalendarEventType;
  color?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: number | null;
};

export type AttachmentDto = {
  attachmentId?: number | null;
  mediaType: string | null;
  path: string | null;
};

export type CommentDto = {
  userName: string | null;
  userProfilePhoto: string | null;
  body: string | null;
  creationDate: string | null;
  isMine: boolean;
  replies: CommentDto[] | null;
};

export type LikeDto = {
  userName?: string | null;
  userProfilePhoto?: string | null;
  creationDate?: string | null;
};

export type ExternalNewsFeedResponse = {
  userName: string | null;
  userProfilePhoto: string | null;
  attachments: AttachmentDto[] | null;
  body: string | null;
  categories: string[] | null;
  approvalDate: string | null;
  likesCount: number;
  commentsCount: number;
  likes: LikeDto[] | null;
  comments: CommentDto[] | null;
};

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

export interface ContactDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  groupId: number;
  groupEnglishName: string;
  groupArabicName: string;
}

export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  groupId: number;
}

export interface ContactGroupDto {
  id: number;
  englishName: string;
  arabicName: string;
  isDefault: boolean;
}

export interface ContactGroupPayload {
  englishName: string;
  arabicName: string;
}

export interface SupplementDto {
  id: number;
  englishName: string;
  arabicName: string;
  description: string;
  type: string;
}

export interface SupplementPayload {
  englishName: string;
  arabicName: string;
  description: string;
  type: number;
}

export interface LineageNameDto {
  englishName: string;
  arabicName: string;
}

export type NutritionTypeId = 1 | 2 | 3;

export interface NutritionTypeDto {
  id: NutritionTypeId;
  name: string;
}

export interface NutritionRecordDto {
  id: number;
  horseId: number;
  horseEnglishName: string;
  horseArabicName: string;
  supplementId: number;
  supplementName: string;
  supplementArabicName: string;
  supplierId: number;
  supplierName: string;
  phoneNumber: string;
  quantity: number;
  cost: number;
  type: NutritionTypeId;
  typeName: string;
  changeDate: string;
  notifyOnDate: string;
  isNotified: boolean;
  creationDate: string;
  modificationDate: string;
}

export interface CreateNutritionPayload {
  horseId: number;
  supplementId: number;
  supplierId: number;
  supplierName: string;
  phoneNumber: string;
  quantity: number;
  cost: number;
  type: NutritionTypeId;
  changeDate: string;
  notifyOnDate: string;
}

export interface UpdateNutritionPayload {
  id: number;
  supplementId: number;
  supplierId: number;
  supplierName: string;
  phoneNumber: string;
  quantity: number;
  cost: number;
  changeDate: string;
  notifyOnDate: string;
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
  isSold?: boolean;
  soldAt?: string | null;
  soldTo?: string | null;
  soldPrice?: string | null;
}

export interface HorseRatingPayload {
  balance: number;
  quality: number;
  presence: number;
  tailCarriage: number;
  headMuzzle: number;
  neckMitbah: number;
  shoulderChest: number;
  toplineCroup: number;
  forelimbs: number;
  hindlimbsHooves: number;
  trotImpulsion: number;
  walkRhythm: number;
  notes?: string;
}

export interface HorseRatingDto extends HorseRatingPayload {
  id: number;
  arabianTypeScore: number;
  headNeckScore: number;
  bodyToplineScore: number;
  hoovesLimbsScore: number;
  movementScore: number;
  totalScore: number;
  evaluatorName: string;
  ratedAt: string | null;
}

export interface HorseRatingResponse {
  myRating: HorseRatingDto | null;
  averageScore: number | null;
  ratingsCount: number;
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
  lineEn?: string | null;
  lineAr?: string | null;
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
  box: string | null;
  owner: StudDto | null;
  breeder: StudDto | null;
}

export interface HousingHorseDto {
  id: number;
  slotNumber?: number | null;
  englishName: string | null;
  arabicName: string | null;
  horseProfileImage: string | null;
}

export interface HousingUnitDto {
  code: string;
  nameEn: string;
  nameAr: string;
  groupEn: string;
  groupAr: string;
  type: 'box' | 'barn';
  capacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  horses: HousingHorseDto[];
}

export interface HousingMapDto {
  width: number;
  height: number;
  mapKey?: string | null;
  entityType?: string | null;
  entityId?: number | null;
  units: HousingUnitDto[];
}

export interface UpdateHousingUnitCapacityPayload {
  capacity: number;
  mapKey?: string | null;
  entityType?: string | null;
  entityId?: number | null;
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
