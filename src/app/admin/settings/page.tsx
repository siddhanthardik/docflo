import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Settings, CreditCard, Mail, Bell, Shield, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
    redirect("/");
  }

  const sections = [
    {
      title: "General Platform Settings",
      description: "Manage global platform configurations, name, and branding.",
      icon: Settings,
      status: "Available in v1.1"
    },
    {
      title: "Payment Gateway",
      description: "Configure Razorpay/Stripe API keys and webhooks.",
      icon: CreditCard,
      status: "Available in v1.1"
    },
    {
      title: "Email SMTP",
      description: "Configure transactional email delivery settings.",
      icon: Mail,
      status: "Available in v1.1"
    },
    {
      title: "Notifications",
      description: "System alerts and SuperAdmin notification preferences.",
      icon: Bell,
      status: "Available in v1.1"
    },
    {
      title: "Webhooks",
      description: "Manage outgoing webhooks for external integrations.",
      icon: Webhook,
      status: "Available in v1.1"
    },
    {
      title: "Security",
      description: "Manage 2FA, session timeouts, and IP whitelisting.",
      icon: Shield,
      status: "Available in v1.1"
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Platform Settings
          </h1>
          <p className="text-gray-500 mt-1">Configure global platform integrations and security.</p>
        </div>
        <Button disabled>Save Changes</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
                <section.icon className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{section.title}</h3>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{section.description}</p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
               <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                 {section.status}
               </span>
               <Button variant="outline" size="sm" disabled>Configure</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
