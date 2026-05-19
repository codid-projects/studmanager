import type { CreateHorsePayload, UploadFilePayload } from './types';

export const appendValue = (formData: FormData, key: string, value: unknown) => {
  if (value === undefined || value === null || value === '') return;

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

export const buildCreateHorseFormData = (payload: CreateHorsePayload) => {
  const formData = new FormData();

  appendValue(formData, 'EnglishName', payload.EnglishName);
  appendValue(formData, 'ArabicName', payload.ArabicName);
  appendValue(formData, 'KnownAs', payload.KnownAs);
  appendFile(formData, 'HorseProfileImage', payload.HorseProfileImage);
  appendValue(formData, 'ClearHorseProfileImage', payload.ClearHorseProfileImage);

  appendValue(formData, 'StrainEn', payload.StrainEn);
  appendValue(formData, 'StrainAr', payload.StrainAr);
  appendValue(formData, 'SpecialEn', payload.SpecialEn);
  appendValue(formData, 'SpecialAr', payload.SpecialAr);

  appendValue(formData, 'DateofBirth', formatDateOnly(payload.DateofBirth));
  appendValue(formData, 'Gender', payload.Gender);
  appendValue(formData, 'BornIn', payload.BornIn);
  appendValue(formData, 'CurrentlyIn', payload.CurrentlyIn);
  appendValue(formData, 'Color', payload.Color);
  appendValue(formData, 'Height', payload.Height);

  appendValue(formData, 'AdditionalInformation', payload.AdditionalInformation);
  appendValue(formData, 'FaceSpecialMarkings', payload.FaceSpecialMarkings);
  appendValue(formData, 'FrontRightLeg', payload.FrontRightLeg);
  appendValue(formData, 'FrontLeftLeg', payload.FrontLeftLeg);
  appendValue(formData, 'BackRightLeg', payload.BackRightLeg);
  appendValue(formData, 'BackLeftLeg', payload.BackLeftLeg);
  appendValue(formData, 'SpecialNotes', payload.SpecialNotes);

  appendValue(formData, 'RegistrationNumber', payload.RegistrationNumber);
  appendValue(formData, 'MicrochipID', payload.MicrochipID);
  appendValue(formData, 'UELNNumber', payload.UELNNumber);
  appendValue(formData, 'InternationalFEIRegistrationNumber', payload.InternationalFEIRegistrationNumber);
  appendValue(formData, 'NationalSportRegistrationNumber', payload.NationalSportRegistrationNumber);
  appendValue(formData, 'PassportNumber', payload.PassportNumber);

  payload.Images?.forEach((image) => appendFile(formData, 'Images', image));
  payload.NewImages?.forEach((image) => appendFile(formData, 'NewImages', image));
  payload.RemoveImageIds?.forEach((id) => appendValue(formData, 'RemoveImageIds', id));
  payload.Videos?.forEach((video) => appendValue(formData, 'Videos', video));
  payload.NewVideos?.forEach((video) => appendValue(formData, 'NewVideos', video));
  payload.RemoveVideoIds?.forEach((id) => appendValue(formData, 'RemoveVideoIds', id));

  appendValue(formData, 'HorseFatherStudbookId', payload.HorseFatherStudbookId);
  appendValue(formData, 'HorseMotherStudbookId', payload.HorseMotherStudbookId);
  appendValue(formData, 'OwnerStudbookId', payload.OwnerStudbookId);
  appendValue(formData, 'BreederStudbookId', payload.BreederStudbookId);

  appendValue(formData, 'IsStallion', payload.IsStallion);
  appendValue(formData, 'IsMare', payload.IsMare);
  appendValue(formData, 'IsStrain', payload.IsStrain);
  appendValue(formData, 'IsSpecial', payload.IsSpecial);
  appendValue(formData, 'Box', payload.Box);

  return formData;
};
