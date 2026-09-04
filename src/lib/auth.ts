import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import jwt from "jsonwebtoken";
import { logActivity } from "./audit";
import { cookies } from "next/headers";

// ----- Type augmentation for NextAuth (fixes TS errors) -----
declare module "next-auth" {
  interface User {
    role?: string;
    doctorId?: string;
    clinicName?: string | null;
    doctorName?: string | null;
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
      clinicName?: string | null;
      doctorName?: string | null;
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
        
        const rawEmail = credentials.email as string;
        const cleanEmail = rawEmail.trim().toLowerCase();
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

        let userFound = false;

        // 0. Try to find a Platform User first (SaaS Staff)
        const platformUser = await prisma.platformUser.findFirst({
          where: { email: { equals: cleanEmail, mode: "insensitive" } },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            isActive: true,
            createdAt: true,
            emailVerified: true,
            failedLoginAttempts: true,
            lockedUntil: true,
          },
        });

        if (platformUser && platformUser.isActive) {
          userFound = true;
          await checkLockout(platformUser, "PLATFORM");
          if (platformUser.password) {
            let isValid = await compare(password, platformUser.password);
            if (!isValid && password.trim() !== password) {
              isValid = await compare(password.trim(), platformUser.password);
            }
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
                emailVerified: (platformUser as any).emailVerified || null,
                rememberMe: credentials.rememberMe === "true"
              };
            }
          }
          await handleFailedLogin(platformUser, prisma.platformUser, "PLATFORM");
        }

        // 1. Try to find a Doctor next
        const doctor = await prisma.doctor.findFirst({
          where: { email: { equals: cleanEmail, mode: "insensitive" } },
          select: {
            id: true,
            email: true,
            name: true,
            clinicName: true,
            password: true,
            role: true,
            createdAt: true,
            emailVerified: true,
            failedLoginAttempts: true,
            lockedUntil: true,
          },
        });

        if (doctor) {
          userFound = true;
          await checkLockout(doctor, "CLINIC");
          if (doctor.password) {
            let isValid = await compare(password, doctor.password);
            if (!isValid && password.trim() !== password) {
              isValid = await compare(password.trim(), doctor.password);
            }
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
                doctorId: doctor.id,
                clinicName: doctor.clinicName || null,
                doctorName: doctor.name,
                createdAt: doctor.createdAt,
                emailVerified: doctor.emailVerified,
                rememberMe: credentials.rememberMe === "true"
              };
            }
          }
          await handleFailedLogin(doctor, prisma.doctor, "CLINIC");
        }

        // 2. If not a doctor, try to find a Staff member
        const staff = await prisma.staffMember.findFirst({
          where: { email: { equals: cleanEmail, mode: "insensitive" }, isActive: true },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            doctorId: true,
            createdAt: true,
            emailVerified: true,
            failedLoginAttempts: true,
            lockedUntil: true,
            doctor: {
              select: {
                name: true,
                clinicName: true,
              }
            }
          },
        });

        if (staff) {
          userFound = true;
          await checkLockout(staff, "STAFF");
          if (staff.password) {
            let isValid = await compare(password, staff.password);
            if (!isValid && password.trim() !== password) {
              isValid = await compare(password.trim(), staff.password);
            }
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
                clinicName: staff.doctor?.clinicName || null,
                doctorName: staff.doctor?.name || null,
                createdAt: staff.createdAt,
                emailVerified: staff.emailVerified,
                rememberMe: credentials.rememberMe === "true"
              };
            }
          }
          await handleFailedLogin(staff, prisma.staffMember, "STAFF");
        }

        // If user was not found at all, log NOT_FOUND
        if (!userFound) {
          await logActivity({ userId: cleanEmail, userType: "UNKNOWN", action: "LOGIN_FAILED_NOT_FOUND", ipAddress, userAgent });
        }
        throw new Error("Invalid credentials");
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update") {
        // Re-fetch emailVerified from DB — secure source of truth, handles cross-device verification
        try {
          const dbDoc = await prisma.doctor.findUnique({ where: { id: token.sub! }, select: { emailVerified: true } });
          const dbStaff = !dbDoc ? await prisma.staffMember.findUnique({ where: { id: token.sub! }, select: { emailVerified: true } }) : null;
          const dbPlatform = !dbDoc && !dbStaff ? await prisma.platformUser.findUnique({ where: { id: token.sub! }, select: { emailVerified: true } }) : null;
          const verified = dbDoc?.emailVerified || dbStaff?.emailVerified || dbPlatform?.emailVerified;
          if (verified) token.emailVerified = verified.toISOString();
        } catch { /* non-critical — token stays as-is if DB unreachable */ }
      }
      if (user) {
        token.role = user.role;
        token.doctorId = user.doctorId;
        token.clinicName = user.clinicName;
        token.doctorName = user.doctorName;
        token.createdAt = user.createdAt?.toISOString();
        token.emailVerified = user.emailVerified?.toISOString() || null;
        
        // 8 hours if not rememberMe, 30 days if rememberMe
        const isRemember = user.rememberMe;
        token.strictExp = Math.floor(Date.now() / 1000) + (isRemember ? 30 * 24 * 60 * 60 : 8 * 60 * 60);
      }
      
      if (token.strictExp && Math.floor(Date.now() / 1000) > (token.strictExp as number)) {
        return null as any; // Clear token if strict expiry passed
      }
      return token;
    },
    async session({ session, token }) {
      if (!token || !token.sub || Object.keys(token).length <= 1) {
        return null as any;
      }
      session.user.id = token.sub;
      session.user.role = token.role as string;
      session.user.doctorId = token.doctorId as string | undefined;
      (session.user as any).clinicName = token.clinicName as string | null | undefined;
      (session.user as any).doctorName = token.doctorName as string | null | undefined;
      (session.user as any).createdAt = token.createdAt as string;
      (session.user as any).emailVerified = token.emailVerified as string | null;

      // IMPERSONATION LOGIC
      if (session.user.role === "SUPERADMIN" || session.user.role === "ADMIN" || session.user.role === "SALES") {
         try {
           const cookieStore = await cookies();
           const impersonateId = cookieStore.get("gyrex_impersonate")?.value;
           if (impersonateId) {
             const target = await prisma.doctor.findUnique({ where: { id: impersonateId } });
             if (target) {
               (session.user as any).originalAdminId = session.user.id;
               (session.user as any).originalRole = session.user.role;
               
               session.user.id = target.id;
               session.user.role = target.role;
               session.user.name = target.name;
               session.user.email = target.email;
             }
           }
         } catch(e) {}
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