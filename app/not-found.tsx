import Link from "next/link";
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-content-center p-8 text-center">
      <p className="mb-3 text-xs uppercase tracking-widest text-primary">
        A little detour
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">
        This page could not be found.
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Let’s get you back to somewhere familiar.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm font-medium text-primary underline"
      >
        Return to the workspace
      </Link>
    </main>
  );
}
