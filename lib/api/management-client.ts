'use client';

import { clientApiFetch } from './client';
import type {
  ApiMessageResult,
  ContactDto,
  ContactGroupDto,
  ContactGroupPayload,
  ContactPayload,
  LocaleCode,
  PagedResponse,
  SupplementDto,
  SupplementPayload,
} from './types';

export function fetchContactGroups(locale: LocaleCode, pageNumber = 1, pageSize = 100) {
  return clientApiFetch<PagedResponse<ContactGroupDto>>({
    backendPath: '/api/Settings/contact-groups',
    nextPath: '/api/settings/contact-groups',
    backendQuery: { pageNumber, pageSize },
    nextQuery: { pageNumber, pageSize, locale },
    locale,
  });
}

export function fetchContacts(locale: LocaleCode, params: {
  pageNumber?: number;
  pageSize?: number;
  groupId?: number;
  search?: string;
} = {}) {
  return clientApiFetch<PagedResponse<ContactDto>>({
    backendPath: '/api/Contacts',
    nextPath: '/api/contacts',
    backendQuery: params,
    nextQuery: { ...params, locale },
    locale,
  });
}

export function saveContact(locale: LocaleCode, payload: ContactPayload, id?: number) {
  return clientApiFetch<ApiMessageResult>({
    method: id ? 'PUT' : 'POST',
    backendPath: '/api/Contacts',
    nextPath: '/api/contacts',
    nextQuery: { locale },
    body: id ? { id, ...payload } : payload,
    locale,
  });
}

export function removeContact(locale: LocaleCode, id: number) {
  return clientApiFetch<ApiMessageResult>({
    method: 'DELETE',
    backendPath: `/api/Contacts/${id}`,
    nextPath: `/api/contacts/${id}`,
    nextQuery: { locale },
    locale,
  });
}

export function saveContactGroup(locale: LocaleCode, payload: ContactGroupPayload, id?: number) {
  return clientApiFetch<ApiMessageResult>({
    method: id ? 'PUT' : 'POST',
    backendPath: id ? `/api/Settings/contact-groups/${id}` : '/api/Settings/contact-groups',
    nextPath: id ? `/api/settings/contact-groups/${id}` : '/api/settings/contact-groups',
    nextQuery: { locale },
    body: id ? { id, ...payload } : payload,
    locale,
  });
}

export function removeContactGroup(locale: LocaleCode, id: number) {
  return clientApiFetch<ApiMessageResult>({
    method: 'DELETE',
    backendPath: `/api/Settings/contact-groups/${id}`,
    nextPath: `/api/settings/contact-groups/${id}`,
    nextQuery: { locale },
    locale,
  });
}

export function fetchSupplements(locale: LocaleCode, pageNumber = 1, pageSize = 20) {
  return clientApiFetch<PagedResponse<SupplementDto>>({
    backendPath: '/api/Settings/supplements',
    nextPath: '/api/settings/supplements',
    backendQuery: { pageNumber, pageSize },
    nextQuery: { pageNumber, pageSize, locale },
    locale,
  });
}

export function saveSupplement(locale: LocaleCode, payload: SupplementPayload, id?: number) {
  return clientApiFetch<ApiMessageResult>({
    method: id ? 'PUT' : 'POST',
    backendPath: id ? `/api/Settings/supplements/${id}` : '/api/Settings/supplements',
    nextPath: id ? `/api/settings/supplements/${id}` : '/api/settings/supplements',
    nextQuery: { locale },
    body: id ? { id, ...payload } : payload,
    locale,
  });
}

export function removeSupplement(locale: LocaleCode, id: number) {
  return clientApiFetch<ApiMessageResult>({
    method: 'DELETE',
    backendPath: `/api/Settings/supplements/${id}`,
    nextPath: `/api/settings/supplements/${id}`,
    nextQuery: { locale },
    locale,
  });
}
