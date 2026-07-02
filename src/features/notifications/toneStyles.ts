import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from 'lucide-react';
import type { NotificationTone } from './store';

export const TONE_ICON: Record<NotificationTone, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
};

export const TONE_COLOR: Record<NotificationTone, string> = {
  info: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};
