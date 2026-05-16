export const AUTH_COOKIE = 'studmanager-auth';
export const AUTH_VALUE = 'authenticated';
export const AUTH_TOKEN_COOKIE = 'studmanager-token';
export const AUTH_USER_COOKIE = 'studmanager-user';

export function hasAuthCookie() {
  if (typeof document === 'undefined') return false;

  return document.cookie
    .split('; ')
    .some((cookie) => cookie === `${AUTH_COOKIE}=${AUTH_VALUE}`);
}

export function setAuthCookie(rememberMe: boolean) {
  if (typeof document === 'undefined') return;

  const baseCookie = `${AUTH_COOKIE}=${AUTH_VALUE}; Path=/; SameSite=Lax`;
  document.cookie = rememberMe
    ? `${baseCookie}; Max-Age=${60 * 60 * 24 * 30}`
    : baseCookie;
}

export function clearAuthCookie() {
  if (typeof document === 'undefined') return;

  document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
