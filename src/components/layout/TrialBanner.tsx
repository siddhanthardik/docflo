import Link from "next/link";
import { AlertCircle } from "lucide-react";

export function TrialBanner({ 
  subscriptionExpiry,
  hasPaymentMethod
}: { 
  subscriptionExpiry: Date | null;
  hasPaymentMethod: boolean;
}) {
  if (!subscriptionExpiry || hasPaymentMethod) return null;

  const now = new Date();
  const expiry = new Date(subscriptionExpiry);
  const timeDiff = expiry.getTime() - now.getTime();
  const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

  // Only show banner if there are 4 days or fewer left and it hasn't expired yet
  if (daysLeft > 4 || daysLeft <= 0) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-center gap-3">
      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
      <p className="text-sm text-amber-800 font-medium text-center">
        Your Gyrex Pro trial expires in {daysLeft} {daysLeft === 1 ? "day" : "days"}. 
        <Link href="/settings/billing" className="ml-2 font-bold underline hover:text-amber-900 transition-colors">
          Upgrade Now
        </Link>
        {" "}to prevent disruption to your automated workflows.
      </p>
    </div>
  );
}
