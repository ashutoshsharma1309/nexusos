import { cn } from '@/lib/cn';

interface BadgeProps {
  count: number;
  /** A dark ring helps the badge read against busy icons (e.g. dock glyphs). */
  ring?: boolean;
  className?: string;
}

/**
 * A count bubble (unread notifications, etc.). One implementation shared by the
 * menu bar and the dock so the size, radius and typography always match.
 */
export function Badge({ count, ring, className }: BadgeProps) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden
      className={cn(
        'grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1',
        'text-[10px] font-bold leading-none text-white tabular-nums shadow',
        ring && 'ring-2 ring-black/30',
        className,
      )}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}
