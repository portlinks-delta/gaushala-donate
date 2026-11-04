import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Optional runner: npm install --prefix node_modules/.cache/gaushala-qa --no-save --package-lock=false playwright
const { chromium } = await import("playwright").catch(
  () =>
    import(
      pathToFileURL(
        path.resolve(
          "node_modules/.cache/gaushala-qa/node_modules/playwright/index.mjs",
        ),
      ).href
    ),
);
const base = process.env.DEMO_URL || "http://localhost:3001";
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1050 },
  acceptDownloads: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const state = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem("gaushala-demo-v1")));
const goto = async (route) => {
  const response = await page.goto(base + route);
  assert.equal(response.status(), 200, route);
  await page.waitForFunction(() => !!localStorage.getItem("gaushala-demo-v1"));
};
const artifacts = path.resolve(".next/qa/artifacts");
await fs.mkdir(artifacts, { recursive: true });
try {
  await goto("/");
  await page
    .getByRole("heading", { name: "A little care goes a long way." })
    .waitFor();
  await page.screenshot({
    path: path.join(artifacts, "dashboard-desktop.png"),
    fullPage: true,
  });
  const initial = await state();
  const initialTotal = initial.donations
    .filter((d) => d.status === "success")
    .reduce((s, d) => s + d.amount, 0);

  // Shared layout remains mounted on client-side navigation.
  await page.getByRole("link", { name: "Reports", exact: true }).click();
  await page.getByRole("heading", { name: "Reports & insights" }).waitFor();
  await page.getByLabel("Payment status").selectOption("success");
  const reportDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const csv = await reportDownload;
  await csv.saveAs(path.join(artifacts, csv.suggestedFilename()));
  const csvText = await fs.readFile(
    path.join(artifacts, csv.suggestedFilename()),
    "utf8",
  );
  assert.ok(csvText.includes('"success"'));
  assert.ok(!csvText.includes('"failed"'));

  await goto("/admin/masters");
  await page.getByRole("button", { name: "Add category", exact: true }).click();
  await page.getByLabel("Name *", { exact: true }).fill("Community seva");
  await page
    .getByLabel("Description", { exact: true })
    .fill("A locally saved demo category");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByText("Community seva", { exact: true }).waitFor();
  await page.reload();
  await page.getByText("Community seva", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Edit Community seva" }).click();
  await page.getByLabel("Name *", { exact: true }).fill("Community care");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page
    .getByRole("row")
    .filter({ hasText: "Community care" })
    .getByRole("button", { name: "Deactivate" })
    .click();
  await page
    .getByRole("row")
    .filter({ hasText: "Community care" })
    .getByText("Inactive", { exact: true })
    .waitFor();
  await page
    .getByRole("tab", { name: "Receipt settings", exact: true })
    .click();
  await page.getByRole("button", { name: "Preview receipt" }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("button", { name: "Close dialog" }).click();

  await page.getByRole("tab", { name: "Bank accounts", exact: true }).click();
  await page.getByRole("button", { name: "Add bank account", exact: true }).click();
  await page.getByLabel("Name *", { exact: true }).fill("Mapped test account");
  await page.getByLabel("Bank details *", { exact: true }).fill("Sample bank · 1234 · SAMPLE0001");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByText("Mapped test account", { exact: true }).waitFor();
  const mappedBank = (await state()).masters.banks.find((bank) => bank.name === "Mapped test account");
  await page.getByRole("tab", { name: "Categories", exact: true }).click();
  await page.getByRole("button", { name: "Edit Gau Seva", exact: true }).click();
  await page.getByLabel("Bank account", { exact: true }).selectOption(mappedBank.id);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();

  await goto("/admin/pages/new");
  await page.getByLabel("Campaign title *").fill("Care together test campaign");
  await page
    .getByLabel("Description *")
    .fill("A demo page created by the browser smoke test.");
  await page.getByLabel("Fundraising target (₹) *").fill("50000");
  await page.getByLabel("Previously collected amount (₹)", { exact: true }).fill("1000");
  await page.getByLabel("Fodder seva", { exact: false }).check();
  await page.getByLabel("Default seva", { exact: true }).selectOption("s1");
  await page.getByLabel("Status", { exact: true }).selectOption("published");
  await page
    .getByRole("button", { name: "Create donation page", exact: true })
    .click();
  await page.waitForURL("**/admin/pages");
  await page
    .getByRole("heading", { name: "Care together test campaign" })
    .waitFor();
  await page.reload();
  await page
    .getByRole("heading", { name: "Care together test campaign" })
    .waitFor();
  const created = (await state()).campaigns.find(
    (c) => c.title === "Care together test campaign",
  );
  assert.ok(created);
  assert.equal(created.openingBalance, 1000);
  assert.equal(created.defaultSevaId, "s1");
  await goto(`/admin/pages/${created.id}/edit`);
  await page.getByLabel("Campaign title *").fill("Care together updated");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.waitForURL("**/admin/pages");
  await page.getByRole("heading", { name: "Care together updated" }).waitFor();

  await goto(`/donate/${created.slug}`);
  await page.getByText("₹1,000", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Make a contribution" }).click();
  assert.equal(await page.getByRole("radio", { name: "Fodder seva", exact: false }).isChecked(), true);
  await page.getByRole("button", { name: "₹1,100", exact: true }).click();
  await page.getByText("One thousand one hundred rupees only", { exact: true }).waitFor();
  await page.screenshot({ path: path.join(artifacts, "seva-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "No mobile seva overflow");
  await page.screenshot({ path: path.join(artifacts, "seva-mobile.png"), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Full name *").fill("Sample Donor");
  await page.getByLabel("Email address *").fill("sample@example.com");
  await page.getByLabel("Mobile number *", { exact: false }).fill("9876543210");
  await page.reload();
  await page.getByLabel("Full name *").waitFor();
  assert.equal(
    await page.getByLabel("Full name *").inputValue(),
    "Sample Donor",
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("checkbox", {
      name: "Request tax receipt details",
      exact: false,
    })
    .check();
  await page.getByLabel("PAN *", { exact: true }).fill("ABCDE1234F");
  await page.getByLabel("An occasion (optional)").selectOption("o1");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  assert.equal(await page.getByLabel("Occasion date *").inputValue(), today);
  await page.getByLabel("Occasion date *").fill("2026-11-03");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("heading", { name: "A moment to review" }).waitFor();
  await page.getByRole("button", { name: "Continue to demo payment" }).click();
  await page.getByRole("button", { name: "Simulate failed payment" }).click();
  await page.getByText("The demo payment failed.", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Simulate successful payment" })
    .click();
  await page
    .getByRole("heading", { name: "You made a difference, Sample." })
    .waitFor();
  const after = await state();
  assert.equal(
    after.donations
      .filter((d) => d.status === "success")
      .reduce((s, d) => s + d.amount, 0),
    initialTotal + 1100,
  );
  assert.equal(
    after.donations.filter((d) => d.email === "sample@example.com").length,
    1,
  );
  assert.equal(after.donations.find((donation) => donation.email === "sample@example.com").bankId, mappedBank.id);
  const receiptDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download receipt" }).click();
  const receipt = await receiptDownload;
  await receipt.saveAs(path.join(artifacts, receipt.suggestedFilename()));
  assert.ok(
    (
      await fs.readFile(
        path.join(artifacts, receipt.suggestedFilename()),
        "utf8",
      )
    ).includes("Sample Donor"),
  );
  await page.reload();
  await page
    .getByRole("heading", { name: "You made a difference, Sample." })
    .waitFor();
  assert.equal(
    (await state()).donations.filter((d) => d.email === "sample@example.com")
      .length,
    1,
  );
  await page.screenshot({
    path: path.join(artifacts, "donation-success.png"),
    fullPage: true,
  });

  // Masters submenu must work during client navigation, including query-only changes.
  await goto("/admin/masters");
  await page.getByRole("link", { name: "Donors", exact: true }).click();
  await page.getByRole("button", { name: "Record donation", exact: true }).click();
  const manual = page.getByRole("dialog");
  await manual.getByLabel("Full name *").fill("Manual Test Donor");
  await manual.getByLabel("Mobile number", { exact: true }).fill("9876501234");
  await manual.getByLabel("Email address", { exact: true }).fill("manual-test@example.com");
  await manual.getByLabel("Campaign *", { exact: true }).selectOption(created.id);
  await manual.getByLabel("Amount (₹) *", { exact: true }).fill("250.50");
  await manual.getByText("Two hundred fifty rupees and fifty paise only", { exact: true }).waitFor();
  await manual.getByLabel("Payment method *", { exact: true }).selectOption("upi");
  await manual.getByLabel("Payment reference (optional)").fill("UPI-SMOKE-1");
  await manual.getByRole("checkbox", { name: "I confirm this payment was received." }).check();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "No mobile manual-entry overflow");
  await page.screenshot({ path: path.join(artifacts, "manual-entry-mobile.png"), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await manual.getByRole("button", { name: "Record donation & generate receipt" }).click();
  await manual.getByRole("button", { name: "Download receipt" }).waitFor();
  const manualDownload = page.waitForEvent("download");
  await manual.getByRole("button", { name: "Download receipt" }).click();
  const manualReceipt = await manualDownload;
  await manualReceipt.saveAs(path.join(artifacts, manualReceipt.suggestedFilename()));
  const manualHtml = await fs.readFile(path.join(artifacts, manualReceipt.suggestedFilename()), "utf8");
  assert.ok(manualHtml.includes("UPI-SMOKE-1"));
  assert.ok(manualHtml.includes("Mapped test account"));
  await manual.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByLabel("Search donors", { exact: true }).fill("manual-test@example.com");
  await page.getByRole("button", { name: "View history", exact: true }).click();
  await page.getByRole("dialog").getByText("UPI-SMOKE-1", { exact: false }).waitFor();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("tab", { name: "Highest donors", exact: true }).click();
  await page.getByRole("columnheader", { name: "RANK", exact: true }).waitFor();
  await page.screenshot({ path: path.join(artifacts, "donors-desktop.png"), fullPage: true });
  await page.reload();
  await page.getByLabel("Search donors", { exact: true }).fill("manual-test@example.com");
  assert.equal((await state()).donations.filter((donation) => donation.email === "manual-test@example.com").length, 1);
  await goto(`/donate/${created.slug}`);
  await page.getByText("₹2,350.5", { exact: true }).waitFor();

  await goto("/donate/a-day-of-gau-seva");
  assert.equal(
    await page
      .getByRole("button", { name: "Make a contribution" })
      .isDisabled(),
    true,
  );
  await goto("/donate/a-little-care-a-better-life/payment");
  await page.getByText("Let’s start with your seva", { exact: true }).waitFor();
  await goto("/donate/not-a-real-campaign");
  await page
    .getByText("This page could not be found", { exact: true })
    .waitFor();
  await goto("/admin/pages/missing/edit");
  await page
    .getByText("This donation page could not be found", { exact: true })
    .waitFor();

  await page.setViewportSize({ width: 390, height: 844 });
  await goto("/");
  await page
    .getByRole("heading", { name: "A little care goes a long way." })
    .waitFor();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    "No mobile horizontal overflow",
  );
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.keyboard.press("Escape");
  assert.equal(
    await page.getByRole("dialog", { name: "Main navigation" }).count(),
    0,
  );
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Masters", exact: true }).click();
  await page
    .getByRole("heading", { name: "A foundation for giving" })
    .waitFor();
  await page.screenshot({
    path: path.join(artifacts, "masters-mobile.png"),
    fullPage: true,
    animations: "disabled",
  });
  await goto("/donate/a-little-care-a-better-life");
  await page.getByRole("button", { name: "Make a contribution" }).waitFor();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.screenshot({
    path: path.join(artifacts, "donor-mobile.png"),
    fullPage: true,
  });
  await goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("button", { name: "Reset demo data", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reset demo data", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      !JSON.parse(localStorage.getItem("gaushala-demo-v1")).campaigns.some(
        (c) => c.title === "Care together updated",
      ),
  );
  assert.deepEqual(errors, [], "No browser runtime errors");
  console.log(
    "PASS: campaigns/opening balances/default seva, bank mappings/snapshots, amount wording, occasion defaults, donor records/rankings/history, manual UPI entry/receipt/persistence, reports/CSV, online failure/retry/duplicate prevention, recovery, desktop/mobile layout, reset. Screenshots in .next/qa/artifacts.",
  );
} finally {
  await browser.close();
}
