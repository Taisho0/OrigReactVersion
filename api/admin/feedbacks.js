import { getFirebaseAdmin, allowedAdminEmails } from '../_lib/firebaseAdmin.js';

const readBearerToken = (req) => {
  const authHeader = String(req.headers?.authorization || '').trim();
  if (!authHeader.toLowerCase().startsWith('bearer ')) return '';
  return authHeader.slice(7).trim();
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  try {
    const actorToken = readBearerToken(req);
    if (!actorToken) return res.status(401).json({ message: 'Missing bearer token.' });

    const { auth: adminAuth, db: adminDb } = getFirebaseAdmin();
    const decoded = await adminAuth.verifyIdToken(actorToken);

    const email = String(decoded.email || '').toLowerCase();
    const uid = String(decoded.uid || '');

    let isAdmin = false;
    if (allowedAdminEmails.includes(email)) isAdmin = true;

    if (!isAdmin) {
      const userDoc = await adminDb.collection('users').doc(uid).get();
      if (userDoc.exists) {
        const data = userDoc.data() || {};
        if (String(data.role || '') === 'admin' && String(data.status || '') !== 'deleted' && String(data.status || '') !== 'suspended') {
          isAdmin = true;
        }
      }
    }

    if (!isAdmin) return res.status(403).json({ message: 'Admin access required.' });

    const snapshot = await adminDb.collection('feedbacks').orderBy('submittedAt', 'desc').get();
    const feedbacks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    return res.status(200).json({ ok: true, feedbacks });
  } catch (err) {
    const status = err?.code === 'auth/id-token-expired' || err?.code === 'auth/argument-error' ? 401 : 500;
    return res.status(status).json({ message: err?.message || 'Unable to fetch feedbacks.' });
  }
}
