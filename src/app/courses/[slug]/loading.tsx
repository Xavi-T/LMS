export default function CourseDetailLoading() {
  return (
    <div className="container-app space-y-6 py-6 md:py-10">
      <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="h-4 w-28 animate-pulse rounded bg-black/30" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-black/30" />
          <div className="h-72 animate-pulse rounded-2xl border border-border bg-black/20" />
          <div className="h-20 animate-pulse rounded-xl bg-black/20" />
        </div>
        <div className="card h-72 animate-pulse rounded-xl border border-border bg-black/20" />
      </div>
    </div>
  );
}
