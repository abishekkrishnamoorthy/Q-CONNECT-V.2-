export default function SkeletonCard() {
  return (
    <div className="rounded-[16px] border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="skeleton h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-2/5 rounded" />
          <div className="skeleton h-3 w-1/4 rounded" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-[85%] rounded" />
        <div className="skeleton h-3 w-[60%] rounded" />
      </div>

      <div className="mt-4 flex gap-2">
        <div className="skeleton h-6 w-20 rounded-full" />
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

