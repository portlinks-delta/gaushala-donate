"use client";

import { useRef, useState, type FormEvent } from "react";
import { Download, Plus } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorMessage, Field, Input, Modal, Select, Table, Textarea, WorkspaceTabs } from "@/components/ui/kit";
import { dateKey, dateLabel, downloadReceipt, money, uid } from "@/lib/demo";
import { activeSevas, amountInWords, defaultSeva, donorKey, donorSummaries, recordManualDonation, resolveBank, type ManualDonationInput } from "@/lib/donations";

export function Donors() {
  const { state } = useDemo();
  const [view, setView] = useState("records");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState("");
  const [manual, setManual] = useState(false);
  const invalidDates = !!from && !!to && from > to;
  const donors = donorSummaries(state.donations, from, to).filter((donor) =>
    donor.donations.some((donation) => `${donation.name} ${donation.email} ${donation.mobile}`.toLowerCase().includes(search.toLowerCase())),
  );
  if (view === "records") donors.sort((a, b) => a.name.localeCompare(b.name));
  const history = state.donations.filter((donation) => donation.status === "success" && donorKey(donation) === selected)
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <h2 className="text-base font-semibold">Donors</h2>
        <Button onClick={() => setManual(true)}><Plus className="size-4" />Record donation</Button>
      </div>
      <WorkspaceTabs tabs={[{ id: "records", label: "Donor records" }, { id: "highest", label: "Highest donors" }]} value={view} onChange={setView} />
      <div className="grid gap-3 p-4 sm:grid-cols-3">
        <Field label="Search donors">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, phone or email" />
        </Field>
        <Field label="From"><Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></Field>
        <Field label="To"><Input type="date" min={from || undefined} value={to} onChange={(event) => setTo(event.target.value)} /></Field>
      </div>
      <div className="px-4 pb-3">
        <ErrorMessage>{invalidDates ? "End date must be on or after the start date." : ""}</ErrorMessage>
        <p className="text-xs text-muted-foreground">Completed online and manual donations only. Totals follow the selected date range.</p>
      </div>
      {donors.length ? <Table>
        <thead><tr>{view === "highest" && <th>RANK</th>}<th>DONOR</th><th>CONTACT</th><th>DONATIONS</th><th>TOTAL DONATED</th><th>LATEST DONATION</th><th>HISTORY</th></tr></thead>
        <tbody>{donors.map((donor, index) => <tr key={donor.id}>
          {view === "highest" && <td>{index + 1}</td>}
          <td className="font-medium">{donor.name}</td>
          <td><p>{donor.mobile || "—"}</p><p className="text-xs text-muted-foreground">{donor.email || "—"}</p></td>
          <td>{donor.count}</td><td className="font-semibold">{money(donor.total)}</td><td>{dateLabel(donor.latest)}</td>
          <td><Button variant="outline" size="sm" onClick={() => setSelected(donor.id)}>View history</Button></td>
        </tr>)}</tbody>
      </Table> : <EmptyState title="No matching donors" />}
      <Modal open={!!selected} onOpenChange={(open) => { if (!open) setSelected(""); }} title={history[0] ? `${history[0].name} — donation history` : "Donation history"} description="All completed donations for this donor, with original receipts.">
        <div className="space-y-3">{history.map((donation) => <div key={donation.id} className="rounded-lg border p-3">
          <div className="flex flex-wrap justify-between gap-2"><p className="font-semibold">{money(donation.amount)}</p><p className="text-sm">{dateLabel(donation.date)}</p></div>
          <p className="mt-1 text-sm">{state.campaigns.find((item) => item.id === donation.campaignId)?.title || "Campaign"}</p>
          <p className="text-xs text-muted-foreground">{state.masters.subcategories.find((item) => item.id === donation.sevaId)?.name} · {donation.paymentMethod?.toUpperCase() || "Online"}</p>
          {donation.paymentReference && <p className="mt-1 break-all text-xs">Reference: {donation.paymentReference}</p>}
          {donation.bankName && <p className="mt-1 text-xs text-muted-foreground">{donation.bankName} · {donation.bankDetail}</p>}
          <Button className="mt-2" variant="outline" size="sm" onClick={() => downloadReceipt(donation)}><Download className="size-4" />{donation.receiptNumber}</Button>
        </div>)}</div>
      </Modal>
      {manual && <ManualDonation onClose={() => setManual(false)} />}
    </>
  );
}

