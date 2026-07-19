import React from "react";
import { prisma } from "@/lib/prisma";
import { Users, TrendingUp, DollarSign } from "lucide-react";

export default async function AdminAuditsPage() {
  const leads = await prisma.auditLead.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      requests: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          report: true
        }
      }
    }
  });

  const totalScans = await prisma.auditRequest.count();
  const totalLeads = leads.length;
  const conversionRate = totalScans > 0 ? Math.round((totalLeads / totalScans) * 100) : 0;

  return (
    <div className="p-8 font-sans">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Free Audit Engine (Lead Gen)</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Leads</p>
            <p className="text-3xl font-bold text-slate-900">{totalLeads}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Conversion Rate</p>
            <p className="text-3xl font-bold text-slate-900">{conversionRate}%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Scans Ran</p>
            <p className="text-3xl font-bold text-slate-900">{totalScans}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="p-4 font-semibold">Lead Details</th>
              <th className="p-4 font-semibold">Clinic & Speciality</th>
              <th className="p-4 font-semibold">Health Score</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {leads.map((lead: any) => {
              const latestRequest = lead.requests && lead.requests.length > 0 ? lead.requests[0] : null;
              
              return (
              <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <div className="font-semibold text-slate-900">{lead.name}</div>
                  <div className="text-sm text-slate-500">{lead.email || "No email"}</div>
                  <div className="text-sm text-slate-500">{lead.phone || "No phone"}</div>
                </td>
                <td className="p-4">
                  <div className="font-semibold text-slate-900">{lead.clinicName}</div>
                  <div className="text-sm text-slate-500">{latestRequest?.report?.speciality || "General"}</div>
                  <div className="text-xs text-slate-400 mt-1">{lead.requests?.length || 0} audits</div>
                </td>
                <td className="p-4">
                  {latestRequest?.report ? (
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-slate-900">{latestRequest.report.overallScore}/100</div>
                    </div>
                  ) : (
                    <span className="text-slate-400">
                      {latestRequest?.status === "FAILED" ? "Failed" : latestRequest?.status === "SCANNING" ? "Scanning..." : "N/A"}
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 uppercase">
                    CRM: {lead.status}
                  </span>
                  {latestRequest && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 uppercase ml-2">
                      Audit: {latestRequest.status}
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  {latestRequest ? (
                    <a 
                      href={`/local-seo/free-audit/report/${latestRequest.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                    >
                      View Latest
                    </a>
                  ) : (
                    <span className="text-slate-400 text-sm">No Request</span>
                  )}
                </td>
              </tr>
            )})}
            {leads.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No leads captured yet. Drive traffic to /local-seo/free-audit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
