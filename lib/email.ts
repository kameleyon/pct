import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM = process.env.EMAIL_FROM || 'Precision CNC Tools <onboarding@resend.dev>';

/** Best-effort send — logs and swallows failures so a broken email integration
 *  never breaks the checkout/webhook flow that triggers it. */
export async function sendEmail(to: string | string[], subject: string, html: string): Promise<void> {
  try {
    const { error } = await getResend().emails.send({ from: FROM, to, subject, html });
    if (error) console.error('Email send failed:', error);
  } catch (e) {
    console.error('Email send failed:', e);
  }
}

/** Comma-separated ORDER_NOTIFICATION_EMAILS env var → clean address list. */
export function getOrderNotificationRecipients(): string[] {
  return (process.env.ORDER_NOTIFICATION_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const wrap = (title: string, body: string) => `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#2B2A26">
    <h2 style="color:#1a5c34;margin:0 0 16px">${title}</h2>
    ${body}
  </div>
`;

export function affiliateSaleEmail(opts: { saleAmount: number; affiliateAmount: number; maturesAt: Date }) {
  return wrap(
    'You just earned a commission',
    `<p>A sale was just placed through your referral link.</p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0">
       <tr><td style="padding:6px 0;color:#6b6a63">Sale amount</td><td style="padding:6px 0;text-align:right;font-weight:600">${money(opts.saleAmount)}</td></tr>
       <tr><td style="padding:6px 0;color:#6b6a63">Your commission</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1a5c34">${money(opts.affiliateAmount)}</td></tr>
     </table>
     <p style="color:#6b6a63;font-size:13px">This commission is currently maturing and will become available to request on <b>${opts.maturesAt.toLocaleDateString()}</b>. You can track all your referred sales in your affiliate portal.</p>`
  );
}

export function orderPlacedEmail(opts: { orderId: string; total: number; email: string | null; itemCount: number }) {
  return wrap(
    'New order placed',
    `<table style="width:100%;border-collapse:collapse;margin:16px 0">
       <tr><td style="padding:6px 0;color:#6b6a63">Order</td><td style="padding:6px 0;text-align:right;font-family:monospace">${opts.orderId.slice(0, 8)}…</td></tr>
       <tr><td style="padding:6px 0;color:#6b6a63">Customer</td><td style="padding:6px 0;text-align:right">${opts.email ?? '—'}</td></tr>
       <tr><td style="padding:6px 0;color:#6b6a63">Items</td><td style="padding:6px 0;text-align:right">${opts.itemCount}</td></tr>
       <tr><td style="padding:6px 0;color:#6b6a63">Total</td><td style="padding:6px 0;text-align:right;font-weight:600">${money(opts.total)}</td></tr>
     </table>`
  );
}