function ManualDonation({ onClose }: { onClose: () => void }) {
  const { state, update, notify } = useDemo();
  const submitting = useRef(false);
  const [savedId, setSavedId] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState<ManualDonationInput>(() => {
    const campaign = state.campaigns[0];
    return { id: uid(), campaignId: campaign?.id || "", sevaId: campaign ? defaultSeva(state, campaign) : "", name: "", email: "", mobile: "", address: "", amount: 0, paymentDate: dateKey(new Date().toISOString()), paymentMethod: "cash", paymentReference: "", confirmed: false };
  });
  const change = <K extends keyof ManualDonationInput>(key: K, value: ManualDonationInput[K]) => {
    setError("");
    setForm((current) => ({ ...current, [key]: value }));
  };
  const campaign = state.campaigns.find((item) => item.id === form.campaignId);
  const bank = campaign && resolveBank(state, campaign, form.sevaId);
  const saved = state.donations.find((item) => item.id === savedId);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || savedId) return;
    try {
      recordManualDonation(state, form);
      submitting.current = true;
      update((current) => recordManualDonation(current, form));
      setSavedId(form.id);
      notify("Manual donation recorded and demo receipt generated.");
    } catch (failure) {
      submitting.current = false;
      setError(failure instanceof Error ? failure.message : "Could not record the donation.");
    }
  }
  return <Modal open onOpenChange={(open) => { if (!open) onClose(); }} title={saved ? "Donation recorded" : "Record cash or UPI donation"} description="Saved in this browser demo using the existing receipt settings.">
    {saved ? <div className="space-y-4">
      <p>{saved.name} · {money(saved.amount)} · {saved.paymentMethod?.toUpperCase()}</p>
      <p className="text-sm">Receipt: {saved.receiptNumber}</p>
      <Button onClick={() => downloadReceipt(saved)}><Download className="size-4" />Download receipt</Button>
      <Button className="ml-2" variant="outline" onClick={onClose}>Done</Button>
    </div> : <form className="space-y-3" onSubmit={submit}>
      <Field label="Full name *"><Input required minLength={2} maxLength={100} value={form.name} onChange={(event) => change("name", event.target.value)} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Mobile number"><Input type="tel" maxLength={16} value={form.mobile} onChange={(event) => change("mobile", event.target.value)} /></Field>
        <Field label="Email address"><Input type="email" maxLength={150} value={form.email} onChange={(event) => change("email", event.target.value)} /></Field>
      </div>
      <p className="text-xs text-muted-foreground">Provide at least a mobile number or email address to identify the donor.</p>
      <Field label="Address (optional)"><Textarea className="min-h-16" maxLength={300} value={form.address} onChange={(event) => change("address", event.target.value)} /></Field>
      <Field label="Campaign *"><Select required value={form.campaignId} onChange={(event) => {
        const next = state.campaigns.find((item) => item.id === event.target.value);
        setForm((current) => ({ ...current, campaignId: event.target.value, sevaId: next ? defaultSeva(state, next) : "" }));
      }}><option value="">Choose campaign</option>{state.campaigns.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</Select></Field>
      <Field label="Seva *"><Select required value={form.sevaId} onChange={(event) => change("sevaId", event.target.value)}><option value="">Choose seva</option>{campaign && activeSevas(state, campaign).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
      <p className="text-xs text-muted-foreground">Bank account: {bank ? `${bank.name} · ${bank.detail}` : "No active bank account available"}</p>
      <Field label="Amount (₹) *" hint={amountInWords(form.amount) || undefined}><Input required type="number" min="0.01" step="0.01" value={form.amount || ""} onChange={(event) => change("amount", Number(event.target.value))} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Payment date *"><Input required type="date" value={form.paymentDate} onChange={(event) => change("paymentDate", event.target.value)} /></Field>
        <Field label="Payment method *"><Select value={form.paymentMethod} onChange={(event) => change("paymentMethod", event.target.value as "cash" | "upi")}><option value="cash">Cash</option><option value="upi">UPI</option></Select></Field>
      </div>
      <Field label="Payment reference (optional)"><Input maxLength={100} value={form.paymentReference} onChange={(event) => change("paymentReference", event.target.value)} /></Field>
      <label className="flex items-start gap-2 py-2 text-sm"><input className="mt-1 accent-primary" required type="checkbox" checked={form.confirmed} onChange={(event) => change("confirmed", event.target.checked)} />I confirm this payment was received.</label>
      <ErrorMessage>{error}</ErrorMessage>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={submitting.current}>Record donation &amp; generate receipt</Button></div>
    </form>}
  </Modal>;
}
