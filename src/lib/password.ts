// Store password as plain text
export async function hashPassword(password: string): Promise<string> {
  // Simply return the password as-is (plain text)
  return password;
}

// Compare password with stored plain text password
export async function comparePassword(password: string, storedPassword: string): Promise<boolean> {
  // Direct string comparison for plain text passwords
  return password === storedPassword;
}

// Generate a random password
export function generateRandomPassword(length: number = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
