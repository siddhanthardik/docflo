import { prisma as db } from "@/lib/prisma";
import { format } from "date-fns";
import { 
  AlertCircle, 
  CheckCircle2, 
  TerminalSquare, 
  Clock, 
  ServerCrash,
  ShieldCheck
} from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SystemErrorsPage() {
  // Fetch latest 100 errors, unresolved first
  const logs = await db.systemErrorLog.findMany({
    orderBy: [
      { status: 'asc' }, // 'OPEN' before 'RESOLVED'
      { createdAt: 'desc' }
    ],
    take: 100,
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ServerCrash className="w-6 h-6 text-indigo-600" />
            System Error Logs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time tracking of platform crashes and exceptions, powered by automated diagnostics.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Error Message</th>
                <th className="px-6 py-4">Path / Method</th>
                <th className="px-6 py-4">Diagnostic Solution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="font-medium text-slate-900">System is healthy</p>
                    <p>No errors have been logged recently.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      {log.status === "OPEN" ? (
                        <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Open
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Resolved
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {format(log.createdAt, "MMM d, yyyy HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-900 font-medium">
                      {log.errorCode ? <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 mr-2">{log.errorCode}</span> : null}
                      {log.errorMessage}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 w-fit">
                          {log.method || 'GET'} {log.path || '/unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-slate-700 text-sm whitespace-normal line-clamp-2">
                          <strong className="text-indigo-600">AI Fix: </strong>
                          {log.solution}
                        </p>
                      </div>
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
