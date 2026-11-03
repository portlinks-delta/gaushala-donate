export default function Loading() {
  return (
    <div
      role="status"
      className="mx-auto w-full max-w-6xl animate-pulse space-y-6 p-8"
    >
      <div className="h-10 w-64 rounded bg-muted" />
      <div className="h-96 rounded-xl bg-muted" />
      <span className="sr-only">Loading page</span>
    </div>
  );
}
