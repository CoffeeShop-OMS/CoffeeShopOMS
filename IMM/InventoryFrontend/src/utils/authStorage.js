const AUTH_STORAGE_KEY = import.meta.env.VITE_AUTH_STORAGE_KEY || "imm_admin_auth";

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const saveAuthSession = (authData, rememberMe = false) => {
  const payload = JSON.stringify(authData);

  if (rememberMe) {
    localStorage.setItem(AUTH_STORAGE_KEY, payload);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(AUTH_STORAGE_KEY, payload);
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const getAuthSession = () => {
  const sessionValue = sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (sessionValue) return safeParse(sessionValue);

  const localValue = localStorage.getItem(AUTH_STORAGE_KEY);
  if (localValue) return safeParse(localValue);

  return null;
};

export const clearAuthSession = () => {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
};
