import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

// ----- Type augmentation for NextAuth (fixes TS errors) -----
declare module "next-auth" {
  interface User {
    role?: string;
    doctorId?: string;
  }
  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      doctorId?: string;
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        // 1. Try to find a Doctor first
        const doctor = await prisma.doctor.findUnique({
          where: { email: credentials.email as string },
        });

        if (doctor && doctor.password) {
          const isValid = await compare(
            credentials.password as string,
            doctor.password
          );
          if (isValid) {
            return {
              id: doctor.id,
              email: doctor.email,
              name: doctor.name,
              role: doctor.role, // "DOCTOR" or "ADMIN"
            };
          }
        }

        // 2. If not a doctor, try to find a Staff member
        const staff = await prisma.staffMember.findFirst({
          where: {
            email: credentials.email as string,
            isActive: true,
          },
        });

        if (staff && staff.password) {
          const isValid = await compare(
            credentials.password as string,
            staff.password
          );
          if (isValid) {
            return {
              id: staff.id,
              email: staff.email,
              name: staff.name,
              role: staff.role,           // "RECEPTIONIST", "STAFF", etc.
              doctorId: staff.doctorId,   // so we know which doctor they belong to
            };
          }
        }

        // If nothing matched
        throw new Error("Invalid credentials");
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        // If the user has a doctorId (staff), store it
        if ("doctorId" in user) {
          token.doctorId = user.doctorId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
        // For staff: attach doctorId to session
        if (token.doctorId) {
          session.user.doctorId = token.doctorId as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});