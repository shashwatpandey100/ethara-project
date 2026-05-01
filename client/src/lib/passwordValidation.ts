export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  if (password.length < 8) errors.push("Must be at least 8 characters");
  if (!/[a-z]/.test(password)) errors.push("Must contain a lowercase letter");
  if (!/[A-Z]/.test(password)) errors.push("Must contain an uppercase letter");
  if (!/\d/.test(password)) errors.push("Must contain a number");
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    errors.push("Must contain a special character");
  return { isValid: errors.length === 0, errors };
}
