
export const validateKey = (k: string) => {
  if (!k) return "Key is required";
  if (!/^[a-z]/.test(k)) return "Must start with a lowercase letter";
  if (!/^[a-z0-9_-]*$/.test(k)) return "Only lowercase letters, numbers, hyphens, and underscores";
  if (k.length > 63) return "Maximum length is 63 characters";
  return null;
};

export const validateValue = (v: string) => {
  if (!v) return null; // Value can be empty
  if (!/^[a-z0-9_-]*$/.test(v)) return "Only lowercase letters, numbers, hyphens, and underscores";
  if (v.length > 63) return "Maximum length is 63 characters";
  return null;
};
