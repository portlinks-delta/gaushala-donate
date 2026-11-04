"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Flower2,
  LayoutDashboard,
  Layers3,
  Menu,
  PanelTop,
  Plus,
  RotateCcw,
  Sprout,
  X,
  ChartNoAxesCombined,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Modal } from "@/components/ui/kit";
import { useDemo } from "@/components/demo-provider";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/pages", label: "Donation pages", icon: PanelTop },
  { href: "/admin/masters", label: "Masters", icon: Layers3 },
  { href: "/admin/reports", label: "Reports", icon: ChartNoAxesCombined },
];
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobile, setMobile] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  const { reset, notify, ready } = useDemo();
  useEffect(() => {
    if (!mobile) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebar.current?.querySelector<HTMLElement>("a, button")?.focus();
    const desktop = matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMobile(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.body.style.overflow = overflow;
      desktop.removeEventListener("change", closeOnDesktop);
      previous?.focus();
    };
  }, [mobile]);
  const active = nav.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  );
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:p-3"
      >
        Skip to content
      </a>
      {mobile && (
        <button
          className="fixed inset-0 z-30 bg-black/35 lg:hidden"
          aria-label="Close navigation"
          tabIndex={-1}
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        ref={sidebar}
        role={mobile ? "dialog" : undefined}
        aria-modal={mobile || undefined}
        aria-label="Main navigation"
        onKeyDown={(event) => {
          if (!mobile) return;
          if (event.key === "Escape") {
            event.preventDefault();
            setMobile(false);
          }
          if (event.key === "Tab") {
            const focusable = Array.from(
              sidebar.current?.querySelectorAll<HTMLElement>(
                "a[href], button:not(:disabled)",
              ) || [],
            ).filter((el) => el.getClientRects().length);
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }
        }}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[244px] flex-col overflow-y-auto border-r bg-[#fcfcf8] px-4 transition-transform lg:translate-x-0",
          mobile ? "translate-x-0" : "-translate-x-full max-lg:invisible",
        )}
      >
        <Link
          href="/"
          className="flex h-[84px] items-center gap-2.5 px-3"
          onClick={() => setMobile(false)}
        >
          <div className="grid size-10 place-items-center rounded-xl bg-primary text-white">
            <Flower2 className="size-6" strokeWidth={1.6} />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">
              <span className="text-primary">.</span>
            </p>
            <p className="text-[10px] uppercase tracking-[.21em] text-muted-foreground">
              Gaushala foundation
            </p>
          </div>
        </Link>
        <div className="mb-8 flex items-center gap-2.5 rounded-lg border bg-white p-3">
          <div className="grid size-8 place-items-center rounded-md bg-[#f3ead6] text-[#8c6b35]">
            <Sprout className="size-4" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold"> Gaushala</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Vrindavan, India
            </p>
          </div>
          <ChevronDown className="size-3 text-muted-foreground" />
        </div>
        <p className="px-3 text-[10px] font-medium uppercase tracking-[.15em] text-muted-foreground">
          Workspace
        </p>
        <nav className="mt-3 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <div key={href}>
              <Link
              href={href}
              prefetch
              aria-current={active?.href === href ? "page" : undefined}
              onClick={() => setMobile(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] transition-colors",
                active?.href === href
                  ? "bg-primary font-medium text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-[18px]" strokeWidth={1.7} />
              {label}
              {active?.href === href && (
                <span className="ml-auto size-1.5 rounded-full bg-[#f4c576]" />
              )}
              </Link>
              {href === "/admin/masters" && pathname.startsWith(href) && (
                <Link
                  href="/admin/masters?tab=donors"
                  onClick={() => setMobile(false)}
                  className="ml-9 flex rounded-lg px-3 py-2.5 text-sm text-primary hover:bg-muted"
                >
                  Donors
                </Link>
              )}
            </div>
          ))}
        </nav>
        <div className="mt-auto pb-5 pt-8">
          <div className="mb-5 rounded-xl border border-[#e3e6d8] bg-[#f0f2e8] p-4">
            <Sprout className="mb-2 size-5 text-primary" />
            <p className="text-xs font-semibold">Small acts. Lasting impact.</p>
            <p className="mb-3 mt-1 text-[11px] leading-relaxed text-muted-foreground">
              See how your community comes together to care.
            </p>
            <Link
              href="/donate/a-little-care-a-better-life"
              className="inline-flex items-center gap-2 text-xs font-medium text-primary"
            >
              View donation page <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <button
            onClick={() => {
              setMobile(false);
              setHelp(true);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-muted-foreground hover:bg-muted"
          >
            <CircleHelp className="size-4" />
            Help & information
          </button>
          <button
            onClick={() => {
              setMobile(false);
              setResetOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-muted-foreground hover:bg-muted"
          >
            <RotateCcw className="size-4" />
            Reset demo data
          </button>
          <div className="mt-4 flex items-center gap-3 border-t px-2 pt-5">
            <div className="grid size-9 place-items-center rounded-full bg-[#e6eadc] text-xs font-semibold text-primary">
              AS
            </div>
            <div>
              <p className="text-xs font-semibold"> Sharma</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Gaushala administrator
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-2 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        >
          <X />
        </Button>
      </aside>
      <div className="lg:pl-[244px]" inert={mobile || undefined}>
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-3 border-b bg-background/95 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </Button>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Workspace
            </span>
            <ChevronRight className="hidden size-3 text-muted-foreground sm:block" />
            <span className="text-xs font-medium">
              {active?.label || "Overview"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] text-muted-foreground sm:flex">
              <span className="size-1.5 rounded-full bg-amber-500" />
              Demo workspace
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              onClick={() =>
                notify("You're all caught up. This is a local demo workspace.")
              }
            >
              <Bell className="size-[18px]" />
            </Button>
            <div className="grid size-8 place-items-center rounded-full bg-[#e6eadc] text-[11px] font-semibold text-primary">
              AS
            </div>
          </div>
        </header>
        <main
          id="main"
          className="mx-auto max-w-[1560px] px-5 py-7 sm:px-8 sm:py-8"
        >
          {ready ? (
            children
          ) : (
            <div role="status" className="animate-pulse space-y-6">
              <div className="h-10 w-64 rounded-lg bg-muted" />
              <div className="grid gap-5 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 rounded-xl bg-muted" />
                ))}
              </div>
              <div className="h-96 rounded-xl bg-muted" />
              <span className="sr-only">Loading your demo workspace</span>
            </div>
          )}
        </main>
        <footer className="flex flex-wrap justify-between gap-2 px-5 pb-6 text-[10px] text-muted-foreground sm:px-8">
          <span>© 2026  Gaushala. Made for a kinder tomorrow.</span>
          <span>Local demo · Use sample personal details only</span>
        </footer>
      </div>
      <Modal
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset this workspace?"
        description="This removes your local campaigns, master changes, and demo donations and restores the original sample data."
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setResetOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              reset();
              setResetOpen(false);
            }}
          >
            Reset demo data
          </Button>
        </div>
      </Modal>
      <Modal
        open={help}
        onOpenChange={setHelp}
        title="Your demo workspace"
        description="Explore the admin tools and try a complete donation journey."
      >
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Create a donation page, configure your masters, and open its public
            preview. Published pages allow a simulated payment.
          </p>
          <p>
            Changes are saved in this browser. No money is collected and no
            email or WhatsApp message is sent. Use sample personal details only.
          </p>
          <p>
            Reports and dashboard totals update when you complete a demo
            donation.
          </p>
          <Button onClick={() => setHelp(false)}>
            <BookOpen className="size-4" />
            Got it
          </Button>
        </div>
      </Modal>
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[.15em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[27px] font-semibold tracking-[-.035em] sm:text-[30px]">
          {title}
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
export function CreatePageButton() {
  return (
    <Link
      href="/admin/pages/new"
      className={cn(buttonVariants(), "h-10 gap-2 px-4 text-xs")}
    >
      <Plus className="size-4" />
      Create donation page
    </Link>
  );
}
