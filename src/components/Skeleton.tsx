export function CardSkeleton() {
  return (
    <div className="card animate-pulse space-y-3">
      <div className="h-4 bg-slate-700/50 rounded w-1/3" />
      <div className="h-3 bg-slate-700/50 rounded w-2/3" />
      <div className="h-3 bg-slate-700/50 rounded w-full" />
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-slate-700/50" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-700/50 rounded w-1/2" />
            <div className="h-2 bg-slate-700/50 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
