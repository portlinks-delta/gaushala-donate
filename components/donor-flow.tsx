"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, type ReactNode, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  Flower2,
  Heart,
  Leaf,
  LockKeyhole,
  Printer,
  ShieldCheck,
  Sprout,
  Wallet,
  XCircle,
} from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { CampaignArt } from "@/components/campaign-art";
import {
  Badge,
  Card,
  EmptyState,
  ErrorMessage,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui/kit";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  dateLabel,
  downloadReceipt,
  emptyDraft,
  money,
  validAdditional,
  validDetails,
  type Donation,
  type DonorDraft,
} from "@/lib/demo";
import { cn } from "@/lib/utils";

const steps = ["seva", "details", "additional", "review", "payment", "success"];
const stepLabels = [
  "Your seva",
  "Your details",
  "A special touch",
  "Review",
  "Payment",
  "Thank you",
];
export function DonorShell({ children }: { children: ReactNode }) {
  const { state } = useDemo();
  const pathname = usePathname();
  const slug = pathname.split("/")[2];
  const campaign = state.campaigns.find((c) => c.slug === slug);
  return (
    <div className="min-h-screen bg-[#faf9f5]">
      <header className="print:hidden">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between border-b px-5 sm:px-8">
          <Link
            href={campaign ? `/donate/${campaign.slug}` : "/"}
            className="flex items-center gap-2.5"
          >
            <div className="grid size-10 place-items-center rounded-xl bg-primary text-white">
              <Flower2 className="size-6" strokeWidth={1.6} />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">anand.</p>
              <p className="text-[9px] uppercase tracking-[.18em] text-muted-foreground">
                Gaushala foundation
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-[11px] text-muted-foreground hover:text-primary"
            >
              Admin workspace <span aria-hidden>↗</span>
            </Link>
            <span className="hidden items-center gap-1.5 text-xs text-primary sm:flex">
              <ShieldCheck className="size-4" />
              Giving with care
            </span>
          </div>
        </div>
      </header>
      <main className="mx-auto min-h-[calc(100vh-200px)] max-w-6xl px-5 py-7 sm:px-8 sm:py-10">
        {children}
      </main>
      <footer className="mx-auto mt-6 flex max-w-6xl flex-wrap justify-between gap-3 border-t px-5 py-7 text-[10px] text-muted-foreground print:hidden sm:px-8">
        <span>
          © 2026 Anand Gaushala · A little kindness changes everything.
        </span>
        <span>Local demo · No actual payments · Use sample details</span>
      </footer>
    </div>
  );
}
function Recovery({
  title,
  slug,
  children,
  onRestart,
}: {
  title: string;
  slug?: string;
  children: ReactNode;
  onRestart?: () => void;
}) {
  return (
    <Card className="mx-auto my-12 max-w-lg">
      <EmptyState title={title}>
        {children}
        <div className="mt-5">
          {onRestart ? (
            <Button onClick={onRestart}>
              Start a new contribution <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Link
              href={slug ? `/donate/${slug}/seva` : "/admin/pages"}
              className={buttonVariants()}
            >
              {slug ? "Start your donation" : "Explore donation pages"}
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      </EmptyState>
    </Card>
  );
}
export function DonorFlow({
  slug,
  step = "landing",
}: {
  slug: string;
  step?: string;
}) {
  const { state, ready, update, notify } = useDemo();
  const router = useRouter();
  const campaign = state.campaigns.find((c) => c.slug === slug);
  const [error, setError] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const paying = useRef(false);
  if (!ready)
    return (
      <div
        role="status"
        className="mx-auto h-[500px] max-w-4xl animate-pulse rounded-2xl bg-muted"
      >
        <span className="sr-only">Loading donation page</span>
      </div>
    );
  if (!campaign)
    return (
      <Recovery title="This page could not be found">
        The link may be incorrect, or this campaign was removed from your local
        demo.
      </Recovery>
    );
  const draft = state.drafts[campaign.id];
  const availableSevas = state.masters.subcategories.filter(
    (s) =>
      campaign.sevaIds.includes(s.id) &&
      s.active &&
      state.masters.categories.some((c) => c.id === s.parentId && c.active),
  );
  const validSeva =
    !!draft &&
    availableSevas.some((s) => s.id === draft.sevaId) &&
    Number.isFinite(draft.amount) &&
    draft.amount > 0 &&
    (campaign.customAmount || campaign.amounts.includes(draft.amount));
  const availableBank = state.masters.banks.some(
    (b) => b.id === campaign.bankId && b.active,
  );
  const writable =
    campaign.status === "published" &&
    availableBank &&
    availableSevas.length > 0;
  const saveDraft = (patch: Partial<DonorDraft>) => {
    setError("");
    update((s) => ({
      ...s,
      drafts: {
        ...s.drafts,
        [campaign.id]: { ...(s.drafts[campaign.id] || emptyDraft()), ...patch },
      },
    }));
  };
  const begin = () => {
    if (
      !draft ||
      state.donations.some(
        (d) => d.id === draft.attemptId && d.status === "success",
      )
    )
      update((s) => ({
        ...s,
        drafts: { ...s.drafts, [campaign.id]: emptyDraft() },
      }));
    router.push(`/donate/${slug}/seva`);
  };
  const route = (next: string) => {
    setError("");
    router.push(`/donate/${slug}/${next}`);
  };
  const completed = draft
    ? state.donations.find(
        (d) => d.id === draft.attemptId && d.status === "success",
      )
    : undefined;
  function makePayment(success: boolean) {
    if (
      !campaign ||
      !draft ||
      !validSeva ||
      !validDetails(draft) ||
      !validAdditional(draft) ||
      !writable ||
      paying.current
    )
      return;
    if (completed) return route("success");
    paying.current = true;
    setBusy(true);
    if (!success) {
      update((s) => ({
        ...s,
        donations: [
          ...s.donations.filter((d) => d.id !== draft.attemptId),
          {
            ...draft,
            id: draft.attemptId,
            campaignId: campaign.id,
            date: new Date().toISOString(),
            status: "failed",
            receiptNumber: "—",
            organization: s.receipts.organization,
            organizationAddress: s.receipts.address,
            receiptFooter: s.receipts.footer,
          },
        ],
      }));
      setFailed(true);
      setBusy(false);
      paying.current = false;
      return;
    }
    update((s) => {
      if (
        s.donations.some(
          (d) => d.id === draft.attemptId && d.status === "success",
        )
      )
        return s;
      const sequence =
        s.donations.filter((d) => d.status === "success").length + 1;
      const receiptNumber = `${s.receipts.prefix}-${new Date().getFullYear()}-${String(sequence).padStart(4, "0")}-${draft.attemptId.slice(0, 4).toUpperCase()}`;
      const donation: Donation = {
        ...draft,
        id: draft.attemptId,
        campaignId: campaign.id,
        date: new Date().toISOString(),
        status: "success",
        receiptNumber,
        organization: s.receipts.organization,
        organizationAddress: s.receipts.address,
        receiptFooter: s.receipts.footer,
      };
      return {
        ...s,
        donations: [
          ...s.donations.filter((d) => d.id !== draft.attemptId),
          donation,
        ],
      };
    });
    notify("Your demo donation is complete. Thank you for your kindness.");
    route("success");
  }
  if (step === "landing") {
    const paid = state.donations.filter(
      (d) => d.campaignId === campaign.id && d.status === "success",
    );
    const raised = paid.reduce((s, d) => s + d.amount, 0);
    return (
      <>
        <div className="mb-6 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span>Anand Gaushala</span>
          <ChevronRight className="size-3" />
          <span>Give with a purpose</span>
        </div>
        {campaign.status === "draft" && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Draft preview · This page is not accepting donations yet.
          </div>
        )}
        <div className="grid items-start gap-8 lg:grid-cols-[1.45fr_1fr]">
          <div>
            <div className="relative overflow-hidden rounded-2xl">
              <CampaignArt
                variant={campaign.banner}
                image={
                  state.masters.banners.find((b) => b.id === campaign.banner)
                    ?.image
                }
                className="h-[270px] sm:h-[380px]"
              />
              <span className="absolute left-5 top-5">
                <Badge tone="green">
                  <Leaf className="size-3" />
                  Care for every life
                </Badge>
              </span>
            </div>
            <div className="mt-7">
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-primary">
                Rooted in kindness
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-[42px]">
                {campaign.title}
              </h1>
              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                {campaign.description}
              </p>
              <h2 className="mb-4 mt-8 text-lg font-semibold tracking-tight">
                Your kindness finds its purpose.
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {availableSevas.map((s, i) => {
                  const Icon = [Sprout, Heart, ShieldCheck][i % 3];
                  return (
                    <Card key={s.id} className="p-4">
                      <Icon
                        className="mb-3 size-5 text-primary"
                        strokeWidth={1.5}
                      />
                      <h3 className="text-xs font-semibold">{s.name}</h3>
                      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                        {s.detail}
                      </p>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="space-y-4 lg:sticky lg:top-8">
            <Card className="p-6 sm:p-7">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                <Heart className="size-3.5" />A kinder tomorrow starts here
              </span>
              <div className="mt-6 flex items-baseline gap-2">
                <p className="text-3xl font-semibold tracking-tight">
                  {money(raised)}
                </p>
                <span className="text-xs text-muted-foreground">raised</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                of {money(campaign.target)} goal
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.min(100, (raised / campaign.target) * 100)}%`,
                  }}
                />
              </div>
              <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                <span>{paid.length} acts of kindness</span>
                <span>
                  {Math.round((raised / campaign.target) * 100)}% funded
                </span>
              </div>
              <div className="my-6 border-t" />
              <h2 className="text-lg font-semibold tracking-tight">
                Be a part of their story.
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Every contribution, big or small, brings nourishment and comfort
                to a life in our care.
              </p>
              <Button
                className="mt-6 h-12 w-full gap-3 text-sm"
                disabled={!writable}
                onClick={begin}
              >
                Make a contribution <ArrowRight className="size-4" />
              </Button>
              {!writable && (
                <p className="mt-3 text-xs text-amber-700">
                  {campaign.status === "draft"
                    ? "Publish this page from the admin workspace to enable demo donations."
                    : "Donations are paused. An active seva and bank account are required."}
                </p>
              )}
              <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                <LockKeyhole className="size-3" />
                Demo experience · No actual payment
              </p>
            </Card>
            <div className="flex gap-3 rounded-xl border border-dashed p-4">
              <Sprout className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-medium">
                  Giving, with peace of mind.
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Receive an instant demo receipt. Your sample details stay in
                  this browser.
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  if (!steps.includes(step))
    return (
      <Recovery title="This step could not be found" slug={slug}>
        Start again from seva selection.
      </Recovery>
    );
  if (step === "success") {
    if (!completed)
      return (
        <Recovery title="No completed donation yet" slug={slug}>
          Complete a demo payment to see your receipt.
        </Recovery>
      );
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-7 text-center print:hidden">
          <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-[#e9efe3] text-primary">
            <CheckCircle2 className="size-8" strokeWidth={1.5} />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-primary">
            Kindness received
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            You made a difference, {completed.name.split(" ")[0]}.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Thank you for being a part of their story.
            <br />
            Your demo donation has been recorded.
          </p>
        </div>
        <Card className="receipt-card p-6 sm:p-9">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Flower2 className="mb-3 size-8 text-primary" />
              <h2 className="text-xl font-semibold">
                {completed.organization}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {completed.organizationAddress}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {completed.receiptNumber}
              </p>
            </div>
            <Badge tone="orange">Demo receipt</Badge>
          </div>
          <div className="my-6 border-t border-dashed" />
          <div className="grid grid-cols-2 gap-5 text-xs">
            <div>
              <p className="text-muted-foreground">Received from</p>
              <p className="mt-2 font-medium">{completed.name}</p>
              <p className="mt-1 break-all text-muted-foreground">
                {completed.email}
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Date</p>
              <p className="mt-2">{dateLabel(completed.date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">For</p>
              <p className="mt-2 font-medium">{campaign.title}</p>
              <p className="mt-1 text-muted-foreground">
                {
                  state.masters.subcategories.find(
                    (s) => s.id === completed.sevaId,
                  )?.name
                }
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Contribution</p>
              <p className="mt-2 text-2xl font-semibold text-primary">
                {money(completed.amount)}
              </p>
            </div>
          </div>
          <div className="my-6 border-t border-dashed" />
          <p className="text-center text-sm text-muted-foreground">
            {completed.receiptFooter}
          </p>
          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            Demo only · No funds collected · Not a valid tax receipt
          </p>
        </Card>
        <div className="mt-5 flex flex-wrap justify-center gap-3 print:hidden">
          <Button onClick={() => downloadReceipt(completed)}>
            <Download className="size-4" />
            Download receipt
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print receipt
          </Button>
        </div>
        <div className="mt-7 text-center print:hidden">
          <button
            className="text-xs font-medium text-primary hover:underline"
            onClick={begin}
          >
            Make another contribution{" "}
            <ArrowRight className="ml-1 inline size-3" />
          </button>
        </div>
      </div>
    );
  }
  if (!writable)
    return (
      <Recovery title="This page is not accepting donations" slug={undefined}>
        This campaign is a draft or its donation settings are currently
        inactive. You can still return to its{" "}
        <Link href={`/donate/${slug}`} className="text-primary underline">
          preview
        </Link>
        .
      </Recovery>
    );
  if (completed)
    return (
      <Recovery
        title="This contribution is already complete"
        slug={slug}
        onRestart={begin}
      >
        You can{" "}
        <Link
          href={`/donate/${slug}/success`}
          className="font-medium text-primary underline"
        >
          view your receipt
        </Link>
        , or{" "}
        <button className="font-medium text-primary underline" onClick={begin}>
          start a new contribution
        </button>
        .
      </Recovery>
    );
  const index = steps.indexOf(step);
  if (step !== "seva" && !draft)
    return (
      <Recovery title="Let’s start with your seva" slug={slug}>
        We couldn’t find donation progress in this browser.
      </Recovery>
    );
  if (index > 0 && !validSeva)
    return (
      <Recovery title="Choose a seva and amount first" slug={slug}>
        Your selected seva or amount is missing or is no longer available.
      </Recovery>
    );
  if (index > 1 && draft && !validDetails(draft))
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <h1 className="text-xl font-semibold">
          Your details need a little attention
        </h1>
        <p className="my-4 text-sm text-muted-foreground">
          Enter a name, valid email, and 10-digit Indian mobile number.
        </p>
        <Link className={buttonVariants()} href={`/donate/${slug}/details`}>
          Return to donor details
        </Link>
      </Card>
    );
  if (index > 2 && draft && !validAdditional(draft))
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <h1 className="text-xl font-semibold">
          Complete your additional details
        </h1>
        <p className="my-4 text-sm text-muted-foreground">
          Check the optional PAN and occasion details before continuing.
        </p>
        <Link className={buttonVariants()} href={`/donate/${slug}/additional`}>
          Return to additional details
        </Link>
      </Card>
    );
  const d = draft;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (step === "seva" && !validSeva)
      return setError("Choose a seva and a positive donation amount.");
    if (step === "details" && d && !validDetails(d))
      return setError(
        "Enter your name, a valid email, and a 10-digit Indian mobile number beginning with 6–9.",
      );
    if (step === "additional" && d && !validAdditional(d))
      return setError(
        "Enter a valid PAN (e.g. ABCDE1234F) when requesting a tax receipt, and a date if an occasion is selected.",
      );
    route(steps[index + 1]);
  };
  return (
    <>
      <Link
        href={`/donate/${slug}`}
        className="mb-6 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        {campaign.title}
      </Link>
      <div className="mx-auto mb-8 flex max-w-2xl items-center justify-between gap-1">
        {stepLabels.slice(0, 5).map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-1">
            <div className="flex flex-col items-center gap-2">
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full border text-[10px]",
                  index >= i
                    ? "border-primary bg-primary text-white"
                    : "bg-white text-muted-foreground",
                )}
              >
                {index > i ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden whitespace-nowrap text-[9px] sm:block",
                  i === index
                    ? "font-medium text-primary"
                    : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {i < 4 && (
              <span
                className={cn(
                  "mx-1 mb-0 h-px flex-1 sm:mb-5",
                  index > i ? "bg-primary/40" : "bg-border",
                )}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mx-auto grid max-w-4xl items-start gap-6 lg:grid-cols-[1fr_280px]">
        <Card className="p-5 sm:p-8">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-primary">
            Step {index + 1} of 5
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {
              [
                "Choose your act of kindness",
                "A little about you",
                "Make it more meaningful",
                "A moment to review",
                "Complete your contribution",
              ][index]
            }
          </h1>
          <p className="mb-7 mt-2 text-xs leading-relaxed text-muted-foreground">
            {
              [
                "Every seva makes a difference. Choose one close to your heart.",
                "Use sample personal details. They are saved only in this browser.",
                "Celebrate a moment or dedicate your contribution. These details are optional.",
                "Make sure everything looks right before your demo payment.",
                "This is a simulation. No money will be charged or transferred.",
              ][index]
            }
          </p>
          <form onSubmit={submit} className="space-y-5">
            {step === "seva" && (
              <>
                <fieldset>
                  <legend className="mb-3 text-sm font-medium">
                    Choose a seva *
                  </legend>
                  <div className="space-y-3">
                    {availableSevas.map((s, i) => {
                      const Icon = [Sprout, Heart, ShieldCheck][i % 3];
                      return (
                        <label
                          key={s.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition",
                            d?.sevaId === s.id
                              ? "border-primary bg-primary/5"
                              : "hover:border-primary/40",
                          )}
                        >
                          <span className="grid size-9 place-items-center rounded-lg bg-[#eef1e6] text-primary">
                            <Icon className="size-4" />
                          </span>
                          <span className="flex-1">
                            <span className="text-xs font-medium">
                              {s.name}
                            </span>
                            <span className="mt-1 block text-[10px] text-muted-foreground">
                              {s.detail}
                            </span>
                          </span>
                          <input
                            type="radio"
                            name="seva"
                            className="accent-primary"
                            checked={d?.sevaId === s.id}
                            onChange={() => saveDraft({ sevaId: s.id })}
                          />
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="mb-3 text-sm font-medium">
                    Your contribution *
                  </legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {campaign.amounts.map((amount) => (
                      <button
                        type="button"
                        key={amount}
                        onClick={() => saveDraft({ amount })}
                        className={cn(
                          "rounded-lg border px-3 py-3 text-xs font-medium transition",
                          d?.amount === amount
                            ? "border-primary bg-primary/5 text-primary"
                            : "hover:border-primary/40",
                        )}
                      >
                        {money(amount)}
                      </button>
                    ))}
                  </div>
                </fieldset>
                {campaign.customAmount && (
                  <Field label="Or enter a custom amount (₹)">
                    <Input
                      aria-label="Custom donation amount"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Enter an amount"
                      value={d?.amount || ""}
                      onChange={(e) =>
                        saveDraft({ amount: Number(e.target.value) })
                      }
                    />
                  </Field>
                )}
              </>
            )}
            {step === "details" && d && (
              <>
                <Field label="Full name *">
                  <Input
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="e.g. Aarav Sharma"
                    value={d.name}
                    onChange={(e) => saveDraft({ name: e.target.value })}
                  />
                </Field>
                <Field label="Email address *">
                  <Input
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={150}
                    placeholder="aarav@example.com"
                    value={d.email}
                    onChange={(e) => saveDraft({ email: e.target.value })}
                  />
                </Field>
                <Field
                  label="Mobile number *"
                  hint="10-digit Indian mobile number, without +91."
                >
                  <Input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    required
                    pattern="[6-9][0-9]{9}"
                    maxLength={10}
                    placeholder="9876543210"
                    value={d.mobile}
                    onChange={(e) =>
                      saveDraft({ mobile: e.target.value.replace(/\D/g, "") })
                    }
                  />
                </Field>
                <Field label="Address (optional)">
                  <Textarea
                    autoComplete="street-address"
                    maxLength={300}
                    placeholder="Your address"
                    value={d.address}
                    onChange={(e) => saveDraft({ address: e.target.value })}
                  />
                </Field>
              </>
            )}
            {step === "additional" && d && (
              <>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-primary"
                    checked={d.wantsTax}
                    onChange={(e) =>
                      saveDraft({
                        wantsTax: e.target.checked,
                        pan: e.target.checked ? d.pan : "",
                      })
                    }
                  />
                  <span>
                    <span className="text-sm font-medium">
                      Request tax receipt details (80G)
                    </span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                      Demo only. This does not establish eligibility or generate
                      a valid tax document.
                    </span>
                  </span>
                </label>
                {d.wantsTax && (
                  <Field label="PAN *">
                    <Input
                      required
                      pattern="[A-Z]{5}[0-9]{4}[A-Z]"
                      maxLength={10}
                      placeholder="ABCDE1234F"
                      value={d.pan}
                      onChange={(e) =>
                        saveDraft({ pan: e.target.value.toUpperCase() })
                      }
                    />
                  </Field>
                )}
                <Field label="An occasion (optional)">
                  <Select
                    value={d.occasionId}
                    onChange={(e) =>
                      saveDraft({
                        occasionId: e.target.value,
                        occasionDate: e.target.value ? d.occasionDate : "",
                      })
                    }
                  >
                    <option value="">No occasion</option>
                    {state.masters.occasions
                      .filter((o) => o.active)
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                  </Select>
                </Field>
                {d.occasionId && (
                  <Field label="Occasion date *">
                    <Input
                      required
                      type="date"
                      value={d.occasionDate}
                      onChange={(e) =>
                        saveDraft({ occasionDate: e.target.value })
                      }
                    />
                  </Field>
                )}
                <Field label="A message from the heart (optional)">
                  <Textarea
                    maxLength={500}
                    value={d.message}
                    placeholder="Share a dedication or a few kind words…"
                    onChange={(e) => saveDraft({ message: e.target.value })}
                  />
                </Field>
              </>
            )}
            {step === "review" && d && (
              <>
                <ReviewSection title="Your seva" href={`/donate/${slug}/seva`}>
                  <p>
                    {
                      state.masters.subcategories.find((s) => s.id === d.sevaId)
                        ?.name
                    }
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-primary">
                    {money(d.amount)}
                  </p>
                </ReviewSection>
                <ReviewSection
                  title="Your details"
                  href={`/donate/${slug}/details`}
                >
                  <p>{d.name}</p>
                  <p className="mt-1 break-all text-muted-foreground">
                    {d.email}
                  </p>
                  <p className="mt-1 text-muted-foreground">+91 {d.mobile}</p>
                  {d.address && (
                    <p className="mt-1 text-muted-foreground">{d.address}</p>
                  )}
                </ReviewSection>
                <ReviewSection
                  title="Additional details"
                  href={`/donate/${slug}/additional`}
                >
                  <p>
                    {d.wantsTax
                      ? `Tax receipt requested · PAN ${d.pan.slice(0, 2)}••••••${d.pan.slice(-2)}`
                      : "No tax receipt requested"}
                  </p>
                  {d.occasionId && (
                    <p className="mt-1 text-muted-foreground">
                      {
                        state.masters.occasions.find(
                          (o) => o.id === d.occasionId,
                        )?.name
                      }{" "}
                      · {dateLabel(d.occasionDate)}
                    </p>
                  )}
                  {d.message && (
                    <p className="mt-2 break-words text-muted-foreground">
                      “{d.message}”
                    </p>
                  )}
                </ReviewSection>
              </>
            )}
            {step === "payment" && d && (
              <>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold text-amber-800">
                    Demo payment — no money collected
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-amber-800/80">
                    Try a successful or failed payment below. Do not enter any
                    bank or card details.
                  </p>
                </div>
                <div className="rounded-xl border p-5">
                  <Wallet className="mb-3 size-6 text-primary" />
                  <p className="text-xs text-muted-foreground">
                    Your contribution
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-primary">
                    {money(d.amount)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    For {campaign.title}
                  </p>
                </div>
                {failed && (
                  <div
                    role="alert"
                    className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
                  >
                    <XCircle className="size-5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">
                        The demo payment failed.
                      </p>
                      <p className="mt-1 text-xs">
                        Your details are safe. Try again using the success
                        button.
                      </p>
                    </div>
                  </div>
                )}
                <Button
                  type="button"
                  className="h-11 w-full"
                  disabled={busy}
                  onClick={() => makePayment(true)}
                >
                  {busy ? "Completing…" : "Simulate successful payment"}
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full"
                  disabled={busy}
                  onClick={() => makePayment(false)}
                >
                  Simulate failed payment
                </Button>
              </>
            )}
            <ErrorMessage>{error}</ErrorMessage>
            <div className="flex items-center justify-between gap-3 border-t pt-5">
              <Link
                href={
                  index > 0
                    ? `/donate/${slug}/${steps[index - 1]}`
                    : `/donate/${slug}`
                }
                className={buttonVariants({ variant: "ghost" })}
              >
                <ArrowLeft className="size-3.5" />
                Back
              </Link>
              {step !== "payment" && (
                <Button type="submit" className="h-10 px-5">
                  {step === "review" ? "Continue to demo payment" : "Continue"}
                  <ArrowRight className="size-4" />
                </Button>
              )}
            </div>
          </form>
        </Card>
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CampaignArt
              variant={campaign.banner}
              image={
                state.masters.banners.find((b) => b.id === campaign.banner)
                  ?.image
              }
              className="h-32"
            />
            <div className="p-5">
              <p className="text-[9px] uppercase tracking-widest text-primary">
                You’re making a difference
              </p>
              <h2 className="mt-2 text-base font-semibold tracking-tight">
                {campaign.title}
              </h2>
              <p className="mt-3 line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">
                {campaign.description}
              </p>
              {d?.amount ? (
                <div className="mt-4 border-t pt-4">
                  <p className="text-[10px] text-muted-foreground">
                    Your contribution
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-primary">
                    {money(d.amount)}
                  </p>
                </div>
              ) : null}
            </div>
          </Card>
          <div className="flex gap-2 px-2 text-[10px] leading-relaxed text-muted-foreground">
            <LockKeyhole className="mt-0.5 size-3.5 shrink-0" />
            Your sample details stay in this browser. This is a demo, with no
            real payments.
          </div>
        </div>
      </div>
    </>
  );
}
function ReviewSection({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b pb-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        <Link
          href={href}
          className="text-xs font-medium text-primary hover:underline"
        >
          Edit
        </Link>
      </div>
      <div className="text-sm">{children}</div>
    </section>
  );
}
