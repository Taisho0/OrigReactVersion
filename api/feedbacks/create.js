import { getFirebaseAdmin } from "../_lib/firebaseAdmin.js";

const readBearerToken = (req) => {
  const authHeader = String(req.headers?.authorization || "").trim();
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authHeader.slice(7).trim();
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed." });
  }

  try {
    const actorToken = readBearerToken(req);
    const orderId = String(req.body?.orderId || "").trim();
    const rating = Number(req.body?.rating || 0);
    const comment = String(req.body?.comment || "").trim();

    if (!actorToken) {
      return res.status(401).json({ message: "Missing bearer token." });
    }

    if (!orderId) {
      return res.status(400).json({ message: "orderId is required." });
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "rating must be between 1 and 5." });
    }

    if (!comment) {
      return res.status(400).json({ message: "comment is required." });
    }

    const { auth: adminAuth, db: adminDb } = getFirebaseAdmin();
    const decoded = await adminAuth.verifyIdToken(actorToken);
    const orderSnapshot = await adminDb.collection("orders").doc(orderId).get();

    if (!orderSnapshot.exists) {
      return res.status(404).json({ message: "Order not found." });
    }

    const order = orderSnapshot.data() || {};

    if (order.purchaserUid !== decoded.uid) {
      return res.status(403).json({ message: "You can only send feedback for your own orders." });
    }

    if (!["Complete", "Delivered"].includes(order.status)) {
      return res.status(400).json({ message: "Only completed orders can receive feedback." });
    }

    const submittedAt = new Date().toISOString();

    const feedbackPayload = {
      feedbackId: orderId,
      orderId: order.id || "",
      orderFirestoreId: orderId,
      orderStatus: order.status || "",
      orderDate: order.date || submittedAt,
      orderTotal: Number(order.total || 0),
      purchaserUid: order.purchaserUid || decoded.uid,
      customerEmail: order.purchaserEmail || order.shipping?.email || decoded.email || "",
      customerName: `${order.shipping?.firstName || ""} ${order.shipping?.lastName || ""}`.trim(),
      rating: Math.round(rating),
      comment,
      submittedAt,
    };

    await adminDb.collection("feedbacks").add(feedbackPayload);

    return res.status(200).json({ ok: true, feedback: feedbackPayload });
  } catch (error) {
    const status = error?.code === "auth/id-token-expired" || error?.code === "auth/argument-error" ? 401 : 500;
    return res.status(status).json({ message: error?.message || "Unable to submit feedback." });
  }
}
