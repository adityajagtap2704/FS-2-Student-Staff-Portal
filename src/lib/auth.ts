import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import db from "@/lib/db";
import { comparePassword } from "@/lib/password";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
<<<<<<< HEAD
        if (!credentials?.email || !credentials?.password) {
          console.log(`[AUTH] ✗ Missing credentials`);
          return null;
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();
        const inputPassword   = credentials.password; // do NOT trim — preserve exact input
        console.log(`[AUTH] 🔍 Login attempt for: ${normalizedEmail}`);
        console.log(`[AUTH] 🔍 Password length: ${inputPassword.length}, chars: ${JSON.stringify(inputPassword)}`);

        try {
          // 1. Try Staff (CLASS_TEACHER / NON_TEACHING_STAFF / HOD) first
          console.log(`[AUTH] 🔎 Checking STAFF table...`);
          const staff = await db.staff.findUnique({
            where: { email: normalizedEmail },
          });

          if (staff) {
            console.log(`[AUTH] ✓ Staff found: ${staff.name}, Role: ${staff.role}, Active: ${staff.isActive}`);
            
            if (!staff.isActive) {
              console.log(`[AUTH] ✗ Staff account is inactive`);
              return null;
            }

            console.log(`[AUTH] 🔐 Comparing password...`);
            console.log(`[AUTH] 🔐 Input: "${credentials.password}" | Stored: "${staff.password}"`);
            const passwordMatch = await comparePassword(credentials.password, staff.password);
            
            if (passwordMatch) {
              console.log(`[AUTH] ✓ Password match! Login successful for ${staff.email}`);
              return {
                id:            staff.id.toString(),
                name:          staff.name,
                email:         staff.email,
                role:          staff.role,          // "CLASS_TEACHER" | "NON_TEACHING_STAFF" | "HOD"
                assignedClass: staff.assignedClass ?? undefined,
              };
            } else {
              console.log(`[AUTH] ✗ Password mismatch for staff: ${staff.email}`);
              return null;
            }
          } else {
            console.log(`[AUTH] ✗ Staff not found in database`);
          }

          // 2. Try Student - Login with Email + Password (set during account setup)
          console.log(`[AUTH] 🔎 Checking STUDENT table...`);
          const student = await db.student.findUnique({
            where: { email: normalizedEmail },
          });

          if (student) {
            console.log(`[AUTH] ✓ Student found: ${student.name}, Active: ${student.isActive}, Has password: ${!!student.password}`);
            
            if (!student.isActive) {
              console.log(`[AUTH] ✗ Student account is inactive`);
              return null;
            }

            if (!student.password) {
              console.log(`[AUTH] ✗ Student has no password set`);
              return null;
            }

            console.log(`[AUTH] 🔐 Comparing password...`);
            const passwordMatch = await comparePassword(credentials.password, student.password);
            
            if (passwordMatch) {
              console.log(`[AUTH] ✓ Password match! Login successful for ${student.email}`);
              return {
                id:    student.id.toString(),
                name:  student.name,
                email: student.email,
                role:  "STUDENT",
              };
            } else {
              console.log(`[AUTH] ✗ Password mismatch for student: ${student.email}`);
              return null;
            }
          } else {
            console.log(`[AUTH] ✗ Student not found in database`);
          }

          console.log(`[AUTH] ✗ No user found with email: ${normalizedEmail}`);
          return null;

        } catch (error) {
          console.error(`[AUTH] ✗ Error during authentication:`, error);
          return null;
        }
=======
        if (!credentials?.email || !credentials?.password) return null;

        // 1. Try Staff (CLASS_TEACHER / HOD) first
        const staff = await db.staff.findUnique({
          where: { email: credentials.email },
        });

        if (staff && staff.isActive) {
          const passwordMatch = await comparePassword(credentials.password, staff.password);
          if (passwordMatch) {
            return {
              id:           staff.id.toString(),
              name:         staff.name,
              email:        staff.email,
              role:         staff.role,          // "CLASS_TEACHER" | "HOD"
              assignedClass: staff.assignedClass ?? undefined,
            };
          }
        }

        // 2. Try Student - Login with Email + Password (set during account setup)
        const student = await db.student.findUnique({
          where: { email: credentials.email },
        });

        if (student && student.isActive && student.password) {
          const passwordMatch = await comparePassword(credentials.password, student.password);
          console.log(`[AUTH] Student login attempt: ${credentials.email}, Password match: ${passwordMatch}`);
          if (passwordMatch) {
            return {
              id:    student.id.toString(),
              name:  student.name,
              email: student.email,
              role:  "STUDENT",
            };
          }
        } else {
          console.log(`[AUTH] Student not found or inactive: ${credentials.email}, Found: ${!!student}, Active: ${student?.isActive}, Has password: ${!!student?.password}`);
        }

        return null;
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id           = user.id;
        token.role         = (user as any).role;
        token.assignedClass = (user as any).assignedClass;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id           = token.id;
        (session.user as any).role         = token.role;
        (session.user as any).assignedClass = token.assignedClass;
      }
      return session;
    },
  },
};
