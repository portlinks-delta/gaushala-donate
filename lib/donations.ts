import { dateKey, emptyDraft, type Campaign, type DemoState, type Donation } from "./demo";

export function activeSevas(state: DemoState, campaign: Campaign) {
  return state.masters.subcategories.filter((seva) =>
    campaign.sevaIds.includes(seva.id) && seva.active &&
    state.masters.categories.some((category) => category.id === seva.parentId && category.active),
  );
}

export function defaultSeva(state: DemoState, campaign: Campaign) {
  const sevas = activeSevas(state, campaign);
  return sevas.find((seva) => seva.id === campaign.defaultSevaId)?.id || sevas[0]?.id || "";
}

export function campaignDraft(state: DemoState, campaign: Campaign) {
  return { ...emptyDraft(), sevaId: defaultSeva(state, campaign) };
}

export function resolveBank(state: DemoState, campaign: Campaign, sevaId: string) {
  const seva = state.masters.subcategories.find((item) => item.id === sevaId);
  const category = state.masters.categories.find((item) => item.id === seva?.parentId);
  for (const id of [seva?.bankId, category?.bankId, campaign.bankId]) {
    const bank = state.masters.banks.find((item) => item.id === id && item.active);
    if (bank) return bank;
  }
}

export function bankSnapshot(state: DemoState, campaign: Campaign, sevaId: string) {
  const bank = resolveBank(state, campaign, sevaId);
  return bank ? { bankId: bank.id, bankName: bank.name, bankDetail: bank.detail } : {};
}

export function campaignRaised(state: DemoState, campaign: Campaign) {
  const balance = campaign.openingBalance ?? 0;
  return (Number.isFinite(balance) && balance >= 0 ? balance : 0) +
    state.donations.filter((item) => item.campaignId === campaign.id && item.status === "success")
      .reduce((sum, item) => sum + item.amount, 0);
}

export function receiptNumber(state: DemoState, id: string) {
  const sequence = state.donations.filter((item) => item.status === "success").length + 1;
  const year = dateKey(new Date().toISOString()).slice(0, 4);
  return `${state.receipts.prefix}-${year}-${String(sequence).padStart(4, "0")}-${id.slice(0, 4).toUpperCase()}`;
}

const small = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function numberWords(value: number): string {
  if (value < 20) return small[value];
  if (value < 100) return `${tens[Math.floor(value / 10)]}${value % 10 ? ` ${small[value % 10]}` : ""}`;
  for (const [unit, label] of [[10000000, "crore"], [100000, "lakh"], [1000, "thousand"], [100, "hundred"]] as const) {
    if (value >= unit) return `${numberWords(Math.floor(value / unit))} ${label}${value % unit ? ` ${numberWords(value % unit)}` : ""}`;
  }
  return "";
}

export function amountInWords(amount: number): string {
  const totalPaise = Math.round(amount * 100);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(totalPaise) || totalPaise === 0) return "";
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;
  const words = `${numberWords(rupees)} ${rupees === 1 ? "rupee" : "rupees"}${paise ? ` and ${numberWords(paise)} ${paise === 1 ? "paisa" : "paise"}` : ""} only`;
  return words[0].toUpperCase() + words.slice(1);
}

export function donorKey(donation: Donation) {
  const digits = donation.mobile.replace(/\D/g, "");
  const phone = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  if (phone) return `phone:${phone}`;
  const email = donation.email.trim().toLowerCase();
  return email ? `email:${email}` : `donation:${donation.id}`;
}

export type DonorSummary = {
  id: string;
  name: string;
  mobile: string;
  email: string;
  count: number;
  total: number;
  latest: string;
  donations: Donation[];
};

export function donorSummaries(donations: Donation[], from = "", to = ""): DonorSummary[] {
  if (from && to && from > to) return [];
  const grouped = new Map<string, DonorSummary>();
  for (const donation of [...donations].sort((a, b) => b.date.localeCompare(a.date))) {
    if (donation.status !== "success") continue;
    const day = dateKey(donation.date);
    if ((from && day < from) || (to && day > to)) continue;
    const id = donorKey(donation);
    const donor = grouped.get(id) || { id, name: donation.name, mobile: donation.mobile, email: donation.email, count: 0, total: 0, latest: donation.date, donations: [] };
    donor.count += 1;
    donor.total += donation.amount;
    donor.donations.push(donation);
    grouped.set(id, donor);
  }
  return [...grouped.values()].sort((a, b) => b.total - a.total || b.latest.localeCompare(a.latest) || a.id.localeCompare(b.id));
}

export type ManualDonationInput = {
  id: string;
  campaignId: string;
  sevaId: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  amount: number;
  paymentDate: string;
  paymentMethod: "cash" | "upi";
  paymentReference: string;
  confirmed: boolean;
};

export function recordManualDonation(state: DemoState, input: ManualDonationInput): DemoState {
  if (state.donations.some((donation) => donation.id === input.id)) return state;
  const campaign = state.campaigns.find((item) => item.id === input.campaignId);
  if (!input.id || !campaign || !activeSevas(state, campaign).some((item) => item.id === input.sevaId)) throw new Error("Choose a campaign and an active seva.");
  if (!input.confirmed) throw new Error("Confirm that payment was received.");
  if (!["cash", "upi"].includes(input.paymentMethod)) throw new Error("Choose Cash or UPI.");
  if (!Number.isFinite(input.amount) || input.amount <= 0 || !Number.isSafeInteger(Math.round(input.amount * 100)) || Math.abs(input.amount * 100 - Math.round(input.amount * 100)) > 0.00001) throw new Error("Enter a positive amount with at most two decimal places.");
  if (input.name.trim().length < 2) throw new Error("Enter the donor’s full name.");
  if (!input.mobile.trim() && !input.email.trim()) throw new Error("Enter a mobile number or email address for the donor.");
  if (input.mobile && !/^(?:\+?91[\s-]?)?[6-9]\d{9}$/.test(input.mobile.trim())) throw new Error("Enter a valid Indian mobile number.");
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) throw new Error("Enter a valid email address.");
  const date = new Date(`${input.paymentDate}T12:00:00+05:30`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.paymentDate) || !Number.isFinite(date.getTime()) || dateKey(date.toISOString()) !== input.paymentDate) throw new Error("Choose a valid payment date.");
  const bank = bankSnapshot(state, campaign, input.sevaId);
  if (!bank.bankId) throw new Error("An active bank account is required for this seva.");
  const donation: Donation = {
    ...emptyDraft(),
    id: input.id,
    campaignId: campaign.id,
    sevaId: input.sevaId,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    mobile: input.mobile.replace(/\D/g, "").slice(-10),
    address: input.address.trim(),
    amount: input.amount,
    occasionDate: "",
    date: date.toISOString(),
    status: "success",
    paymentMethod: input.paymentMethod,
    paymentReference: input.paymentReference.trim(),
    ...bank,
    receiptNumber: receiptNumber(state, input.id),
    organization: state.receipts.organization,
    organizationAddress: state.receipts.address,
    receiptFooter: state.receipts.footer,
  };
  return { ...state, donations: [...state.donations, donation] };
}
