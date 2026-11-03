import { DonorShell } from "@/components/donor-flow";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <DonorShell>{children}</DonorShell>;
}
