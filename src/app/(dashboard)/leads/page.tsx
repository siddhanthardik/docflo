import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLeadsPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    redirect("/admin/leads");
  }

  redirect("/dashboard");
}
