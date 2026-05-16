'use client';

import { clientApiFetch } from './client';
import { buildCreateHorseFormData } from './create-horse-form-data';
import type { ApiResult, CreateHorsePayload } from './types';

export { appendFile, appendValue, buildCreateHorseFormData } from './create-horse-form-data';

export const createHorse = async (payload: CreateHorsePayload): Promise<ApiResult<number>> => {
  const formData = buildCreateHorseFormData(payload);

  return clientApiFetch<ApiResult<number>>({
    method: 'POST',
    backendPath: '/api/Horses',
    nextPath: '/api/horses',
    body: formData,
  });
};
