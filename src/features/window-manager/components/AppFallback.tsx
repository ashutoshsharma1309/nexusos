/** Shared Suspense fallback: a calm skeleton rather than a spinner, so opening an
 *  app reads as "content arriving" instead of "something is stuck". */
export function AppFallback() {
  return (
    <div className="flex h-full flex-col gap-3 p-5">
      <div className="skeleton h-6 w-40" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-5/6" />
      <div className="mt-2 grid grid-cols-3 gap-3">
        <div className="skeleton h-20" />
        <div className="skeleton h-20" />
        <div className="skeleton h-20" />
      </div>
      <div className="skeleton mt-2 h-3 w-2/3" />
    </div>
  );
}
