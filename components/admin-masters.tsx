"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, FileText, Pencil, Plus, Search } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { PageHeading } from "@/components/admin-shell";
import {
  Badge,
  Card,
  EmptyState,
  ErrorMessage,
  Field,
  Input,
  Modal,
  Select,
  Table,
  Textarea,
  WorkspaceTabs,
} from "@/components/ui/kit";
import { Button } from "@/components/ui/button";
import { CampaignArt } from "@/components/campaign-art";
import { Donors } from "@/components/admin-donors";
import { uid, type Master, type MasterKind } from "@/lib/demo";

const tabs = [
  { id: "categories", label: "Categories" },
  { id: "subcategories", label: "Subcategories" },
  { id: "banks", label: "Bank accounts" },
  { id: "donors", label: "Donors" },
  { id: "occasions", label: "Occasions" },
  { id: "receipts", label: "Receipt settings" },
  { id: "banners", label: "Donation banners" },
];
const singular: Record<MasterKind, string> = {
  categories: "category",
  subcategories: "subcategory",
  banks: "bank account",
  occasions: "occasion",
  banners: "banner",
};

export function Masters() {
  const params = useSearchParams();
  const { state, update, notify } = useDemo();
  const [tab, setTab] = useState(
    tabs.some((t) => t.id === params.get("tab"))
      ? params.get("tab")!
      : "categories",
  );
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Master | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState(false);
  const [receipts, setReceipts] = useState(state.receipts);
  const requestedTab = params.get("tab");
  useEffect(() => {
    setTab(tabs.some((item) => item.id === requestedTab) ? requestedTab! : "categories");
    setSearch("");
  }, [requestedTab]);
  const kind = tab === "receipts" || tab === "donors" ? "categories" : (tab as MasterKind);
  const records = state.masters[kind].filter((m) =>
    `${m.name} ${m.detail}`.toLowerCase().includes(search.toLowerCase()),
  );
  const startEdit = (master?: Master) => {
    setEditing(
      master || {
        id: "",
        name: "",
        detail: "",
        active: true,
        ...(kind === "subcategories"
          ? {
              parentId:
                state.masters.categories.find((c) => c.active)?.id || "",
            }
          : {}),
      },
    );
    setError("");
    setOpen(true);
  };
  const change = (key: keyof Master, value: string | boolean) =>
    setEditing((m) => (m ? { ...m, [key]: value } : m));

  function save(e: FormEvent) {
    e.preventDefault();
    if (!editing?.name.trim()) return setError("Enter a name.");
    if (kind === "subcategories" && !editing.parentId)
      return setError("Choose a parent category.");
    if (editing.bankId && !state.masters.banks.some((bank) => bank.id === editing.bankId && bank.active))
      return setError("Choose an active bank account or use the inherited account.");
    if (
      state.masters[kind].some(
        (m) =>
          m.id !== editing.id &&
          m.name.toLowerCase() === editing.name.trim().toLowerCase(),
      )
    )
      return setError("A record with that name already exists.");
    const record = {
      ...editing,
      id: editing.id || uid(),
      name: editing.name.trim(),
    };
    update((s) => ({
      ...s,
      masters: {
        ...s.masters,
        [kind]: editing.id
          ? s.masters[kind].map((m) => (m.id === editing.id ? record : m))
          : [...s.masters[kind], record],
      },
    }));
    setOpen(false);
    notify(
      `${singular[kind][0].toUpperCase() + singular[kind].slice(1)} saved.`,
    );
  }
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 1024 * 1024)
      return setError("Choose an image smaller than 1 MB.");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
      return setError("Choose a PNG, JPG, or WebP image.");
    setUploading(true);
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        setEditing((m) => (m ? { ...m, image: String(reader.result) } : m));
        setUploading(false);
      };
      image.onerror = () => {
        setError(
          "This image is not valid. Try another PNG, JPG, or WebP file.",
        );
        setUploading(false);
      };
      image.src = String(reader.result);
    };
    reader.onerror = () => {
      setError("This image could not be read. Try another file.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }
  return (
    <>
      <PageHeading
        title="A foundation for giving"
        description="Keep your donation essentials organised, consistent, and ready to use."
      />
      <Card className="mb-8 overflow-hidden">
        <WorkspaceTabs
          tabs={tabs}
          value={tab}
          onChange={(value) => {
            setTab(value);
            setSearch("");
          }}
        />
        {tab === "donors" ? <Donors /> : tab === "receipts" ? (
          <div className="grid gap-8 p-5 sm:p-7 xl:grid-cols-[1fr_320px]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!receipts.prefix.trim() || !receipts.organization.trim())
                  return;
                update((s) => ({
                  ...s,
                  receipts: {
                    ...receipts,
                    prefix: receipts.prefix.trim().toUpperCase(),
                  },
                }));
                notify(
                  "Receipt settings saved. Existing receipts keep their original details.",
                );
              }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-sm font-semibold">
                  A thank you, beautifully recorded.
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Personalise the demo receipts for future contributions.
                </p>
              </div>
              <Field label="Organisation name *">
                <Input
                  required
                  maxLength={100}
                  value={receipts.organization}
                  onChange={(e) =>
                    setReceipts((r) => ({ ...r, organization: e.target.value }))
                  }
                />
              </Field>
              <Field label="Organisation address">
                <Textarea
                  maxLength={300}
                  value={receipts.address}
                  onChange={(e) =>
                    setReceipts((r) => ({ ...r, address: e.target.value }))
                  }
                />
              </Field>
              <Field
                label="Receipt prefix *"
                hint="Example: AG → AG-2026-0001. Each new receipt has a unique number."
              >
                <Input
                  required
                  pattern="[A-Za-z0-9-]+"
                  maxLength={12}
                  value={receipts.prefix}
                  onChange={(e) =>
                    setReceipts((r) => ({ ...r, prefix: e.target.value }))
                  }
                />
              </Field>
              <Field label="Thank-you message">
                <Textarea
                  maxLength={500}
                  value={receipts.footer}
                  onChange={(e) =>
                    setReceipts((r) => ({ ...r, footer: e.target.value }))
                  }
                />
              </Field>
              <Button type="submit">Save receipt settings</Button>
            </form>
            <div>
              <div className="rounded-xl border border-dashed bg-muted/40 p-6 text-center">
                <FileText className="mx-auto mb-4 size-9 text-primary/60" />
                <p className="text-sm font-semibold">{receipts.organization}</p>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  DEMO RECEIPT
                </p>
                <div className="my-5 border-t border-dashed" />
                <p className="text-xs">{receipts.prefix || "AG"}-2026-0001</p>
                <p className="mt-3 text-2xl font-semibold">₹1,100</p>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  {receipts.footer}
                </p>
                <Button
                  variant="outline"
                  className="mt-5"
                  onClick={() => setReceiptPreview(true)}
                >
                  <Eye className="size-4" />
                  Preview receipt
                </Button>
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                Demo receipts are illustrative and are not valid tax documents.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  aria-label={`Search ${tab}`}
                  className="pl-9"
                  placeholder={`Search ${tabs.find((t) => t.id === tab)?.label.toLowerCase()}…`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button onClick={() => startEdit()}>
                <Plus className="size-4" />
                Add {singular[kind]}
              </Button>
            </div>
            {records.length ? (
              <Table>
                <thead>
                  <tr>
                    <th>NAME</th>
                    <th>
                      {kind === "subcategories"
                        ? "CATEGORY / DESCRIPTION"
                        : kind === "banks"
                          ? "BANK DETAILS"
                          : "DESCRIPTION"}
                    </th>
                    <th>STATUS</th>
                    {(kind === "categories" || kind === "subcategories") && <th>BANK ACCOUNT</th>}
                    <th className="text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {kind === "banners" && (
                            <CampaignArt
                              variant={m.id}
                              image={m.image}
                              className="h-10 w-16 rounded"
                            />
                          )}
                          <span className="text-xs font-medium">{m.name}</span>
                        </div>
                      </td>
                      <td>
                        <p className="max-w-72 truncate text-xs text-muted-foreground">
                          {m.parentId && (
                            <span className="mr-2 font-medium text-foreground">
                              {
                                state.masters.categories.find(
                                  (c) => c.id === m.parentId,
                                )?.name
                              }{" "}
                              ·
                            </span>
                          )}
                          {m.detail || "—"}
                        </p>
                      </td>
                      <td>
                        <Badge tone={m.active ? "green" : "neutral"}>
                          {m.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      {(kind === "categories" || kind === "subcategories") && <td className="text-xs text-muted-foreground">
                        {m.bankId ? (state.masters.banks.find((bank) => bank.id === m.bankId)?.name || "Unavailable account") : "Inherited / page default"}
                      </td>}
                      <td>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${m.name}`}
                            onClick={() => startEdit(m)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-w-20 text-[10px]"
                            onClick={() => {
                              update((s) => ({
                                ...s,
                                masters: {
                                  ...s.masters,
                                  [kind]: s.masters[kind].map((record) =>
                                    record.id === m.id
                                      ? { ...record, active: !record.active }
                                      : record,
                                  ),
                                },
                              }));
                              notify(
                                `${m.name} is now ${m.active ? "inactive" : "active"}.`,
                              );
                            }}
                          >
                            {m.active ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <EmptyState title="No matching records" />
            )}
            <div className="border-t bg-muted/20 p-4 text-[11px] text-muted-foreground">
              Inactive records remain available in historical reports. Only
              active options are offered for new donations.
            </div>
          </>
        )}
      </Card>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={`${editing?.id ? "Edit" : "Add"} ${singular[kind]}`}
        description="Changes are saved in this browser demo."
      >
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Name *">
              <Input
                required
                maxLength={100}
                value={editing.name}
                onChange={(e) => change("name", e.target.value)}
              />
            </Field>
            {kind === "subcategories" && (
              <Field label="Parent category *">
                <Select
                  required
                  value={editing.parentId || ""}
                  onChange={(e) => change("parentId", e.target.value)}
                >
                  <option value="">Select category</option>
                  {state.masters.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {!c.active && " (inactive)"}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Field
              label={kind === "banks" ? "Bank details *" : "Description"}
              hint={
                kind === "banks"
                  ? "Use sample details only: bank name, masked account number, and IFSC."
                  : undefined
              }
            >
              <Textarea
                required={kind === "banks"}
                maxLength={500}
                value={editing.detail}
                onChange={(e) => change("detail", e.target.value)}
              />
            </Field>
            {(kind === "categories" || kind === "subcategories") && <Field label="Bank account" hint="Subcategory mappings override the category. Otherwise the donation page’s default account is used.">
              <Select value={editing.bankId || ""} onChange={(event) => change("bankId", event.target.value)}>
                <option value="">{kind === "subcategories" ? "Inherit from category / page default" : "Use page default"}</option>
                {state.masters.banks.filter((bank) => bank.active || bank.id === editing.bankId).map((bank) => <option key={bank.id} value={bank.id} disabled={!bank.active}>{bank.name} · {bank.detail}{!bank.active && " (inactive)"}</option>)}
              </Select>
            </Field>}
            {kind === "banners" && (
              <>
                <CampaignArt
                  variant={editing.id}
                  image={editing.image}
                  className="h-32 rounded-lg"
                />
                <Field
                  label="Upload banner"
                  hint="PNG, JPG, or WebP · Maximum 1 MB. Without an image, a meadow illustration is used."
                >
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => upload(e.target.files?.[0])}
                  />
                </Field>
                {editing.image && (
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() =>
                      setEditing((m) => (m ? { ...m, image: undefined } : m))
                    }
                  >
                    Use default illustration
                  </Button>
                )}
              </>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-primary"
                checked={editing.active}
                onChange={(e) => change("active", e.target.checked)}
              />
              Active
            </label>
            <ErrorMessage>{error}</ErrorMessage>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "Reading image…" : "Save changes"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
      <Modal
        open={receiptPreview}
        onOpenChange={setReceiptPreview}
        title="Demo receipt preview"
        description="Sample details only. This is not a valid tax receipt."
      >
        <div className="space-y-4 rounded-xl border p-5 text-center">
          <p className="text-xl font-semibold">{receipts.organization}</p>
          <p className="text-xs text-muted-foreground">{receipts.address}</p>
          <p className="text-xs">{receipts.prefix}-2026-0001</p>
          <hr />
          <p className="text-sm">Sample donor · Aarav Sharma</p>
          <p className="text-3xl font-semibold">₹1,100</p>
          <p className="text-sm text-muted-foreground">{receipts.footer}</p>
        </div>
      </Modal>
    </>
  );
}
