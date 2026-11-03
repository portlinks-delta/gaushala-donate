export type MasterKind =
  "categories" | "subcategories" | "banks" | "occasions" | "banners";
export type Master = {
  id: string;
  name: string;
  detail: string;
  active: boolean;
  parentId?: string;
  image?: string;
};
export type Campaign = {
  id: string;
  slug: string;
  title: string;
  description: string;
  target: number;
  sevaIds: string[];
  amounts: number[];
  customAmount: boolean;
  bankId: string;
  status: "draft" | "published";
  banner: string;
  createdAt: string;
};
export type DonorDraft = {
  attemptId: string;
  sevaId: string;
  amount: number;
  name: string;
  email: string;
  mobile: string;
  address: string;
  wantsTax: boolean;
  pan: string;
  occasionId: string;
  occasionDate: string;
  message: string;
};
export type Donation = {
  id: string;
  campaignId: string;
  sevaId: string;
  amount: number;
  name: string;
  email: string;
  mobile: string;
  address: string;
  wantsTax: boolean;
  pan: string;
  occasionId: string;
  occasionDate: string;
  message: string;
  date: string;
  status: "success" | "failed" | "pending";
  receiptNumber: string;
  organization: string;
  organizationAddress?: string;
  receiptFooter: string;
};
export type ReceiptSettings = {
  organization: string;
  address: string;
  prefix: string;
  footer: string;
};
export type DemoState = {
  version: 1;
  campaigns: Campaign[];
  masters: Record<MasterKind, Master[]>;
  donations: Donation[];
  drafts: Record<string, DonorDraft>;
  receipts: ReceiptSettings;
};
export const STORAGE_KEY = "gaushala-demo-v1";
export const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
export const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(date));
export const dateKey = (date: string) =>
  new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(date));
export const uid = () => crypto.randomUUID();
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const emptyDraft = (): DonorDraft => ({
  attemptId: uid(),
  sevaId: "",
  amount: 0,
  name: "",
  email: "",
  mobile: "",
  address: "",
  wantsTax: false,
  pan: "",
  occasionId: "",
  occasionDate: "",
  message: "",
});
export const validDetails = (draft: DonorDraft) =>
  draft.name.trim().length > 1 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email) &&
  /^[6-9]\d{9}$/.test(draft.mobile);
export const validAdditional = (draft: DonorDraft) =>
  (!draft.wantsTax || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(draft.pan)) &&
  (!draft.occasionId || !!draft.occasionDate);
