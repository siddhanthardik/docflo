export interface ReportMetadata {
  reportName: string;
  generatedBy: string;
  generatedOn: string;
  clinicName: string;
  timezone: string;
  version: string;
}

export interface ReportDateRange {
  startDate: string; // ISO String or YYYY-MM-DD
  endDate: string;
}

export interface ReportFilters {
  timezone: string;
  [key: string]: any;
}

export interface BaseReportResult<T> {
  metadata: ReportMetadata;
  dateRange: ReportDateRange;
  filters: ReportFilters;
  totals: T;
}
