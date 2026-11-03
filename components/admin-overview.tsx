"use client";

import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Heart,
  PanelTop,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useDemo } from "@/components/demo-provider";
import { Card, Badge, Table, Select, EmptyState } from "@/components/ui/kit";
import { Button } from "@/components/ui/button";
import { CreatePageButton, PageHeading } from "@/components/admin-shell";
import { CampaignArt } from "@/components/campaign-art";
import {
  money,
  dateLabel,
  dateKey,
  downloadFile,
  type Donation,
} from "@/lib/demo";
import { cn } from "@/lib/utils";

export function DonationTable({ donations }: { donations: Donation[] }) {
  const { state } = useDemo();
  if (!donations.length) return <EmptyState title="No donations found" />;
  return (
    <Table>
      <thead>
        <tr>
          <th>DONOR</th>
          <th>CAMPAIGN / SEVA</th>
          <th>DATE</th>
          <th>AMOUNT</th>
          <th>STATUS</th>
        </tr>
      </thead>
      <tbody>
        {donations.map((d) => (
          <tr key={d.id}>
            <td>
              <div className="flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#eef0e7] text-[10px] font-semibold text-primary">
                  {d.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div>
                  <p className="text-xs font-medium">{d.name}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {d.email}
                  </p>
                </div>
              </div>
            </td>
            <td>
              <p className="max-w-52 truncate text-xs">
                {state.campaigns.find((c) => c.id === d.campaignId)?.title ||
                  "Campaign"}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {state.masters.subcategories.find((s) => s.id === d.sevaId)
                  ?.name || "Seva"}
              </p>
            </td>
            <td className="text-xs text-muted-foreground">
              {dateLabel(d.date)}
            </td>
            <td className="text-xs font-semibold tabular-nums">
              {money(d.amount)}
            </td>
            <td>
              <Badge
                tone={
                  d.status === "success"
                    ? "green"
                    : d.status === "failed"
                      ? "red"
                      : "orange"
                }
              >
                <span className="size-1 rounded-full bg-current" />
                {d.status === "success"
                  ? "Completed"
                  : d.status === "failed"
                    ? "Failed"
                    : "Pending"}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
export function exportDonations(donations: Donation[]) {
  const cell = (value: string | number) =>
    `"${String(value)
      .replace(/^[=+@-]/, "'$&")
      .replace(/"/g, '""')}"`;
  const csv = [
    [
      "Receipt",
      "Donor",
      "Email",
      "Campaign ID",
      "Seva ID",
      "Date",
      "Amount INR",
      "Status",
    ],
    ...donations.map((d) => [
      d.receiptNumber,
      d.name,
      d.email,
      d.campaignId,
      d.sevaId,
      d.date,
      d.amount,
      d.status,
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
  downloadFile("anand-donations.csv", "\uFEFF" + csv, "text/csv;charset=utf-8");
}
export function Overview() {
  const { state } = useDemo();
  const [period, setPeriod] = useState("all");
  const donations = [...state.donations].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const filtered = donations.filter(
    (d) =>
      period === "all" ||
      new Date(d.date).getTime() >= Date.now() - Number(period) * 86400000,
  );
  const paid = filtered.filter((d) => d.status === "success");
  const total = paid.reduce((sum, d) => sum + d.amount, 0);
  const donors = new Set(paid.map((d) => d.email.toLowerCase())).size;
  const chart = useMemo(() => {
    const buckets = Array.from({ length: 12 }, (_, i) => ({
      label: `${i + 1}`,
      amount: 0,
    }));
    paid.forEach((d) => {
      const index = Math.min(
        11,
        Math.floor((new Date(d.date).getUTCDate() - 1) / 3),
      );
      buckets[index].amount += d.amount;
    });
    return buckets;
  }, [paid]);
  const max = Math.max(...chart.map((b) => b.amount), 1);
  const stats = [
    {
      label: "Total donations",
      value: money(total),
      icon: CircleDollarSign,
      note: "Successfully collected",
      color: "bg-[#edf2e9]",
    },
    {
      label: "Generous donors",
      value: donors.toLocaleString("en-IN"),
      icon: Users,
      note: "People making a difference",
      color: "bg-[#f8f0e2]",
    },
    {
      label: "Active campaigns",
      value: state.campaigns.filter((c) => c.status === "published").length,
      icon: PanelTop,
      note: "Open for contributions",
      color: "bg-[#edf0f7]",
    },
    {
      label: "Average donation",
      value: money(paid.length ? total / paid.length : 0),
      icon: Heart,
      note: "Every contribution matters",
      color: "bg-[#f7ece8]",
    },
  ];
  return (
    <>
      <PageHeading
        title="A little care goes a long way."
        description="Welcome back, Anand. Here’s the difference your community is making."
        action={<CreatePageButton />}
      />
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary" />
          Your impact, at a glance{" "}
          <span className="ml-2 rounded bg-[#f0e9d9] px-2 py-1 text-[10px] text-[#987436]">
            Sample data
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" />
          <Select
            aria-label="Dashboard period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-8 w-36 bg-white text-xs"
          >
            <option value="all">All time</option>
            <option value="30">Last 30 days</option>
            <option value="7">Last 7 days</option>
          </Select>
        </div>
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, note, color }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{label}</p>
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-lg text-primary",
                  color,
                )}
              >
                <Icon className="size-4" strokeWidth={1.7} />
              </span>
            </div>
            <p className="mt-3 text-[28px] font-semibold tracking-tight tabular-nums">
              {value}
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="size-1 rounded-full bg-primary/60" />
              {note}
            </p>
          </Card>
        ))}
      </div>
      <div className="mb-6 grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold">
                A growing circle of kindness
              </h2>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Successful contributions by day of the month
              </p>
            </div>
            <span className="flex h-6 items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="size-2 rounded-sm bg-primary" />
              Donations
            </span>
          </div>
          <div className="mt-7 flex gap-3">
            <div className="flex h-44 flex-col justify-between pb-0 text-[9px] text-muted-foreground">
              <span>{money(max)}</span>
              <span>{money(max / 2)}</span>
              <span>₹0</span>
            </div>
            <div className="relative flex h-44 flex-1 items-end gap-2 border-b border-dashed sm:gap-3">
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                <div className="border-t border-dashed" />
                <div className="border-t border-dashed" />
                <div />
              </div>
              {chart.map((bar, i) => (
                <div
                  key={i}
                  className="group relative z-10 flex h-full flex-1 items-end"
                >
                  <div
                    title={`Days ${i * 3 + 1}–${Math.min(31, i * 3 + 3)}: ${money(bar.amount)}`}
                    style={{
                      height: `${Math.max(bar.amount ? 3 : 0, (bar.amount / max) * 90)}%`,
                    }}
                    className={cn(
                      "w-full rounded-t-[3px] transition-all duration-500",
                      i % 3 === 0
                        ? "bg-[#b8c8ab]"
                        : i % 3 === 1
                          ? "bg-[#8ba785]"
                          : "bg-primary/85",
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="ml-14 mt-3 flex justify-between text-[9px] text-muted-foreground">
            <span>01</span>
            <span>07</span>
            <span>14</span>
            <span>21</span>
            <span>28</span>
            <span>31</span>
          </div>
          <div className="mt-5 flex items-center gap-2 border-t pt-4 text-[10px] text-muted-foreground">
            <TrendingUp className="size-3.5 text-primary" />
            Every bar represents care, nourishment, and a better tomorrow.
          </div>
        </Card>
        <Card className="relative flex min-h-80 flex-col overflow-hidden bg-[#edf0e5]">
          <div className="relative z-10 p-6 pb-0">
            <span className="text-[9px] font-semibold uppercase tracking-[.2em] text-primary">
              Compassion in action
            </span>
            <h2 className="mt-3 max-w-52 text-[25px] font-medium leading-tight tracking-tight">
              Their wellbeing.
              <br />
              Our shared purpose.
            </h2>
            <p className="mt-2 max-w-56 text-xs leading-relaxed text-muted-foreground">
              One meal. One act of care.
              <br />A world of difference.
            </p>
            <Link
              href="/donate/a-little-care-a-better-life"
              className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-primary"
            >
              Visit donation page <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <CampaignArt className="absolute bottom-0 right-0 h-60 w-full opacity-80" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#edf0e5] via-[#edf0e5]/65 to-transparent" />
        </Card>
      </div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Your donation pages
          </h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Purposeful pages. Meaningful contributions.
          </p>
        </div>
        <Link
          href="/admin/pages"
          className="flex items-center gap-1.5 text-xs font-medium text-primary"
        >
          View all pages <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="mb-7 grid gap-4 md:grid-cols-3">
        {state.campaigns.slice(0, 3).map((c) => {
          const collected = state.donations
            .filter((d) => d.campaignId === c.id && d.status === "success")
            .reduce((s, d) => s + d.amount, 0);
          const banner = state.masters.banners.find((b) => b.id === c.banner);
          return (
            <Card key={c.id} className="overflow-hidden">
              <div className="relative">
                <CampaignArt
                  variant={c.banner}
                  image={banner?.image}
                  className="h-32"
                />
                <span className="absolute left-3 top-3">
                  <Badge tone={c.status === "published" ? "green" : "neutral"}>
                    {c.status === "published" ? "Active" : "Draft"}
                  </Badge>
                </span>
              </div>
              <div className="p-4">
                <Link
                  href={`/admin/pages/${c.id}/edit`}
                  className="text-sm font-semibold hover:text-primary"
                >
                  {c.title}
                </Link>
                <p className="mb-3 mt-1.5 line-clamp-1 text-[11px] text-muted-foreground">
                  {c.description}
                </p>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.min(100, (collected / c.target) * 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[10px]">
                  <span className="font-medium">
                    {money(collected)}{" "}
                    <span className="font-normal text-muted-foreground">
                      raised
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    of {money(c.target)}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <Card className="mb-7 overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-5">
          <div>
            <h2 className="text-sm font-semibold">Recent contributions</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">
              The people behind the kindness.
            </p>
          </div>
          <Link
            href="/admin/reports"
            className="text-xs font-medium text-primary"
          >
            View report <ArrowUpRight className="ml-1 inline size-3.5" />
          </Link>
        </div>
        <DonationTable donations={filtered.slice(0, 5)} />
      </Card>
    </>
  );
}
export function Reports() {
  const { state } = useDemo();
  const [campaign, setCampaign] = useState("");
  const [seva, setSeva] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const invalidDates = !!from && !!to && from > to;
  const donations = state.donations
    .filter(
      (d) =>
        !invalidDates &&
        (!campaign || d.campaignId === campaign) &&
        (!seva || d.sevaId === seva) &&
        (!status || d.status === status) &&
        (!from || dateKey(d.date) >= from) &&
        (!to || dateKey(d.date) <= to),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const paid = donations.filter((d) => d.status === "success");
  const total = paid.reduce((s, d) => s + d.amount, 0);
  const pageCount = Math.max(1, Math.ceil(donations.length / 10));
  const current = Math.min(page, pageCount);
  return (
    <>
      <PageHeading
        title="Reports & insights"
        description="A clear view of every contribution and the impact it creates."
        action={
          <Button
            variant="outline"
            className="h-10 gap-2 bg-white px-4 text-xs"
            onClick={() => exportDonations(donations)}
            disabled={!donations.length}
          >
            <ArrowDownToLine className="size-4" />
            Export CSV
          </Button>
        }
      />
      <Card className="mb-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <label className="grid gap-2 text-xs font-medium">
            Campaign
            <Select
              value={campaign}
              onChange={(e) => {
                setCampaign(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All campaigns</option>
              {state.campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-2 text-xs font-medium">
            Seva
            <Select
              value={seva}
              onChange={(e) => {
                setSeva(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All sevas</option>
              {state.masters.subcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-2 text-xs font-medium">
            Payment status
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="success">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </Select>
          </label>
          <label className="grid gap-2 text-xs font-medium">
            From
            <input
              className="form-input"
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="grid gap-2 text-xs font-medium">
            To
            <input
              className="form-input"
              type="date"
              value={to}
              min={from}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>
        {invalidDates && (
          <p role="alert" className="mt-3 text-xs text-red-700">
            End date must be on or after the start date.
          </p>
        )}
        <button
          className="mt-4 text-xs font-medium text-primary hover:underline"
          onClick={() => {
            setCampaign("");
            setSeva("");
            setStatus("");
            setFrom("");
            setTo("");
            setPage(1);
          }}
        >
          Clear filters
        </button>
      </Card>
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Successful donations", value: money(total) },
          { label: "Contributions", value: donations.length },
          {
            label: "Unique successful donors",
            value: new Set(paid.map((d) => d.email.toLowerCase())).size,
          },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {s.value}
            </p>
          </Card>
        ))}
      </div>
      <Card className="mb-6 overflow-hidden">
        <div className="border-b p-5">
          <h2 className="text-sm font-semibold">Donation report</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {donations.length} matching contributions · Amounts in INR
          </p>
        </div>
        <DonationTable
          donations={donations.slice((current - 1) * 10, current * 10)}
        />
        <div className="flex items-center justify-between border-t p-4">
          <span className="text-xs text-muted-foreground">
            Page {current} of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={current === pageCount}
              onClick={() => setPage(current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
      <Card className="mb-7 overflow-hidden">
        <div className="p-5">
          <h2 className="text-sm font-semibold">Campaign performance</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Successful contributions within your selected filters.
          </p>
        </div>
        <Table>
          <thead>
            <tr>
              <th>CAMPAIGN</th>
              <th>CONTRIBUTIONS</th>
              <th>RAISED</th>
              <th>TARGET</th>
              <th>PROGRESS</th>
            </tr>
          </thead>
          <tbody>
            {state.campaigns
              .filter((c) => !campaign || c.id === campaign)
              .map((c) => {
                const list = paid.filter((d) => d.campaignId === c.id);
                const raised = list.reduce((s, d) => s + d.amount, 0);
                return (
                  <tr key={c.id}>
                    <td className="text-xs font-medium">{c.title}</td>
                    <td className="text-xs">{list.length}</td>
                    <td className="text-xs font-semibold">{money(raised)}</td>
                    <td className="text-xs text-muted-foreground">
                      {money(c.target)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded bg-muted">
                          <div
                            className="h-full rounded bg-primary"
                            style={{
                              width: `${Math.min(100, (raised / c.target) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px]">
                          {Math.round((raised / c.target) * 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
