import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  /** Required for a11y — icon-only controls have no text. */
  label: string;
  size?: 'sm' | 'md';
  tone?: 'default' | 'danger';
}

const SIZES = {
  sm: { pad: 'p-1', icon: 'h-3.5 w-3.5' },
  md: { pad: 'p-1.5', icon: 'h-4 w-4' },
} as const;

/**
 * The single square icon-only control used across system chrome (title bars,
 * panels, toolbars). Consolidates the previously divergent padding + hover
 * treatments into one accessible primitive.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, size = 'sm', tone = 'default', className, ...props },
  ref,
) {
  const s = SIZES[size];
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'pressable rounded-md text-fg-muted transition-colors',
        'hover:bg-fg/10 hover:text-fg focus-visible:bg-fg/10 focus-visible:text-fg',
        'disabled:pointer-events-none disabled:opacity-40',
        tone === 'danger' && 'hover:bg-danger/15 hover:text-danger focus-visible:text-danger',
        s.pad,
        className,
      )}
      {...props}
    >
      <Icon className={s.icon} />
    </button>
  );
});
