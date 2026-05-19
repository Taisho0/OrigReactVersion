import crypto from "crypto";
import { allowedAdminEmails, getFirebaseAdmin } from "../_lib/firebaseAdmin.js";

const normalizeEmail = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "");
const isActiveAdmin = (profile = {}) => profile.role === "admin" && profile.status !== "deleted" && profile.status !== "suspended";

const parseDataUrl = (dataUrl) => {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i.exec(dataUrl || "");
  if (!match) {
    throw new Error("Invalid showcase image payload.");
  }

  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
};

// Handler for GET showcase items
async function handleGetShowcase(req, res) {
  try {
    const { db } = getFirebaseAdmin();
    const category = typeof req.query?.category === "string" && req.query.category.trim() ? req.query.category.trim() : "";

    let queryRef = db.collection("showcase").orderBy("createdAt", "desc");
    if (category) {
      queryRef = queryRef.where("category", "==", category);
    }

    try {
      const snapshot = await queryRef.get();
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));
      return res.status(200).json({ ok: true, items });
    } catch {
      const allSnapshot = await db.collection("showcase").get();
      let items = allSnapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));

      if (category) {
        items = items.filter((item) => String(item.category || "") === category);
      }

      items.sort((a, b) => {
        const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
        const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
        return tb - ta;
      });

      return res.status(200).json({ ok: true, items });
    }
  } catch (error) {
    return res.status(500).json({ ok: false, message: error?.message || "Unable to load showcase items." });
  }
}

// Handler for POST upload showcase item
async function handleUploadShowcase(req, res) {
  try {
    const actorToken = String(req.body?.actorToken || "").trim();
    const fileName = String(req.body?.fileName || "showcase-image").trim();
    const dataUrl = String(req.body?.dataUrl || "").trim();

    if (!actorToken || !dataUrl) {
      return res.status(400).json({ message: "actorToken and dataUrl are required." });
    }

    const { auth: adminAuth, db: adminDb, storage } = getFirebaseAdmin();
    const decoded = await adminAuth.verifyIdToken(actorToken);

    const actorDoc = await adminDb.collection("users").doc(decoded.uid).get();
    const actorProfile = actorDoc.exists ? actorDoc.data() : null;
    const actorEmail = normalizeEmail(decoded.email || "");

    if (!isActiveAdmin(actorProfile) && !allowedAdminEmails.includes(actorEmail)) {
      return res.status(403).json({ message: "Only active admins can upload showcase items." });
    }

    const { buffer, contentType } = parseDataUrl(dataUrl);
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `showcase/${Date.now()}-${safeFileName}`;
    const file = storage.bucket().file(storagePath);
    const downloadToken = crypto.randomUUID();

    await file.save(buffer, {
      resumable: false,
      metadata: {
        contentType,
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.bucket().name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${downloadToken}`;

    const item = {
      category: String(req.body?.category || "").trim(),
      productId: String(req.body?.productId || "").trim(),
      productName: String(req.body?.productName || "").trim(),
      title: String(req.body?.title || "").trim(),
      description: String(req.body?.description || "").trim(),
      imageUrl,
      createdAt: new Date().toISOString(),
      createdBy: decoded.uid,
    };

    const docRef = await adminDb.collection("showcase").add(item);
    return res.status(200).json({ ok: true, id: docRef.id, item: { id: docRef.id, ...item } });
  } catch (error) {
    const status = error?.code === "auth/id-token-expired" || error?.code === "auth/argument-error" ? 401 : 500;
    return res.status(status).json({ message: error?.message || "Unable to upload showcase image." });
  }
}

// Handler for DELETE showcase item
async function handleDeleteShowcase(req, res) {
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

// Main handler router
export default async function handler(req, res) {
  if (req.method === "GET") {
    return handleGetShowcase(req, res);
  }

  if (req.method === "POST") {
    const action = String(req.body?.action || req.query?.action || "").toLowerCase();
    if (action === "delete") {
      return handleDeleteShowcase(req, res);
    }
    return handleUploadShowcase(req, res);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ message: "Method not allowed." });
}
