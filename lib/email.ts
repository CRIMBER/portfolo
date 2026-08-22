import { Resend } from "resend";

// Best-effort only, matching lib/analytics.ts's recordPageView — a
// signup or an approval/rejection must never fail (or even feel
// slow) because an email provider hiccuped or RESEND_API_KEY isn't
// set yet. Every call site awaits this but ignores its result.
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`RESEND_API_KEY not set — skipping email "${subject}" to ${to}`);
    return;
  }
  try {
    const resend = new Resend(apiKey);
    // resend.dev requires no domain verification, so this works out
    // of the box — swap for an address on your own verified domain
    // once you've set one up in the Resend dashboard.
    await resend.emails.send({ from: "Portfolio Platform <onboarding@resend.dev>", to, subject, html });
  } catch (error) {
    console.warn(`Failed to send email "${subject}" to ${to}:`, error);
  }
}

function dashboardUrl(path: string): string {
  const origin = process.env.SITE_URL ?? "http://localhost:3000";
  return `${origin}${path}`;
}

export async function sendNewSignupEmail(ownerEmail: string, applicantEmail: string): Promise<void> {
  await sendEmail(
    ownerEmail,
    "New sign-up waiting for approval",
    `<p><strong>${escapeHtml(applicantEmail)}</strong> just signed up and is waiting for your approval.</p>
     <p><a href="${dashboardUrl("/admin")}">Review in Admin →</a></p>`,
  );
}

export async function sendApprovalStatusEmail(memberEmail: string, status: "APPROVED" | "REJECTED"): Promise<void> {
  const approved = status === "APPROVED";
  await sendEmail(
    memberEmail,
    approved ? "You're approved!" : "Your sign-up request",
    approved
      ? `<p>You're approved — you can now build and publish your portfolio.</p>
         <p><a href="${dashboardUrl("/dashboard")}">Go to your dashboard →</a></p>`
      : `<p>Your request to join wasn't approved this time.</p>`,
  );
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
