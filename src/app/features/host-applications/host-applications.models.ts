export type HostApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface HostApplication {
  applicationId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  contact: string | null;
  organizationName: string;
  reason: string | null;
  status: HostApplicationStatus;
  appliedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
}

export interface HostApplicationPage {
  dataList: HostApplication[];
  dataCount: number;
}
