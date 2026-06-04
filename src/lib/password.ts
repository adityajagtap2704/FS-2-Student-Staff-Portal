import bcryptjs from "bcryptjs";

// Hash password using bcrypt
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

// Compare password with stored bcrypt hash
export async function comparePassword(password: string, storedPassword: string): Promise<boolean> {
  // If stored password is a bcrypt hash, use bcrypt compare
  if (storedPassword.startsWith("$2")) {
    return bcryptjs.compare(password, storedPassword);
  }
  // Fallback: direct comparison for plain text passwords
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
