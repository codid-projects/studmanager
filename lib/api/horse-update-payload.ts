import type { CreateHorsePayload } from './types';

type EditableHorseFormData = {
  nameAr: string;
  nameEn: string;
  knownAs?: string;
  gender: string;
  birthDate?: string;
  description?: string;
  image?: File | string;
  imagePreview?: string;
  newImages?: File[];
  removeImageIds?: number[];
  fatherStudbookId?: number;
  motherStudbookId?: number;
  height?: string;
  color?: string;
  currentCountry?: string;
  birthCountry?: string;
  ownerStudbookId?: number;
  breederStudbookId?: number;
  faceMarks?: string;
  frontLeftLeg?: string;
  frontRightLeg?: string;
  backLeftLeg?: string;
  backRightLeg?: string;
  notes?: string;
  registrationNumber?: string;
  microchipId?: string;
  feiRegistrationNumber?: string;
  nationalRegistrationNumber?: string;
  uelnNumber?: string;
  passportNumber?: string;
  videoLink?: string;
};

const stringFields = [
  ['nameEn', 'EnglishName'],
  ['nameAr', 'ArabicName'],
  ['knownAs', 'KnownAs'],
  ['birthDate', 'DateofBirth'],
  ['gender', 'Gender'],
  ['birthCountry', 'BornIn'],
  ['currentCountry', 'CurrentlyIn'],
  ['color', 'Color'],
  ['height', 'Height'],
  ['description', 'AdditionalInformation'],
  ['faceMarks', 'FaceSpecialMarkings'],
  ['frontRightLeg', 'FrontRightLeg'],
  ['frontLeftLeg', 'FrontLeftLeg'],
  ['backRightLeg', 'BackRightLeg'],
  ['backLeftLeg', 'BackLeftLeg'],
  ['notes', 'SpecialNotes'],
  ['registrationNumber', 'RegistrationNumber'],
  ['microchipId', 'MicrochipID'],
  ['uelnNumber', 'UELNNumber'],
  ['feiRegistrationNumber', 'InternationalFEIRegistrationNumber'],
  ['nationalRegistrationNumber', 'NationalSportRegistrationNumber'],
  ['passportNumber', 'PassportNumber'],
] as const;

const numberFields = [
  ['fatherStudbookId', 'HorseFatherStudbookId'],
  ['motherStudbookId', 'HorseMotherStudbookId'],
  ['ownerStudbookId', 'OwnerStudbookId'],
  ['breederStudbookId', 'BreederStudbookId'],
] as const;

function textValue(value: unknown) {
  return value === undefined || value === null ? '' : String(value);
}

function fileValue(value: EditableHorseFormData['image']) {
  return typeof File !== 'undefined' && value instanceof File ? value : null;
}

function hasImageReference(data: Pick<EditableHorseFormData, 'image' | 'imagePreview'>) {
  return Boolean(data.image || data.imagePreview);
}

export function buildChangedHorsePayload(
  data: EditableHorseFormData,
  initialData: Partial<EditableHorseFormData> | null | undefined,
): CreateHorsePayload {
  const payload: CreateHorsePayload = {};

  for (const [formKey, payloadKey] of stringFields) {
    if (textValue(data[formKey]) !== textValue(initialData?.[formKey])) {
      payload[payloadKey] = textValue(data[formKey]);
    }
  }

  for (const [formKey, payloadKey] of numberFields) {
    if (data[formKey] !== initialData?.[formKey]) {
      payload[payloadKey] = data[formKey];
    }
  }

  const image = fileValue(data.image);
  if (image) {
    payload.HorseProfileImage = image;
  } else if (hasImageReference(initialData ?? {}) && !hasImageReference(data)) {
    payload.ClearHorseProfileImage = true;
  }

  const removeImageIds = data.removeImageIds?.filter((id) => id > 0) ?? [];
  if (removeImageIds.length > 0) {
    payload.RemoveImageIds = removeImageIds;
  }

  if (data.newImages?.length) {
    payload.NewImages = data.newImages;
  }

  if (textValue(data.videoLink) !== textValue(initialData?.videoLink) && data.videoLink) {
    payload.NewVideos = [data.videoLink];
  }

  if (textValue(data.gender) !== textValue(initialData?.gender)) {
    payload.IsStallion = data.gender === 'Male';
    payload.IsMare = data.gender === 'Female';
  }

  return payload;
}
