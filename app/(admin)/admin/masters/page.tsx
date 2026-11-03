import { Suspense } from "react";
import { Masters } from "@/components/admin-masters";
export default function Page() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-muted-foreground">Loading masters…</p>
      }
    >
      <Masters />
    </Suspense>
  );
}
