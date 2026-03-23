/** Normalize Django / JWT auth API errors for display */
export function formatAuthError(error, fallback = 'Login failed. Please check your credentials and try again.') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error.detail != null) {
    if (Array.isArray(error.detail)) return error.detail.map(String).join(' ');
    return String(error.detail);
  }
  if (Array.isArray(error.non_field_errors) && error.non_field_errors.length > 0) {
    return error.non_field_errors.join(' ');
  }
  if (error.error) return String(error.error);
  if (error.message) return String(error.message);
  return fallback;
}
