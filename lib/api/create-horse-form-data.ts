import type { CreateHorsePayload, UploadFilePayload } from './types';

export const appendValue = (
  formData: FormData,
  key: string,
  value: unknown,
  options: { includeEmptyStrings?: boolean } = {},
) => {
  if (
    value === undefined ||
    value === null ||
    (value === '' && !options.includeEmptyStrings)
  ) {
    return;
  }

  if (typeof value === 'boolean') {
    formData.append(key, value ? 'true' : 'false');
    return;
  }

  formData.append(key, String(value));
};

export const appendFile = (
  formData: FormData,
  key: string,
  file?: UploadFilePayload | File | null,
) => {
  if (!file) return;

  if (file instanceof File) {
    formData.append(key, file);
    return;
  }

  if (!file.uri) return;

  formData.append(
    key,
    {
      uri: file.uri,
      name: file.name || `${key}.jpg`,
      type: file.type || 'image/jpeg',
    } as unknown as Blob,
  );
};

function formatDateOnly(value?: string) {
  if (!value) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toISOString().slice(0, 10);
}

export const buildCreateHorseFormData = (
  payload: CreateHorsePayload,
  options: { includeEmptyStrings?: boolean } = {},
) => {
  const formData = new FormData();

  appendValue(formData, 'EnglishName', payload.EnglishName, options);
  appendValue(formData, 'ArabicName', payload.ArabicName, options);
  appendValue(formData, 'KnownAs', payload.KnownAs, options);
  appendFile(formData, 'HorseProfileImage', payload.HorseProfileImage);
  appendValue(formData, 'ClearHorseProfileImage', payload.ClearHorseProfileImage, options);

  appendValue(formData, 'StrainEn', payload.StrainEn, options);
  appendValue(formData, 'StrainAr', payload.StrainAr, options);
  appendValue(formData, 'SpecialEn', payload.SpecialEn, options);
  appendValue(formData, 'SpecialAr', payload.SpecialAr, options);

  appendValue(formData, 'DateofBirth', formatDateOnly(payload.DateofBirth), options);
  appendValue(formData, 'Gender', payload.Gender, options);
  appendValue(formData, 'BornIn', payload.BornIn, options);
  appendValue(formData, 'CurrentlyIn', payload.CurrentlyIn, options);
  appendValue(formData, 'Color', payload.Color, options);
  appendValue(formData, 'Height', payload.Height, options);

  appendValue(formData, 'AdditionalInformation', payload.AdditionalInformation, options);
  appendValue(formData, 'FaceSpecialMarkings', payload.FaceSpecialMarkings, options);
  appendValue(formData, 'FrontRightLeg', payload.FrontRightLeg, options);
  appendValue(formData, 'FrontLeftLeg', payload.FrontLeftLeg, options);
  appendValue(formData, 'BackRightLeg', payload.BackRightLeg, options);
  appendValue(formData, 'BackLeftLeg', payload.BackLeftLeg, options);
  appendValue(formData, 'SpecialNotes', payload.SpecialNotes, options);

  appendValue(formData, 'RegistrationNumber', payload.RegistrationNumber, options);
  appendValue(formData, 'MicrochipID', payload.MicrochipID, options);
  appendValue(formData, 'UELNNumber', payload.UELNNumber, options);
  appendValue(formData, 'InternationalFEIRegistrationNumber', payload.InternationalFEIRegistrationNumber, options);
  appendValue(formData, 'NationalSportRegistrationNumber', payload.NationalSportRegistrationNumber, options);
  appendValue(formData, 'PassportNumber', payload.PassportNumber, options);

  payload.Images?.forEach((image) => appendFile(formData, 'Images', image));
  payload.NewImages?.forEach((image) => appendFile(formData, 'NewImages', image));
  payload.RemoveImageIds?.forEach((id) => appendValue(formData, 'RemoveImageIds', id, options));
  payload.Videos?.forEach((video) => appendValue(formData, 'Videos', video, options));
  payload.NewVideos?.forEach((video) => appendValue(formData, 'NewVideos', video, options));
  payload.RemoveVideoIds?.forEach((id) => appendValue(formData, 'RemoveVideoIds', id, options));

  appendValue(formData, 'HorseFatherStudbookId', payload.HorseFatherStudbookId, options);
  appendValue(formData, 'HorseMotherStudbookId', payload.HorseMotherStudbookId, options);
  appendValue(formData, 'OwnerStudbookId', payload.OwnerStudbookId, options);
  appendValue(formData, 'BreederStudbookId', payload.BreederStudbookId, options);

  appendValue(formData, 'IsStallion', payload.IsStallion, options);
  appendValue(formData, 'IsMare', payload.IsMare, options);
  appendValue(formData, 'IsStrain', payload.IsStrain, options);
  appendValue(formData, 'IsSpecial', payload.IsSpecial, options);
  appendValue(formData, 'Box', payload.Box, options);

  return formData;
};
