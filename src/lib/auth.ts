import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import jwt from "jsonwebtoken";
import { logActivity } from "./audit";

// ----- Type augmentation for NextAuth (fixes TS errors) -----
declare module "next-auth" {
  interface User {
    role?: string;
    doctorId?: string;
    createdAt?: Date;
    emailVerified?: Date | null;
    rememberMe?: boolean;
  }
  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      doctorId?: string;
      createdAt?: string;
      emailVerified?: string | null;
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
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }
        
        const email = credentials.email as string;
        const password = credentials.password as string;

        // Retrieve IP and UserAgent
        // In NextAuth v5, req is the NextRequest or standard Request object
        let ipAddress = "0.0.0.0";
        let userAgent = "NextAuth/Login";
        
        if (req && req.headers) {
          // If req is a Request or NextRequest, we can extract headers using get() if available
          const getHeader = (name: string) => {
            if (typeof (req.headers as any).get === "function") {
              return (req.headers as any).get(name);
            }
            // Fallback for raw object if it exists
            return (req.headers as any)[name];
          };

          const forwardedFor = getHeader("x-forwarded-for");
          if (forwardedFor) {
             ipAddress = forwardedFor.split(',')[0].trim();
          } else {
             const realIp = getHeader("x-real-ip");
             if (realIp) ipAddress = realIp;
          }
          
          const ua = getHeader("user-agent");
          if (ua) userAgent = ua;
        }

        // Helper to check lockout
        const checkLockout = async (user: any, userType: any) => {
          if (user?.lockedUntil && user.lockedUntil > new Date()) {
            await logActivity({
              userId: user.id,
              userType,
              action: "LOGIN_FAILED_LOCKED",
              ipAddress,
              userAgent
            }).catch(() => {});
            throw new Error("Invalid credentials");
          }
        };

        // Helper to handle failed login
        const handleFailedLogin = async (user: any, model: any, userType: any) => {
          try {
            const attempts = (user.failedLoginAttempts || 0) + 1;
            const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
            
            await model.update({
              where: { id: user.id },
              data: { failedLoginAttempts: attempts, lockedUntil }
            });

            await logActivity({
              userId: user.id,
              userType,
              action: lockedUntil ? "ACCOUNT_LOCKOUT" : "LOGIN_FAILED",
              details: { attempts },
              ipAddress,
              userAgent
            });
          } catch (e) {
            // Ignore missing column errors during migration sync
          }
        };

        // 0. Try to find a Platform User first (SaaS Staff)
        const platformUser = await prisma.platformUser.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        });

        if (platformUser && platformUser.isActive) {
          await checkLockout(platformUser, "PLATFORM");
          if (platformUser.password) {
            const isValid = await compare(password, platformUser.password);
            if (isValid) {
              try {
                await prisma.platformUser.update({ where: { id: platformUser.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
              } catch (e) {}
              await logActivity({ userId: platformUser.id, userType: "PLATFORM", action: "LOGIN_SUCCESS", ipAddress, userAgent }).catch(() => {});
              return { 
                id: platformUser.id, 
                email: platformUser.email, 
                name: platformUser.name, 
                role: platformUser.role,
                createdAt: platformUser.createdAt,
                emailVerified: null,
                rememberMe: credentials.rememberMe === "true"
              };
            }
          }
          await handleFailedLogin(platformUser, prisma.platformUser, "PLATFORM");
        }

        // 1. Try to find a Doctor next
        const doctor = await prisma.doctor.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            createdAt: true,
          },
        });

        if (doctor) {
          await checkLockout(doctor, "CLINIC");
          if (doctor.password) {
            const isValid = await compare(password, doctor.password);
            if (isValid) {
              try {
                await prisma.doctor.update({ where: { id: doctor.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
              } catch (e) {}
              await logActivity({ userId: doctor.id, userType: "CLINIC", action: "LOGIN_SUCCESS", ipAddress, userAgent }).catch(() => {});
              return { 
                id: doctor.id, 
                email: doctor.email, 
                name: doctor.name, 
                role: doctor.role,
                createdAt: doctor.createdAt,
                emailVerified: null,
                rememberMe: credentials.rememberMe === "true"
              };
            }
          }
          await handleFailedLogin(doctor, prisma.doctor, "CLINIC");
        }

        // 2. If not a doctor, try to find a Staff member
        const staff = await prisma.staffMember.findFirst({
          where: { email, isActive: true },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            doctorId: true,
            createdAt: true,
          },
        });

        if (staff) {
          await checkLockout(staff, "STAFF");
          if (staff.password) {
            const isValid = await compare(password, staff.password);
            if (isValid) {
              try {
                await prisma.staffMember.update({ where: { id: staff.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
              } catch (e) {}
              await logActivity({ userId: staff.id, userType: "STAFF", action: "LOGIN_SUCCESS", ipAddress, userAgent }).catch(() => {});
              return { 
                id: staff.id, 
                email: staff.email, 
                name: staff.name, 
                role: staff.role, 
                doctorId: staff.doctorId,
                createdAt: staff.createdAt,
                emailVerified: null,
                rememberMe: credentials.rememberMe === "true"
              };
            }
          }
          await handleFailedLogin(staff, prisma.staffMember, "STAFF");
        }

        // If nothing matched
        await logActivity({ userId: email, userType: "UNKNOWN", action: "LOGIN_FAILED_NOT_FOUND", ipAddress, userAgent });
        throw new Error("Invalid credentials");
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.doctorId = user.doctorId;
        token.createdAt = user.createdAt?.toISOString();
        token.emailVerified = user.emailVerified?.toISOString() || null;
        
        // 8 hours if not rememberMe, 30 days if rememberMe
        const isRemember = user.rememberMe;
        token.strictExp = Math.floor(Date.now() / 1000) + (isRemember ? 30 * 24 * 60 * 60 : 8 * 60 * 60);
      }
      
      if (token.strictExp && Math.floor(Date.now() / 1000) > (token.strictExp as number)) {
        return {}; // Clear token if strict expiry passed
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub && Object.keys(token).length > 1) { // ensure token is valid
        session.user.id = token.sub;
        session.user.role = token.role as string;
        session.user.doctorId = token.doctorId as string | undefined;
        (session.user as any).createdAt = token.createdAt as string;
        (session.user as any).emailVerified = token.emailVerified as string | null;
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
  trustHost: true,
});