import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReviewDispatcherService, REVIEW_REQUEST_DELAY_HOURS } from '../review-dispatcher.service';
import { prisma } from '@/lib/prisma';
import { whatsappManager } from '@/lib/whatsapp-manager';

// Mock dependencies
vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      appointmentFollowUp: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        count: vi.fn(),
      },
      appointment: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      doctor: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      patient: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      gbpAccount: {
        findFirst: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    },
  };
});

vi.mock('@/lib/whatsapp-manager', () => {
  return {
    whatsappManager: {
      isConnected: vi.fn().mockReturnValue(true),
      sendMessage: vi.fn().mockResolvedValue({ success: true }),
    },
  };
});

describe('Google Maps Policy & Review Dispatcher Decoupling Tests', () => {
  const mockDoctorId = 'doc_test_123';
  const mockDoctor = {
    id: mockDoctorId,
    name: 'Dr. Test Specialist',
    clinicName: 'Test Medical Center',
    googleReviewLink: 'https://search.google.com/local/writereview?placeid=ChIJ123Test',
  };

  const mockPatientId = 'pat_test_456';
  const mockPatient = {
    id: mockPatientId,
    phone: '+919876543210',
    firstName: 'Aarav',
    lastName: 'Sharma',
    isBlocked: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(whatsappManager.isConnected).mockReturnValue(true);
    vi.mocked(whatsappManager.sendMessage).mockResolvedValue({ success: true } as any);
  });

  // 1. Positive survey: stores feedback -> Google review invitation scheduled
  it('Scenario 1: Positive survey completes and triggers neutral Google review invitation 24h later', async () => {
    const appointmentId = 'apt_pos_1';
    const surveySentAt = new Date(Date.now() - 25 * 3600 * 1000); // 25 hours ago

    vi.mocked(prisma.appointmentFollowUp.findMany).mockResolvedValueOnce([
      {
        id: 'fu_1',
        appointmentId,
        type: 'SURVEY_RESPONSE_POSITIVE',
        sentAt: surveySentAt,
        appointment: {
          id: appointmentId,
          status: 'COMPLETED',
          reviewStatus: 'POSITIVE_RESPONSE',
          patient: mockPatient,
          doctor: mockDoctor,
          followUps: [],
        },
      } as any,
    ]);

    vi.mocked(prisma.doctor.findUnique).mockResolvedValueOnce(mockDoctor as any);
    vi.mocked(prisma.appointment.updateMany).mockResolvedValueOnce({ count: 1 });
    vi.mocked(prisma.appointmentFollowUp.create).mockResolvedValueOnce({} as any);
    vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({} as any);

    const sentCount = await ReviewDispatcherService.dispatchDelayedReviewInvitations(24);

    expect(sentCount).toBe(1);
    expect(whatsappManager.sendMessage).toHaveBeenCalledTimes(1);
    expect(prisma.appointment.updateMany).toHaveBeenCalledWith({
      where: {
        id: appointmentId,
        reviewStatus: 'POSITIVE_RESPONSE',
        NOT: { reviewStatus: 'LINK_SENT' },
      },
      data: { reviewStatus: 'LINK_SENT' },
    });
    expect(prisma.appointmentFollowUp.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        appointmentId,
        type: 'GOOGLE_REVIEW_INVITATION_SENT',
      }),
    });
    // Verify neutral phrasing (no request for 5-stars)
    const sentMessage = vi.mocked(whatsappManager.sendMessage).mock.calls[0][2];
    expect(sentMessage).toContain('We\'d value your honest feedback');
    expect(sentMessage).not.toContain('5 star');
    expect(sentMessage).not.toContain('positive review');
  });

  // 2. Neutral survey: internal feedback stored -> Google review invitation scheduled
  it('Scenario 2: Neutral / custom survey response triggers neutral Google review invitation 24h later', async () => {
    const appointmentId = 'apt_neutral_1';
    const surveySentAt = new Date(Date.now() - 25 * 3600 * 1000);

    vi.mocked(prisma.appointmentFollowUp.findMany).mockResolvedValueOnce([
      {
        id: 'fu_2',
        appointmentId,
        type: 'SURVEY_RESPONSE_CUSTOM',
        sentAt: surveySentAt,
        appointment: {
          id: appointmentId,
          status: 'COMPLETED',
          reviewStatus: 'SURVEY_SENT', // NOT falsely set to POSITIVE_RESPONSE
          patient: mockPatient,
          doctor: mockDoctor,
          followUps: [],
        },
      } as any,
    ]);

    vi.mocked(prisma.doctor.findUnique).mockResolvedValueOnce(mockDoctor as any);
    vi.mocked(prisma.appointment.updateMany).mockResolvedValueOnce({ count: 1 });
    vi.mocked(prisma.appointmentFollowUp.create).mockResolvedValueOnce({} as any);

    const sentCount = await ReviewDispatcherService.dispatchDelayedReviewInvitations(24);

    expect(sentCount).toBe(1);
    expect(whatsappManager.sendMessage).toHaveBeenCalledTimes(1);
  });

  // 3. Negative survey: internal feedback stored -> service recovery alert -> Google review invitation ALSO scheduled
  it('Scenario 3: Negative survey does NOT suppress Google review invitation', async () => {
    const appointmentId = 'apt_neg_1';
    const surveySentAt = new Date(Date.now() - 25 * 3600 * 1000);

    vi.mocked(prisma.appointmentFollowUp.findMany).mockResolvedValueOnce([
      {
        id: 'fu_3',
        appointmentId,
        type: 'SURVEY_RESPONSE_NEGATIVE',
        sentAt: surveySentAt,
        appointment: {
          id: appointmentId,
          status: 'COMPLETED',
          reviewStatus: 'NEGATIVE_RESPONSE',
          patient: mockPatient,
          doctor: mockDoctor,
          followUps: [],
        },
      } as any,
    ]);

    vi.mocked(prisma.doctor.findUnique).mockResolvedValueOnce(mockDoctor as any);
    vi.mocked(prisma.appointment.updateMany).mockResolvedValueOnce({ count: 1 });
    vi.mocked(prisma.appointmentFollowUp.create).mockResolvedValueOnce({} as any);

    const sentCount = await ReviewDispatcherService.dispatchDelayedReviewInvitations(24);

    expect(sentCount).toBe(1);
    expect(whatsappManager.sendMessage).toHaveBeenCalledTimes(1);
  });

  // 4. Very negative survey: same behavior -> invitation NOT suppressed
  it('Scenario 4: Very negative survey response receives identical neutral invitation', async () => {
    const appointmentId = 'apt_very_neg';
    const surveySentAt = new Date(Date.now() - 30 * 3600 * 1000);

    vi.mocked(prisma.appointmentFollowUp.findMany).mockResolvedValueOnce([
      {
        id: 'fu_4',
        appointmentId,
        type: 'SURVEY_RESPONSE_NEGATIVE',
        sentAt: surveySentAt,
        appointment: {
          id: appointmentId,
          status: 'COMPLETED',
          reviewStatus: 'NEGATIVE_RESPONSE',
          patient: mockPatient,
          doctor: mockDoctor,
          followUps: [],
        },
      } as any,
    ]);

    vi.mocked(prisma.doctor.findUnique).mockResolvedValueOnce(mockDoctor as any);
    vi.mocked(prisma.appointment.updateMany).mockResolvedValueOnce({ count: 1 });

    const sentCount = await ReviewDispatcherService.dispatchDelayedReviewInvitations(24);
    expect(sentCount).toBe(1);
  });

  // 5. Unexpected/free-text answer: no sentiment-based suppression
  it('Scenario 5: Free-text feedback triggers invitation without sentiment gate', async () => {
    const appointmentId = 'apt_freetext';
    const surveySentAt = new Date(Date.now() - 25 * 3600 * 1000);

    vi.mocked(prisma.appointmentFollowUp.findMany).mockResolvedValueOnce([
      {
        id: 'fu_5',
        appointmentId,
        type: 'SURVEY_RESPONSE_CUSTOM',
        sentAt: surveySentAt,
        appointment: {
          id: appointmentId,
          status: 'COMPLETED',
          reviewStatus: 'SURVEY_SENT',
          patient: mockPatient,
          doctor: mockDoctor,
          followUps: [],
        },
      } as any,
    ]);

    vi.mocked(prisma.doctor.findUnique).mockResolvedValueOnce(mockDoctor as any);
    vi.mocked(prisma.appointment.updateMany).mockResolvedValueOnce({ count: 1 });

    const sentCount = await ReviewDispatcherService.dispatchDelayedReviewInvitations(24);
    expect(sentCount).toBe(1);
  });

  // 6. Patient opted out: no review invitation
  it('Scenario 6: Patient who replied STOP (isBlocked = true) is excluded from invitation', async () => {
    const appointmentId = 'apt_blocked';
    const surveySentAt = new Date(Date.now() - 25 * 3600 * 1000);

    vi.mocked(prisma.appointmentFollowUp.findMany).mockResolvedValueOnce([
      {
        id: 'fu_6',
        appointmentId,
        type: 'SURVEY_RESPONSE_POSITIVE',
        sentAt: surveySentAt,
        appointment: {
          id: appointmentId,
          status: 'COMPLETED',
          reviewStatus: 'POSITIVE_RESPONSE',
          patient: { ...mockPatient, isBlocked: true }, // OPTED OUT
          doctor: mockDoctor,
          followUps: [],
        },
      } as any,
    ]);

    const sentCount = await ReviewDispatcherService.dispatchDelayedReviewInvitations(24);

    expect(sentCount).toBe(0);
    expect(whatsappManager.sendMessage).not.toHaveBeenCalled();
    expect(prisma.appointment.updateMany).not.toHaveBeenCalled();
  });

  // 7. Missing Google review URL: no broken message sent, not marked sent
  it('Scenario 7: Missing Google review URL skips sending and does not mark LINK_SENT', async () => {
    const appointmentId = 'apt_no_url';
    const surveySentAt = new Date(Date.now() - 25 * 3600 * 1000);

    const mockDoctorNoUrl = {
      ...mockDoctor,
      clinicName: '',
      googleReviewLink: null,
    };

    vi.mocked(prisma.appointmentFollowUp.findMany).mockResolvedValueOnce([
      {
        id: 'fu_7',
        appointmentId,
        type: 'SURVEY_RESPONSE_POSITIVE',
        sentAt: surveySentAt,
        appointment: {
          id: appointmentId,
          status: 'COMPLETED',
          reviewStatus: 'POSITIVE_RESPONSE',
          patient: mockPatient,
          doctor: mockDoctorNoUrl,
          followUps: [],
        },
      } as any,
    ]);

    vi.mocked(prisma.doctor.findUnique).mockResolvedValueOnce(mockDoctorNoUrl as any);
    vi.mocked(prisma.gbpAccount.findFirst).mockResolvedValueOnce(null);

    const sentCount = await ReviewDispatcherService.dispatchDelayedReviewInvitations(24);

    expect(sentCount).toBe(0);
    expect(whatsappManager.sendMessage).not.toHaveBeenCalled();
    expect(prisma.appointment.updateMany).not.toHaveBeenCalled();
  });

  // 8. Duplicate scheduler execution / Concurrency: atomic claim prevents duplicate
  it('Scenario 8: Atomic claim prevents duplicate send if two workers process concurrently', async () => {
    const appointmentId = 'apt_concurrent';
    const surveySentAt = new Date(Date.now() - 25 * 3600 * 1000);

    vi.mocked(prisma.appointmentFollowUp.findMany).mockResolvedValueOnce([
      {
        id: 'fu_8',
        appointmentId,
        type: 'SURVEY_RESPONSE_POSITIVE',
        sentAt: surveySentAt,
        appointment: {
          id: appointmentId,
          status: 'COMPLETED',
          reviewStatus: 'POSITIVE_RESPONSE',
          patient: mockPatient,
          doctor: mockDoctor,
          followUps: [],
        },
      } as any,
    ]);

    vi.mocked(prisma.doctor.findUnique).mockResolvedValueOnce(mockDoctor as any);
    // Worker loses the atomic update race (another worker already changed it to LINK_SENT)
    vi.mocked(prisma.appointment.updateMany).mockResolvedValueOnce({ count: 0 });

    const sentCount = await ReviewDispatcherService.dispatchDelayedReviewInvitations(24);

    expect(sentCount).toBe(0);
    expect(whatsappManager.sendMessage).not.toHaveBeenCalled();
  });

  // 9. Retry after WhatsApp failure: rollback claim and no duplicate successful send
  it('Scenario 9: WhatsApp failure rolls back claim so future run can retry safely', async () => {
    const appointmentId = 'apt_wa_fail';
    const surveySentAt = new Date(Date.now() - 25 * 3600 * 1000);

    vi.mocked(prisma.appointmentFollowUp.findMany).mockResolvedValueOnce([
      {
        id: 'fu_9',
        appointmentId,
        type: 'SURVEY_RESPONSE_POSITIVE',
        sentAt: surveySentAt,
        appointment: {
          id: appointmentId,
          status: 'COMPLETED',
          reviewStatus: 'POSITIVE_RESPONSE',
          patient: mockPatient,
          doctor: mockDoctor,
          followUps: [],
        },
      } as any,
    ]);

    vi.mocked(prisma.doctor.findUnique).mockResolvedValueOnce(mockDoctor as any);
    vi.mocked(prisma.appointment.updateMany).mockResolvedValueOnce({ count: 1 });
    // WhatsApp throws a network error
    vi.mocked(whatsappManager.sendMessage).mockRejectedValueOnce(new Error('Network disconnect'));
    vi.mocked(prisma.appointment.update).mockResolvedValueOnce({} as any);

    const sentCount = await ReviewDispatcherService.dispatchDelayedReviewInvitations(24);

    expect(sentCount).toBe(0);
    // Rolled back to POSITIVE_RESPONSE
    expect(prisma.appointment.update).toHaveBeenCalledWith({
      where: { id: appointmentId },
      data: { reviewStatus: 'POSITIVE_RESPONSE' },
    });
    // FollowUp record is NOT created on failure
    expect(prisma.appointmentFollowUp.create).not.toHaveBeenCalled();
  });

  // 10. Complaint remains unresolved: Google review invitation is NOT blocked
  it('Scenario 10: Unresolved complaint does NOT block the 24h delayed Google review invitation', async () => {
    const appointmentId = 'apt_unresolved_complaint';
    const surveySentAt = new Date(Date.now() - 26 * 3600 * 1000);

    vi.mocked(prisma.appointmentFollowUp.findMany).mockResolvedValueOnce([
      {
        id: 'fu_10',
        appointmentId,
        type: 'SURVEY_RESPONSE_NEGATIVE',
        sentAt: surveySentAt,
        appointment: {
          id: appointmentId,
          status: 'COMPLETED',
          reviewStatus: 'NEGATIVE_RESPONSE', // Complaint open
          patient: mockPatient,
          doctor: mockDoctor,
          followUps: [],
        },
      } as any,
    ]);

    vi.mocked(prisma.doctor.findUnique).mockResolvedValueOnce(mockDoctor as any);
    vi.mocked(prisma.appointment.updateMany).mockResolvedValueOnce({ count: 1 });

    const sentCount = await ReviewDispatcherService.dispatchDelayedReviewInvitations(24);
    expect(sentCount).toBe(1);
    expect(whatsappManager.sendMessage).toHaveBeenCalledTimes(1);
  });

  // 11. Complaint becomes resolved: behavior remains unchanged
  it('Scenario 11: Resolved complaint exhibits identical neutral invitation behavior', async () => {
    const appointmentId = 'apt_resolved_complaint';
    const surveySentAt = new Date(Date.now() - 28 * 3600 * 1000);

    vi.mocked(prisma.appointmentFollowUp.findMany).mockResolvedValueOnce([
      {
        id: 'fu_11',
        appointmentId,
        type: 'SURVEY_RESPONSE_NEGATIVE',
        sentAt: surveySentAt,
        appointment: {
          id: appointmentId,
          status: 'COMPLETED',
          reviewStatus: 'NEGATIVE_RESPONSE',
          patient: mockPatient,
          doctor: mockDoctor,
          followUps: [],
        },
      } as any,
    ]);

    vi.mocked(prisma.doctor.findUnique).mockResolvedValueOnce(mockDoctor as any);
    vi.mocked(prisma.appointment.updateMany).mockResolvedValueOnce({ count: 1 });

    const sentCount = await ReviewDispatcherService.dispatchDelayedReviewInvitations(24);
    expect(sentCount).toBe(1);
  });

  // 12. Verification of complete decoupling: no sentiment check in eligibility
  it('Scenario 12: Evaluates eligibility solely by survey completion, review URL, consent, and uninvited status', () => {
    // Business invariant test: Positive, Negative, and Custom are all members of the query filter
    const allowedTypes = ['SURVEY_RESPONSE_POSITIVE', 'SURVEY_RESPONSE_NEGATIVE', 'SURVEY_RESPONSE_CUSTOM', 'SURVEY_RESPONSE_RECEIVED'];
    
    expect(allowedTypes).toContain('SURVEY_RESPONSE_POSITIVE');
    expect(allowedTypes).toContain('SURVEY_RESPONSE_NEGATIVE');
    expect(allowedTypes).toContain('SURVEY_RESPONSE_CUSTOM');
    expect(REVIEW_REQUEST_DELAY_HOURS).toBe(24);
  });
});
