import { allowedAdminEmails, getFirebaseAdmin } from '../../_lib/firebaseAdmin.js';

const BREVO_API_KEY = process.env.BREVO_API_KEY?.trim();
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME?.trim() || 'Originals Printing';
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL?.trim() || 'noreply@originalsprinting.local';

const readBearerToken = (req) => {
  const authHeader = String(req.headers?.authorization || '').trim();
  if (!authHeader.toLowerCase().startsWith('bearer ')) return '';
  return authHeader.slice(7).trim();
};

const normalizeEmail = (value) => typeof value === 'string' ? value.trim().toLowerCase() : '';

const isActiveAdmin = (profile = {}) => profile.role === 'admin' && profile.status !== 'deleted' && profile.status !== 'suspended';

const sendBrevoEmail = async (email, subject, htmlContent, textContent) => {
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not configured.');
  }

  const payload = {
    sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
    to: [{ email }],
    subject,
    htmlContent,
    textContent: textContent || htmlContent.replace(/<[^>]+>/g, ''),
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': BREVO_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await response.text();
  let responseBody = null;
  try {
    responseBody = JSON.parse(bodyText);
  } catch {
    responseBody = bodyText;
  }

  if (!response.ok) {
    const error = new Error(`Brevo request failed: ${response.status} ${typeof responseBody === 'string' ? responseBody : responseBody?.message || JSON.stringify(responseBody)}`);
    error.status = response.status;
    error.details = responseBody;
    throw error;
  }

  return responseBody || {};
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  try {
    const actorToken = readBearerToken(req);
    if (!actorToken) return res.status(401).json({ message: 'Missing bearer token.' });

    const { auth: adminAuth, db: adminDb } = getFirebaseAdmin();
    const decoded = await adminAuth.verifyIdToken(actorToken);

    const actorProfileSnapshot = await adminDb.collection('users').doc(decoded.uid).get();
    const actorProfile = actorProfileSnapshot.exists ? actorProfileSnapshot.data() : null;
    const actorEmail = normalizeEmail(decoded.email || '');
    const canNotify = isActiveAdmin(actorProfile) || allowedAdminEmails.includes(actorEmail);

    if (!canNotify) {
      return res.status(403).json({ message: 'Only active admins can send notifications.' });
    }

    const orderId = String(req.body?.orderId || '').trim();
    const action = String(req.body?.action || '').trim();
    const reason = String(req.body?.reason || '').trim();

    if (!orderId || !['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'Invalid request. Provide orderId and action (approved|rejected).' });
    }

    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const order = orderDoc.data() || {};
    const purchaserEmail = String(order.purchaserEmail || order.shipping?.email || '').trim();
    if (!purchaserEmail) {
      return res.status(400).json({ message: 'Order has no purchaser email.' });
    }

    const customerName = `${order.shipping?.firstName || ''} ${order.shipping?.lastName || ''}`.trim();
    const greetingName = customerName || 'Customer';

    let subject = '';
    let html = '';
    let text = '';

    if (action === 'approved') {
      subject = `Your Originals order ${order.id || orderId} has been approved`;
      html = `<p>Hello ${greetingName},</p><p>Your payment for order <strong>${order.id || orderId}</strong> has been approved. We will process and ship your order shortly.</p><p>Thank you for shopping with Originals Printing Co.</p>`;
      text = `Hello ${greetingName}, Your payment for order ${order.id || orderId} has been approved. We will process and ship your order shortly. Thank you for shopping with Originals Printing Co.`;
    } else {
      subject = `Your Originals order ${order.id || orderId} payment was rejected`;
      html = `<p>Hello ${greetingName},</p><p>We're sorry, the payment for order <strong>${order.id || orderId}</strong> was rejected.</p>${reason ? `<p>Reason: ${reason}</p>` : ''}<p>Please reach out to support if you need assistance.</p>`;
      text = `Hello ${greetingName}, We're sorry, the payment for order ${order.id || orderId} was rejected.${reason ? ` Reason: ${reason}` : ''} Please reach out to support if you need assistance.`;
    }

    await sendBrevoEmail(purchaserEmail, subject, html, text);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Unable to send order notification:', err);
    const status = err?.code === 'auth/id-token-expired' || err?.code === 'auth/argument-error' ? 401 : err?.status || 500;
    return res.status(status).json({ message: err?.message || 'Unable to send notification.' });
  }
}
