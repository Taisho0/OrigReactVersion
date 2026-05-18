import { allowedAdminEmails, getFirebaseAdmin } from "../_lib/firebaseAdmin.js";

const normalizeEmail = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "");
const isActiveAdmin = (profile = {}) => profile.role === "admin" && profile.status !== "deleted" && profile.status !== "suspended";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed." });
  }

  try {
    const actorToken = String(req.body?.actorToken || "").trim();
    const itemId = String(req.body?.itemId || "").trim();

    if (!actorToken || !itemId) {
      return res.status(400).json({ message: "actorToken and itemId are required." });
    }

    const { auth: adminAuth, db: adminDb } = getFirebaseAdmin();
    const decoded = await adminAuth.verifyIdToken(actorToken);

    const actorDoc = await adminDb.collection("users").doc(decoded.uid).get();
    const actorProfile = actorDoc.exists ? actorDoc.data() : null;
    const actorEmail = normalizeEmail(decoded.email || "");

    if (!isActiveAdmin(actorProfile) && !allowedAdminEmails.includes(actorEmail)) {
      return res.status(403).json({ message: "Only active admins can remove showcase items." });
    }

    const docRef = adminDb.collection("showcase").doc(itemId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({ message: "Showcase item not found." });
    }

    await docRef.delete();
    return res.status(200).json({ ok: true, itemId });
  } catch (error) {
    const status = error?.code === "auth/id-token-expired" || error?.code === "auth/argument-error" ? 401 : 500;
    return res.status(status).json({ message: error?.message || "Unable to remove showcase item." });
  }
}