export function seedState(): DemoState {
  const campaigns: Campaign[] = [
    {
      id: "c1",
      slug: "a-little-care-a-better-life",
      title: "A little care. A better life.",
      description:
        "Help us give our cows the care they deserve. Your contribution brings fresh fodder, a safe shelter, and a healthier tomorrow to the gentle souls at Anand Gaushala.",
      target: 500000,
      sevaIds: ["s1", "s2", "s3"],
      amounts: [501, 1100, 2100, 5100],
      customAmount: true,
      bankId: "b1",
      status: "published",
      banner: "meadow",
      createdAt: "2026-10-01",
    },
    {
      id: "c2",
      slug: "a-warm-shelter-this-winter",
      title: "A warm shelter this winter",
      description:
        "Together, we can keep every cow warm and comfortable. Support clean bedding, shelter repairs, and nourishing meals throughout the winter.",
      target: 300000,
      sevaIds: ["s1", "s3"],
      amounts: [501, 1001, 2500, 5000],
      customAmount: true,
      bankId: "b1",
      status: "published",
      banner: "shelter",
      createdAt: "2026-10-12",
    },
    {
      id: "c3",
      slug: "a-day-of-gau-seva",
      title: "A day of Gau Seva",
      description:
        "Make your special day meaningful by sponsoring a day of meals and compassionate care at our gaushala.",
      target: 150000,
      sevaIds: ["s1", "s2"],
      amounts: [1100, 2100, 5100],
      customAmount: false,
      bankId: "b1",
      status: "draft",
      banner: "sunrise",
      createdAt: "2026-11-01",
    },
  ];
  const names = [
    "Aarav Sharma",
    "Meera Patel",
    "Rohan Shah",
    "Ananya Gupta",
    "Vikram Desai",
    "Kavya Mehta",
    "Sanjay Joshi",
    "Priya Nair",
    "Arjun Rao",
    "Neha Kapoor",
    "Dev Shah",
    "Isha Jain",
  ];
  const donations: Donation[] = Array.from({ length: 54 }, (_, i) => ({
    id: `seed-${i}`,
    campaignId: i % 3 === 0 ? "c2" : "c1",
    sevaId: ["s1", "s2", "s3"][i % 3],
    amount: [501, 1100, 2100, 5100, 11000, 2500][i % 6],
    name: names[i % names.length],
    email: `donor${i + 1}@example.com`,
    mobile: "9876543210",
    address: "",
    wantsTax: false,
    pan: "",
    occasionId: "",
    occasionDate: "",
    message: "",
    date: new Date(
      Date.UTC(2026, 9, 6 + Math.floor(i / 2), 5, i % 60),
    ).toISOString(),
    status: i % 13 === 0 ? "failed" : i % 17 === 0 ? "pending" : "success",
    receiptNumber: `AG-2026-${String(i + 1).padStart(4, "0")}`,
    organization: "Anand Gaushala",
    organizationAddress: "Vrindavan, Uttar Pradesh, India",
    receiptFooter: "Thank you for making compassionate care possible.",
  }));
  return {
    version: 1,
    campaigns,
    donations,
    drafts: {},
    masters: {
      categories: [
        {
          id: "cat1",
          name: "Gau Seva",
          detail: "Everyday care and nourishment",
          active: true,
        },
        {
          id: "cat2",
          name: "Shelter & wellbeing",
          detail: "A safe place to call home",
          active: true,
        },
      ],
      subcategories: [
        {
          id: "s1",
          name: "Fodder seva",
          detail: "Fresh, nutritious meals for our cows",
          parentId: "cat1",
          active: true,
        },
        {
          id: "s2",
          name: "Medical seva",
          detail: "Veterinary care and essential medicines",
          parentId: "cat1",
          active: true,
        },
        {
          id: "s3",
          name: "Shelter seva",
          detail: "Safe shelter, clean bedding, and comfort",
          parentId: "cat2",
          active: true,
        },
      ],
      banks: [
        {
          id: "b1",
          name: "Anand Gaushala Trust",
          detail: "HDFC Bank · •••• 4821 · HDFC0001234",
          active: true,
        },
      ],
      occasions: [
        {
          id: "o1",
          name: "Birthday",
          detail: "Celebrate with an act of kindness",
          active: true,
        },
        {
          id: "o2",
          name: "Anniversary",
          detail: "Mark a milestone with seva",
          active: true,
        },
        {
          id: "o3",
          name: "In memory",
          detail: "A loving tribute",
          active: true,
        },
      ],
      banners: [
        {
          id: "meadow",
          name: "A little care",
          detail: "Green meadows and gentle souls",
          active: true,
        },
        {
          id: "shelter",
          name: "A place to belong",
          detail: "Warmth, comfort, and care",
          active: true,
        },
        {
          id: "sunrise",
          name: "A brighter tomorrow",
          detail: "A fresh start through kindness",
          active: true,
        },
      ],
    },
    receipts: {
      organization: "Anand Gaushala",
      address: "Vrindavan, Uttar Pradesh, India",
      prefix: "AG",
      footer: "Thank you for making compassionate care possible.",
    },
  };
}
export function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadReceipt(donation: Donation) {
  const escape = (text: string) =>
    text.replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char]!,
    );
  downloadFile(
    `${donation.receiptNumber}.html`,
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>Demo receipt ${escape(donation.receiptNumber)}</title><style>body{font:16px system-ui;max-width:680px;margin:60px auto;padding:24px;color:#173f32}h1{font-size:32px}dl{line-height:2}dt{float:left;clear:left;width:160px}dd{margin-left:170px}hr{border:0;border-top:1px solid #ddd}</style><h1>${escape(donation.organization)}</h1><p>${escape(donation.organizationAddress || "")}</p><p>DEMO RECEIPT · No actual payment was collected</p><hr><dl><dt>Receipt</dt><dd>${escape(donation.receiptNumber)}</dd><dt>Donor</dt><dd>${escape(donation.name)}</dd><dt>Date</dt><dd>${dateLabel(donation.date)}</dd><dt>Donation</dt><dd>${money(donation.amount)}</dd><dt>Email</dt><dd>${escape(donation.email)}</dd></dl><hr><p>${escape(donation.receiptFooter)}</p><p>This is a browser demo, not a valid tax receipt.</p></html>`,
    "text/html;charset=utf-8",
  );
}
