import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Building2, Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CustomersPage() {
  const session = await auth();

  if (!session || !["SUPERADMIN", "ADMIN", "SALES", "MARKETING"].includes(session.user?.role || "")) {
    redirect("/");
  }

  const customers = await prisma.doctor.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      package: true,
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-indigo-600" />
            Customers
          </h1>
          <p className="text-gray-500 mt-1">Manage doctor accounts, subscriptions, and access.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white border-b border-gray-100 text-gray-500">
              <tr>
                <th className="font-semibold px-6 py-4">Customer</th>
                <th className="font-semibold px-6 py-4">Role</th>
                <th className="font-semibold px-6 py-4">Joined Date</th>
                <th className="font-semibold px-6 py-4">Subscription</th>
                <th className="font-semibold px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                          {user.name?.charAt(0) || "C"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${user.role === 'ADMIN' || user.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {user.package ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{user.package.name}</span>
                          <span className={`text-xs ${
                            user.subscriptionStatus === 'ACTIVE' ? 'text-emerald-600' : 
                            user.subscriptionStatus === 'PAST_DUE' ? 'text-amber-600' : 'text-rose-600'
                          }`}>
                            {user.subscriptionStatus}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No Package</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/customers/${user.id}`}>
                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                          View Details <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
