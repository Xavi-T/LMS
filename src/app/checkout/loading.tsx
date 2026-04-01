export default function CheckoutLoading() {
  return (
    <div className="container-app grid gap-6 py-6 md:grid-cols-[1.1fr_0.9fr] md:py-10">
      <div className="space-y-4">
        <div className="h-10 w-72 animate-pulse rounded bg-black/30" />
        <div className="card h-36 animate-pulse rounded-xl border border-border bg-black/20" />
        <div className="card h-44 animate-pulse rounded-xl border border-border bg-black/20" />
        <div className="card h-28 animate-pulse rounded-xl border border-border bg-black/20" />
      </div>
      <div className="card h-96 animate-pulse rounded-xl border border-border bg-black/20" />
    </div>
  );
}
