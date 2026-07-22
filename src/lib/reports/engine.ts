import { ReportMetadata, ReportDateRange, ReportFilters, BaseReportResult } from "./types";
import { getTimezoneAwareDateRange } from "./date-utils";
import { generatePatientReport } from "./modules/patients.report";
import { generateAppointmentReport } from "./modules/appointments.report";
import { generateCommunicationReport } from "./modules/communications.report";
import { generateReputationReport } from "./modules/reputation.report";
import { generateFinancialReport } from "./modules/financial.report";

export class ReportEngine {
  /**
   * Generates a combined Growth & Operations report.
   */
  static async generateGrowthReport(
    doctorId: string,
    clinicName: string,
    generatedBy: string,
    startDateStr: string,
    endDateStr: string,
    timezone: string
  ): Promise<BaseReportResult<any>> {
    const { start, end } = getTimezoneAwareDateRange(startDateStr, endDateStr, timezone);

    // Run modular reports concurrently for maximum performance
    const [patientStats, appointmentStats, communicationStats, reputationStats, financialStats] = await Promise.all([
      generatePatientReport(doctorId, start, end),
      generateAppointmentReport(doctorId, start, end),
      generateCommunicationReport(doctorId, start, end),
      generateReputationReport(doctorId, start, end),
      generateFinancialReport(doctorId, start, end)
    ]);

    const metadata: ReportMetadata = {
      reportName: "Growth & Operations Report",
      generatedBy,
      generatedOn: new Date().toISOString(),
      clinicName,
      timezone,
      version: "1.0.0"
    };

    const dateRange: ReportDateRange = {
      startDate: startDateStr,
      endDate: endDateStr
    };

    const filters: ReportFilters = {
      timezone
    };

    const totals = {
      ...patientStats,
      ...appointmentStats,
      ...communicationStats,
      ...reputationStats,
      ...financialStats
    };

    return {
      metadata,
      dateRange,
      filters,
      totals
    };
  }
}
