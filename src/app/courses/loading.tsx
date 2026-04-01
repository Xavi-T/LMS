export default function CoursesLoading() {
  return (
    <div className="container-app space-y-6 py-6 md:py-10">
      <div className="space-y-2">
        <div className="h-4 w-32 animate-pulse rounded bg-black/30" />
        <div className="h-9 w-96 animate-pulse rounded bg-black/30" />
      </div>
      <div className="card h-36 animate-pulse rounded-xl border border-border bg-black/20" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card h-72 animate-pulse rounded-xl border border-border bg-black/20" />
        <div className="card h-72 animate-pulse rounded-xl border border-border bg-black/20" />
        <div className="card h-72 animate-pulse rounded-xl border border-border bg-black/20" />
      </div>
    </div>
  );
}
