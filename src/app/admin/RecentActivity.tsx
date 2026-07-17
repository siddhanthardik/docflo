import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function RecentActivity({ activities }: { activities: any[] }) {
  if (!activities || activities.length === 0) {
    return <div className="p-4 text-center text-sm text-gray-500">No recent activities found.</div>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {activities.map((activity, i) => (
        <div key={i} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-900">{activity.action}</p>
            <p className="text-xs text-gray-500 mt-1">
              User: <span className="font-mono">{activity.userId}</span> ({activity.userType})
            </p>
          </div>
          <p className="text-xs text-gray-400 whitespace-nowrap">
            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
          </p>
        </div>
      ))}
    </div>
  );
}

export function LatestPayments({ payments }: { payments: any[] }) {
  if (!payments || payments.length === 0) {
    return <div className="p-4 text-center text-sm text-gray-500">No recent payments found.</div>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {payments.map((payment, i) => (
        <div key={i} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {payment.doctor?.clinicName || payment.doctor?.name || "Unknown Clinic"}
            </p>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
              <span>{payment.package?.name || "Package"}</span>
              <span className="text-gray-300">•</span>
              <span>{formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true })}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">${payment.amount}</p>
            <Badge variant="default" className="mt-1 text-[10px] h-4 leading-none bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
              {payment.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TopClinicsList({ clinics }: { clinics: any[] }) {
  if (!clinics || clinics.length === 0) {
    return <div className="p-4 text-center text-sm text-gray-500">No active clinics found.</div>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {clinics.map((clinic, i) => (
        <div key={i} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
              {i + 1}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 line-clamp-1">{clinic.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{clinic.package}</p>
            </div>
          </div>
          <div className="text-right pl-4">
            <p className="text-sm font-bold text-gray-900">${clinic.mrr}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">MRR</p>
          </div>
        </div>
      ))}
    </div>
  );
}
