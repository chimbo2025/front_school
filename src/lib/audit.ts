import { AuditLog, AuditAction } from '../types';

export type { AuditAction };

let auditLogs: AuditLog[] = [];

export function auditLog(
  action: AuditAction,
  studentId: string,
  performedBy: string,
  options: {
    paymentId?: string;
    allocationId?: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    reason?: string;
  } = {}
): AuditLog {
  const log: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    studentId,
    paymentId: options.paymentId,
    allocationId: options.allocationId,
    action,
    performedBy,
    performedAt: new Date().toISOString(),
    before: options.before,
    after: options.after,
    reason: options.reason,
  };
  auditLogs.push(log);
  return log;
}

export function getAuditLogs(studentId?: string): AuditLog[] {
  if (studentId) {
    return auditLogs.filter((l) => l.studentId === studentId).sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
  }
  return [...auditLogs].sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
}

export function clearAuditLogs(): void {
  auditLogs = [];
}

export function seedAuditLogs(logs: AuditLog[]): void {
  auditLogs = logs;
}