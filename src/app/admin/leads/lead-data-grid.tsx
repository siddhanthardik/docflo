"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Mail, Phone, Activity, Search, MoreVertical, ExternalLink, FileText, Download, MessageSquare, PhoneCall, UserPlus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteLead } from "./actions";
import { toast } from "sonner";

export default function LeadDataGrid({ leads }: { leads: any[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [auditFilter, setAuditFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Filter and sort
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch = 
        (lead.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.clinicName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.phone || "").includes(searchTerm);
      
      const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;
      
      const latestAudit = lead.requests[0]?.status || "NONE";
      const matchesAudit = auditFilter === "ALL" || latestAudit === auditFilter;

      return matchesSearch && matchesStatus && matchesAudit;
    });
  }, [leads, searchTerm, statusFilter, auditFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = filteredLeads.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this lead?")) return;
    const res = await deleteLead(id);
    if (res.success) {
      toast.success("Lead deleted successfully");
    } else {
      toast.error("Failed to delete lead");
    }
  };

  const handleRowClick = (id: string) => {
    router.push(`/admin/leads/${id}`);
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search leads by name, clinic, or phone..." 
            className="pl-9 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            className="bg-white border border-slate-200 text-sm rounded-md px-3 py-2 w-full sm:w-auto"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="ALL">All CRM Status</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="CUSTOMER">Customer</option>
          </select>

          <select 
            className="bg-white border border-slate-200 text-sm rounded-md px-3 py-2 w-full sm:w-auto"
            value={auditFilter}
            onChange={(e) => { setAuditFilter(e.target.value); setPage(1); }}
          >
            <option value="ALL">All Audit Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="SCANNING">Running</option>
            <option value="FAILED">Failed</option>
            <option value="NONE">No Audit</option>
          </select>
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] table-fixed divide-y divide-slate-200">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="w-[120px] px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="w-[220px] px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Clinic</th>
                <th className="w-[140px] px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">CRM Status</th>
                <th className="w-[160px] px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Audit Status</th>
                <th className="w-[100px] px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No leads match your search criteria.
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => {
                  const latestAudit = lead.requests[0];

                  return (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(lead.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {format(new Date(lead.createdAt), "MMM d, yyyy")}
                        <div className="text-xs text-slate-400 mt-1">{format(new Date(lead.createdAt), "h:mm a")}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900 truncate" title={lead.name || "Unknown"}>{lead.name || "Unknown"}</div>
                        <div className="flex flex-col gap-1 mt-1 text-xs text-slate-500 overflow-hidden">
                          {lead.email && <span className="flex items-center gap-1" title={lead.email}><Mail className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{lead.email}</span></span>}
                          {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 flex-shrink-0" /> {lead.phone}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700 font-medium truncate" title={lead.clinicName || "-"}>{lead.clinicName || "-"}</div>
                        <div className="text-xs text-slate-500 mt-1 truncate" title={`Source: ${lead.leadSource || "Organic"}`}>Source: {lead.leadSource || "Organic"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            lead.status === "NEW" ? "bg-blue-100 text-blue-700" : 
                            lead.status === "CONTACTED" ? "bg-amber-100 text-amber-700" : 
                            lead.status === "QUALIFIED" ? "bg-purple-100 text-purple-700" :
                            lead.status === "CUSTOMER" ? "bg-emerald-100 text-emerald-700" : 
                            "bg-slate-100 text-slate-700"
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {latestAudit ? (
                          <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-semibold ${
                              latestAudit.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : 
                              latestAudit.status === "FAILED" ? "bg-red-100 text-red-700" : 
                              "bg-amber-100 text-amber-700 animate-pulse"
                          }`}>
                            <Activity className="w-3 h-3" />
                            {latestAudit.status}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">No Audit</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleRowClick(lead.id)}>
                              <ExternalLink className="mr-2 h-4 w-4" /> View Lead
                            </DropdownMenuItem>
                            {latestAudit && latestAudit.status === "COMPLETED" && (
                              <DropdownMenuItem onClick={() => window.open(`/local-seo/free-audit/report/${latestAudit.id}`, '_blank')}>
                                <FileText className="mr-2 h-4 w-4" /> Open Report
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {lead.phone && (
                              <>
                                <DropdownMenuItem onClick={() => window.open(`tel:${lead.phone}`)}>
                                  <PhoneCall className="mr-2 h-4 w-4" /> Call Lead
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`)}>
                                  <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem disabled>
                              <UserPlus className="mr-2 h-4 w-4" /> Assign Salesperson
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={(e) => handleDelete(e as any, lead.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Lead
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Showing <span className="font-medium">{((page - 1) * itemsPerPage) + 1}</span> to <span className="font-medium">{Math.min(page * itemsPerPage, filteredLeads.length)}</span> of <span className="font-medium">{filteredLeads.length}</span> leads
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-sm font-medium text-slate-700">
                Page {page} of {totalPages}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
