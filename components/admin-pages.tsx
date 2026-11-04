"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  FilePenLine,
  ImagePlus,
  Search,
} from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { PageHeading, CreatePageButton } from "@/components/admin-shell";
import {
  Card,
  Badge,
  EmptyState,
  Field,
  Input,
  Select,
  Textarea,
  ErrorMessage,
} from "@/components/ui/kit";
import { Button, buttonVariants } from "@/components/ui/button";
import { CampaignArt } from "@/components/campaign-art";
import { dateLabel, money, slugify, uid, type Campaign } from "@/lib/demo";
import { cn } from "@/lib/utils";
import { activeSevas, campaignRaised } from "@/lib/donations";

export function DonationPages() {
  const { state, notify } = useDemo();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const campaigns = state.campaigns.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) &&
      (!status || c.status === status),
  );
  return (
    <>
      <PageHeading
        title="Pages with a purpose"
        description="Create a space for your community to come together and give."
        action={<CreatePageButton />}
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            aria-label="Search donation pages"
            placeholder="Search donation pages…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white pl-9"
          />
        </div>
        <Select
          className="w-40 bg-white"
          aria-label="Campaign status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All pages</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </Select>
      </div>
      {campaigns.length ? (
        <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((c) => {
            const donations = state.donations.filter(
              (d) => d.campaignId === c.id && d.status === "success",
            );
            const raised = campaignRaised(state, c);
            return (
              <Card key={c.id} className="overflow-hidden">
                <div className="relative">
                  <CampaignArt
                    variant={c.banner}
                    image={
                      state.masters.banners.find((b) => b.id === c.banner)
                        ?.image
                    }
                    className="h-44"
                  />
                  <span className="absolute left-4 top-4">
                    <Badge
                      tone={c.status === "published" ? "green" : "neutral"}
                    >
                      {c.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-[10px] text-muted-foreground">
                    Created {dateLabel(c.createdAt)}
                  </p>
                  <h2 className="mt-2 text-base font-semibold tracking-tight">
                    {c.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-relaxed text-muted-foreground">
                    {c.description}
                  </p>
                  <div className="mb-2 mt-5 flex items-baseline justify-between">
                    <span className="text-lg font-semibold">
                      {money(raised)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      of {money(c.target)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.min(100, (raised / c.target) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                    <span>{donations.length} contributions</span>
                    <span>{Math.round((raised / c.target) * 100)}% funded</span>
                  </div>
                  <div className="mt-5 flex items-center gap-2 border-t pt-4">
                    <Link
                      href={`/admin/pages/${c.id}/edit`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "flex-1",
                      )}
                    >
                      <FilePenLine className="size-3.5" />
                      Edit page
                    </Link>
                    <Link
                      href={`/donate/${c.slug}`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "flex-1",
                      )}
                    >
                      <ExternalLink className="size-3.5" />
                      Preview
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Copy link to ${c.title}`}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            `${location.origin}/donate/${c.slug}`,
                          );
                          notify("Donation page link copied.");
                        } catch {
                          notify(
                            "Copy is unavailable in this browser. Open the preview and copy its address.",
                          );
                        }
                      }}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState title="No donation pages found">
            Try a different search or create a new page.
          </EmptyState>
        </Card>
      )}
    </>
  );
}
export function CampaignForm({ id }: { id?: string }) {
  const { state, update, notify } = useDemo();
  const router = useRouter();
  const existing = state.campaigns.find((c) => c.id === id);
  const [form, setForm] = useState<Campaign>(
    () =>
      existing || {
        id: "",
        slug: "",
        title: "",
        description: "",
        target: 100000,
        sevaIds: [],
        amounts: [501, 1100, 2100, 5100],
        customAmount: true,
        bankId: state.masters.banks.find((b) => b.active)?.id || "",
        status: "draft",
        banner: state.masters.banners.find((b) => b.active)?.id || "meadow",
        createdAt: "",
        openingBalance: 0,
        defaultSevaId: "",
      },
  );
  const [amountText, setAmountText] = useState(form.amounts.join(", "));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const change = <K extends keyof Campaign>(key: K, value: Campaign[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  if (id && !existing)
    return (
      <Card>
        <EmptyState title="This donation page could not be found">
          <Link className="text-primary underline" href="/admin/pages">
            Back to donation pages
          </Link>
        </EmptyState>
      </Card>
    );
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const amounts = [
      ...new Set(amountText.split(",").map((a) => Number(a.trim()))),
    ];
    if (!form.title.trim() || !form.description.trim())
      return setError("Add a campaign title and description.");
    if (!Number.isFinite(form.target) || form.target <= 0)
      return setError("Enter a target amount greater than zero.");
    const balance = form.openingBalance ?? 0;
    if (!Number.isFinite(balance) || balance < 0 || !Number.isSafeInteger(Math.round(balance * 100)) || Math.abs(balance * 100 - Math.round(balance * 100)) > 0.00001)
      return setError("Previously collected amount must be zero or greater, with at most two decimal places.");
    if (form.defaultSevaId && !activeSevas(state, form).some((seva) => seva.id === form.defaultSevaId))
      return setError("Choose an active default seva available on this page, or use the first available seva.");
    if (!form.sevaIds.length)
      return setError("Choose at least one seva for this page.");
    if (
      !amountText.trim() ||
      amounts.some((a) => !Number.isFinite(a) || a <= 0)
    )
      return setError("Enter positive suggested amounts separated by commas.");
    if (
      !form.bankId ||
      !state.masters.banks.some((b) => b.id === form.bankId && b.active)
    )
      return setError(
        "Choose an active bank account. You can add one in Masters.",
      );
    if (
      form.status === "published" &&
      !form.sevaIds.some((s) =>
        state.masters.subcategories.some(
          (m) =>
            m.id === s &&
            m.active &&
            state.masters.categories.some(
              (cat) => cat.id === m.parentId && cat.active,
            ),
        ),
      )
    )
      return setError(
        "A published page needs at least one seva with an active category.",
      );
    const base = existing?.slug || slugify(form.title) || "donation-page";
    let slug = base;
    let suffix = 2;
    while (state.campaigns.some((c) => c.slug === slug && c.id !== id))
      slug = `${base}-${suffix++}`;
    const campaign = {
      ...form,
      id: existing?.id || uid(),
      title: form.title.trim(),
      description: form.description.trim(),
      slug,
      amounts: amounts.sort((a, b) => a - b),
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    setSaving(true);
    update((s) => ({
      ...s,
      campaigns: existing
        ? s.campaigns.map((c) => (c.id === id ? campaign : c))
        : [campaign, ...s.campaigns],
    }));
    notify(
      existing ? "Donation page updated." : "Your donation page is ready.",
    );
    router.push("/admin/pages");
  }
  return (
    <>
      <Link
        href="/admin/pages"
        className="mb-5 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        Donation pages
      </Link>
      <PageHeading
        title={
          existing ? "Make your page shine" : "Create something meaningful"
        }
        description="A thoughtful page is the first step towards a generous contribution."
        action={
          existing && (
            <Link
              href={`/donate/${existing.slug}`}
              className={buttonVariants({ variant: "outline" })}
            >
              Preview page <ArrowUpRight className="size-4" />
            </Link>
          )
        }
      />
      <form
        onSubmit={save}
        className="grid items-start gap-6 xl:grid-cols-[1fr_320px]"
      >
        <div className="space-y-5">
          <Card className="space-y-5 p-6">
            <div>
              <h2 className="text-sm font-semibold">
                The story behind your page
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Help donors understand the difference they can make.
              </p>
            </div>
            <Field label="Campaign title *">
              <Input
                required
                maxLength={100}
                placeholder="Give your campaign a meaningful name"
                value={form.title}
                onChange={(e) => change("title", e.target.value)}
              />
            </Field>
            <Field label="Description *">
              <Textarea
                required
                maxLength={2000}
                rows={4}
                placeholder="Share your purpose and how contributions will help…"
                value={form.description}
                onChange={(e) => change("description", e.target.value)}
              />
            </Field>
            <Field label="Banner">
              <Select
                value={form.banner}
                onChange={(e) => change("banner", e.target.value)}
              >
                {state.masters.banners
                  .filter((b) => b.active || b.id === form.banner)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ImagePlus className="size-3.5" />
              Upload and manage banners in{" "}
              <Link
                href="/admin/masters?tab=banners"
                className="font-medium text-primary underline"
              >
                Masters
              </Link>
              .
            </p>
          </Card>
          <Card className="space-y-5 p-6">
            <div>
              <h2 className="text-sm font-semibold">Donation preferences</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Give every donor a way to contribute.
              </p>
            </div>
            <Field label="Fundraising target (₹) *">
              <Input
                type="number"
                min="1"
                step="1"
                required
                value={form.target || ""}
                onChange={(e) => change("target", Number(e.target.value))}
              />
            </Field>
            <Field label="Previously collected amount (₹)" hint="Opening balance from earlier collections. Completed donations recorded here are added automatically; this balance creates no donor records or receipts.">
              <Input type="number" min="0" step="0.01" value={form.openingBalance ?? 0} onChange={(event) => change("openingBalance", Number(event.target.value))} />
            </Field>
            <fieldset>
              <legend className="mb-3 text-sm font-medium">
                Available sevas *
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {state.masters.subcategories
                  .filter((s) => s.active || form.sevaIds.includes(s.id))
                  .map((s) => (
                    <label
                      key={s.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-xs",
                        form.sevaIds.includes(s.id) &&
                          "border-primary/50 bg-primary/5",
                      )}
                    >
                      <input
                        className="mt-0.5 accent-primary"
                        type="checkbox"
                        checked={form.sevaIds.includes(s.id)}
                        onChange={(e) =>
                          change(
                            "sevaIds",
                            e.target.checked
                              ? [...form.sevaIds, s.id]
                              : form.sevaIds.filter((v) => v !== s.id),
                          )
                        }
                      />
                      <span>
                        <span className="font-medium">
                          {s.name}
                          {!s.active && " (inactive)"}
                        </span>
                        <span className="mt-1 block text-[10px] leading-relaxed text-muted-foreground">
                          {s.detail}
                        </span>
                      </span>
                    </label>
                  ))}
              </div>
            </fieldset>
            <Field label="Default seva" hint="Automatically selected for new donations. If unavailable, the first active seva is selected.">
              <Select value={form.defaultSevaId || ""} onChange={(event) => change("defaultSevaId", event.target.value)}>
                <option value="">First available active seva</option>
                {activeSevas(state, form).map((seva) => <option key={seva.id} value={seva.id}>{seva.name}</option>)}
                {form.defaultSevaId && !activeSevas(state, form).some((seva) => seva.id === form.defaultSevaId) && <option value={form.defaultSevaId} disabled>Previously selected seva (unavailable)</option>}
              </Select>
            </Field>
            <Field
              label="Suggested amounts (₹) *"
              hint="Separate amounts with commas, for example: 501, 1100, 2100."
            >
              <Input
                required
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
              />
            </Field>
            <label className="flex items-center gap-3 text-sm">
              <input
                className="size-4 accent-primary"
                type="checkbox"
                checked={form.customAmount}
                onChange={(e) => change("customAmount", e.target.checked)}
              />
              Allow donors to enter a custom amount
            </label>
            <Field label="Bank account *" hint="Default account when the chosen seva and its category have no active bank mapping.">
              <Select
                required
                value={form.bankId}
                onChange={(e) => change("bankId", e.target.value)}
              >
                <option value="">Select a bank account</option>
                {state.masters.banks
                  .filter((b) => b.active || b.id === form.bankId)
                  .map((b) => (
                    <option key={b.id} value={b.id} disabled={!b.active}>
                      {b.name} · {b.detail}
                    </option>
                  ))}
              </Select>
            </Field>
          </Card>
          <ErrorMessage>{error}</ErrorMessage>
          <div className="mb-6 flex justify-end gap-3">
            <Link
              href="/admin/pages"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Cancel
            </Link>
            <Button size="lg" type="submit" disabled={saving}>
              <Check className="size-4" />
              {saving
                ? "Saving…"
                : existing
                  ? "Save changes"
                  : "Create donation page"}
            </Button>
          </div>
        </div>
        <div className="space-y-5 xl:sticky xl:top-24">
          <Card className="overflow-hidden">
            <div className="border-b px-5 py-4 text-xs font-medium">
              Live card preview
            </div>
            <CampaignArt
              variant={form.banner}
              image={
                state.masters.banners.find((b) => b.id === form.banner)?.image
              }
              className="h-44"
            />
            <div className="p-5">
              <Badge tone={form.status === "published" ? "green" : "neutral"}>
                {form.status === "published" ? "Published" : "Draft"}
              </Badge>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">
                {form.title || "Your campaign title"}
              </h3>
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                {form.description ||
                  "Your story starts here. Tell your community how their kindness will help."}
              </p>
              <p className="mt-5 text-xs text-muted-foreground">
                Collected <span className="font-semibold text-foreground">{money(campaignRaised(state, form))}</span> · {" "}
                Goal{" "}
                <span className="font-semibold text-foreground">
                  {money(form.target || 0)}
                </span>
              </p>
            </div>
          </Card>
          <Card className="space-y-3 p-5">
            <h2 className="text-sm font-semibold">Page visibility</h2>
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) =>
                  change("status", e.target.value as Campaign["status"])
                }
              >
                <option value="draft">Draft — preview only</option>
                <option value="published">
                  Published — accept demo donations
                </option>
              </Select>
            </Field>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Published pages are available in this browser demo. No real
              payments are collected.
            </p>
          </Card>
        </div>
      </form>
    </>
  );
}
