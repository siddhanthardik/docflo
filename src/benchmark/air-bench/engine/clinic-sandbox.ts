export interface SandboxPatient {
  id: string;
  name: string;
  phone: string;
  gender?: string;
  dateOfBirth?: string;
  patientType: "ACTIVE" | "LEAD";
}

export interface SandboxAppointment {
  id: string;
  patientId: string;
  doctorName: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "6:00 PM"
  status: "CONFIRMED" | "CANCELLED";
  type: "IN_CLINIC" | "TELE_CONSULTATION";
  notes?: string;
}

export class ClinicSandbox {
  public patients: Map<string, SandboxPatient> = new Map();
  public appointments: Map<string, SandboxAppointment> = new Map();
  public auditLogs: Array<{ action: string; payload: any; timestamp: Date }> = [];

  constructor(initialPatients: SandboxPatient[] = [], initialAppointments: SandboxAppointment[] = []) {
    initialPatients.forEach(p => this.patients.set(p.id, p));
    initialAppointments.forEach(a => this.appointments.set(a.id, a));
  }

  createPatient(patient: Omit<SandboxPatient, "id">): SandboxPatient {
    const id = `pt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newPt: SandboxPatient = { id, ...patient };
    this.patients.set(id, newPt);
    this.auditLogs.push({ action: "PATIENT_CREATED", payload: newPt, timestamp: new Date() });
    return newPt;
  }

  createAppointment(apt: Omit<SandboxAppointment, "id">): SandboxAppointment {
    const id = `apt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newApt: SandboxAppointment = { id, ...apt };
    this.appointments.set(id, newApt);
    this.auditLogs.push({ action: "APPOINTMENT_CREATED", payload: newApt, timestamp: new Date() });
    return newApt;
  }

  cancelAppointment(patientName: string): boolean {
    let found = false;
    for (const [id, apt] of this.appointments.entries()) {
      const pt = this.patients.get(apt.patientId);
      if (pt && pt.name.toLowerCase().includes(patientName.toLowerCase())) {
        apt.status = "CANCELLED";
        this.auditLogs.push({ action: "APPOINTMENT_CANCELLED", payload: apt, timestamp: new Date() });
        found = true;
      }
    }
    return found;
  }

  getAppointmentsForPatient(patientName: string): SandboxAppointment[] {
    const res: SandboxAppointment[] = [];
    for (const apt of this.appointments.values()) {
      const pt = this.patients.get(apt.patientId);
      if (pt && pt.name.toLowerCase().includes(patientName.toLowerCase())) {
        res.push(apt);
      }
    }
    return res;
  }

  reset() {
    this.patients.clear();
    this.appointments.clear();
    this.auditLogs = [];
  }
}
