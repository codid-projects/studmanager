import { apiFetch } from './http';
import type {
  ApiMessageResult,
  ContactDto,
  ContactGroupDto,
  ContactGroupPayload,
  ContactPayload,
  PagedResponse,
  SupplementDto,
  SupplementPayload,
} from './types';

export function getContacts(params: {
  pageNumber?: number;
  pageSize?: number;
  groupId?: number;
  search?: string;
} = {}) {
  return apiFetch<PagedResponse<ContactDto>>('/api/Contacts', {
    query: {
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 20,
      groupId: params.groupId,
      search: params.search,
    },
  });
}

export function createContact(payload: ContactPayload) {
  return apiFetch<ApiMessageResult>('/api/Contacts', { method: 'POST', body: payload });
}

export function updateContact(payload: ContactPayload & { id: number }) {
  return apiFetch<ApiMessageResult>('/api/Contacts', { method: 'PUT', body: payload });
}

export function deleteContact(id: number) {
  return apiFetch<ApiMessageResult>(`/api/Contacts/${id}`, { method: 'DELETE' });
}

export function getContactGroups(pageNumber = 1, pageSize = 100) {
  return apiFetch<PagedResponse<ContactGroupDto>>('/api/Settings/contact-groups', {
    query: { pageNumber, pageSize },
  });
}

export function createContactGroup(payload: ContactGroupPayload) {
  return apiFetch<ApiMessageResult>('/api/Settings/contact-groups', {
    method: 'POST',
    body: payload,
  });
}

export function updateContactGroup(id: number, payload: ContactGroupPayload) {
  return apiFetch<ApiMessageResult>(`/api/Settings/contact-groups/${id}`, {
    method: 'PUT',
    body: { id, ...payload },
  });
}

export function deleteContactGroup(id: number) {
  return apiFetch<ApiMessageResult>(`/api/Settings/contact-groups/${id}`, { method: 'DELETE' });
}

export function getSupplements(pageNumber = 1, pageSize = 20) {
  return apiFetch<PagedResponse<SupplementDto>>('/api/Settings/supplements', {
    query: { pageNumber, pageSize },
  });
}

export function createSupplement(payload: SupplementPayload) {
  return apiFetch<ApiMessageResult>('/api/Settings/supplements', {
    method: 'POST',
    body: payload,
  });
}

export function updateSupplement(id: number, payload: SupplementPayload) {
  return apiFetch<ApiMessageResult>(`/api/Settings/supplements/${id}`, {
    method: 'PUT',
    body: { id, ...payload },
  });
}

export function deleteSupplement(id: number) {
  return apiFetch<ApiMessageResult>(`/api/Settings/supplements/${id}`, { method: 'DELETE' });
}
