import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Building2, Mail, Phone, MapPin, Stethoscope, Clock, CreditCard, Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session || !["SUPERADMIN", "ADMIN", "SALES", "MARKETING"].includes(session.user?.role || "")) {
    redirect("/");
  }

  const resolvedParams = await params;
  const { id } = resolvedParams;

  const customer = await prisma.doctor.findUnique({
    where: { id },
    include: {
      package: true,
      paymentTransactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: { patients: true, appointments: true, gbpAccounts: true, campaigns: true }
      }
    }
  });

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Not Found</h2>
        <p className="text-gray-500 mb-6">The customer you are looking for does not exist or has been deleted.</p>
        <Link href="/admin/customers">
          <Button>Back to Customers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/customers">
          <Button variant="outline" size="icon" className="h-9 w-9 text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            {customer.name}
          </h1>
          <p className="text-gray-500 mt-1">Joined on {new Date(customer.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              Profile Details
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Address</p>
                  <p className="text-sm text-gray-500">{customer.email}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone Number</p>
                  <p className="text-sm text-gray-500">{customer.phone || "Not provided"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Stethoscope className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Specialty</p>
                  <p className="text-sm text-gray-500">{customer.specialty || "Not specified"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Clinic Name</p>
                  <p className="text-sm text-gray-500">{customer.clinicName || "Not specified"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Location</p>
                  <p className="text-sm text-gray-500">
                    {[customer.city, customer.state, customer.country].filter(Boolean).join(", ") || "Not specified"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              Subscription Status
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-500">Current Plan</p>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                  customer.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 
                  customer.subscriptionStatus === 'PAST_DUE' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {customer.subscriptionStatus}
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900">{customer.package?.name || "None"}</p>
              {customer.package && (
                <p className="text-sm text-gray-500 mt-1">${customer.package.price} / {customer.package.billingPeriod}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                Change Plan
              </Button>
              <Button variant="outline" className="w-full text-rose-600 border-rose-200 hover:bg-rose-50">
                Revoke Access
              </Button>
            </div>
          </div>
        </div>

        {/* Activity & History */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
              <p className="text-3xl font-bold text-indigo-600 mb-1">{customer._count.patients}</p>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Patients</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
              <p className="text-3xl font-bold text-indigo-600 mb-1">{customer._count.appointments}</p>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Appointments</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
              <p className="text-3xl font-bold text-indigo-600 mb-1">{customer._count.gbpAccounts}</p>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Locations</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
              <p className="text-3xl font-bold text-indigo-600 mb-1">{customer._count.campaigns}</p>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Campaigns</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                Payment History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                  <tr>
                    <th className="font-semibold px-6 py-3">Date</th>
                    <th className="font-semibold px-6 py-3">Amount</th>
                    <th className="font-semibold px-6 py-3">Status</th>
                    <th className="font-semibold px-6 py-3">Promo Code</th>
                    <th className="font-semibold px-6 py-3 text-right">Transaction ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customer.paymentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No payment history available.
                      </td>
                    </tr>
                  ) : (
                    customer.paymentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          ${tx.amount.toFixed(2)} {tx.currency}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                            tx.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {tx.promoCode ? (
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                              {tx.promoCode}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs text-gray-400">
                          {tx.razorpayPaymentId || tx.id}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
