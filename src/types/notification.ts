export interface Notification {
  id: string;
  severity: 'critical' | 'warning';
  title: string;
  preview: string;
  fullMessage: string;
  timestamp: Date;
  isRead: boolean;
}
