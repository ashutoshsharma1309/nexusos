import { memo } from 'react';
import { cn } from '@/lib/cn';
import type { ResizeEdge } from '../hooks/useWindowResize';

const EDGES: { edge: ResizeEdge; className: string }[] = [
  { edge: 'n', className: 'top-0 inset-x-2 h-1.5 cursor-ns-resize' },
  { edge: 's', className: 'bottom-0 inset-x-2 h-1.5 cursor-ns-resize' },
  { edge: 'e', className: 'right-0 inset-y-2 w-1.5 cursor-ew-resize' },
  { edge: 'w', className: 'left-0 inset-y-2 w-1.5 cursor-ew-resize' },
  { edge: 'ne', className: 'top-0 right-0 h-3 w-3 cursor-nesw-resize' },
  { edge: 'nw', className: 'top-0 left-0 h-3 w-3 cursor-nwse-resize' },
  { edge: 'se', className: 'bottom-0 right-0 h-3 w-3 cursor-nwse-resize' },
  { edge: 'sw', className: 'bottom-0 left-0 h-3 w-3 cursor-nesw-resize' },
];

interface Props {
  onStart: (edge: ResizeEdge) => (event: React.PointerEvent) => void;
}

function ResizeHandlesImpl({ onStart }: Props) {
  return (
    <>
      {EDGES.map(({ edge, className }) => (
        <div
          key={edge}
          role="presentation"
          onPointerDown={onStart(edge)}
          className={cn('absolute z-20 touch-none', className)}
        />
      ))}
    </>
  );
}

export const ResizeHandles = memo(ResizeHandlesImpl);
