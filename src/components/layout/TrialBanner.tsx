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
    <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-center gap-2 text-xs sm:text-sm">
      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" />
      <p className="text-amber-800 font-medium text-center leading-tight">
        Your Gyrex Pro trial expires in {daysLeft} {daysLeft === 1 ? "day" : "days"}. 
        <Link href="/subscription" className="ml-1.5 font-bold underline hover:text-amber-900 transition-colors">
          Upgrade Now
        </Link>
        {" "}to prevent disruption to automated workflows.
      </p>
    </div>
  );
}
