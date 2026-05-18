import { getFirebaseAdmin } from "../_lib/firebaseAdmin.js";
import { allowedAdminEmails } from "../_lib/firebaseAdmin.js";
import {
  createOtpRecord,
  generateOtpCode,
  normalizeEmail,
  sendBrevoOtpEmail,
  createResetTokenRecord,
  generateResetToken,
  hasExceededMaxAttempts,
  isOtpExpired,
  isResetTokenExpired,
} from "../_lib/otpService.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isActiveAdmin = (profile = {}) => profile.role === "admin" && profile.status !== "deleted" && profile.status !== "suspended";

// Handler for send-otp endpoint
async function handleSendOtp(req, res) {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email || !EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    const { auth, db } = getFirebaseAdmin();

    // If caller indicates this is a signup flow, do NOT require an existing account.
    const action = String(req.body?.action || req.query?.action || req.query?.mode || "").toLowerCase();
    const isSignupFlow = action === "signup";

    if (!isSignupFlow) {
      try {
        await auth.getUserByEmail(email);
      } catch (error) {
        if (error?.code === "auth/user-not-found") {
          return res.status(404).json({ message: "No account found with this email address." });
        }

        throw error;
      }
    }

    const code = generateOtpCode();
    const otpRef = db.collection("password_reset_otps").doc(email);
    await otpRef.set(createOtpRecord(email, code));

    try {
      await sendBrevoOtpEmail(email, code);
    } catch (error) {
      await otpRef.delete().catch(() => {});

      if (error?.status === 401) {
        return res.status(503).json({
          message: "Brevo rejected the API key with 401 Unauthorized. Check the Brevo API key or sender configuration.",
          details: error?.details || error?.message || null,
        });
      }

      return res.status(500).json({ message: error?.message || "Failed to send verification code." });
    }

    return res.status(200).json({ ok: true, message: `Verification code sent to ${email}.`, email });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Failed to send verification code." });
  }
}

// Handler for verify-otp endpoint
async function handleVerifyOtp(req, res) {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || "").trim();

    if (!email || !EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    if (!code) {
      return res.status(400).json({ message: "Please provide the verification code." });
    }

    const { auth, db } = getFirebaseAdmin();

    // Allow verify for signup flows: when action=signup skip existing-account check
    const action = String(req.body?.action || req.query?.action || req.query?.mode || "").toLowerCase();
    const isSignupFlow = action === "signup";

    if (!isSignupFlow) {
      try {
        await auth.getUserByEmail(email);
      } catch (error) {
        if (error?.code === "auth/user-not-found") {
          return res.status(404).json({ message: "No account found with this email address." });
        }

        throw error;
      }
    }

    const otpRef = db.collection("password_reset_otps").doc(email);
    const otpSnapshot = await otpRef.get();

    if (!otpSnapshot.exists) {
      return res.status(400).json({ message: "No active verification request found. Please request a new code." });
    }

    const otpRecord = otpSnapshot.data();

    if (isOtpExpired(otpRecord)) {
      await otpRef.delete();
      return res.status(400).json({ message: "The verification code has expired. Please request a new one." });
    }

    if (hasExceededMaxAttempts(otpRecord)) {
      await otpRef.delete();
      return res.status(429).json({ message: "Too many incorrect attempts. Please request a new verification code." });
    }

    if (String(otpRecord?.code || "") !== code) {
      const nextAttempts = (otpRecord.attempts || 0) + 1;
      await otpRef.update({ attempts: nextAttempts });
      return res.status(400).json({
        message: `Invalid verification code. ${Math.max((otpRecord.maxAttempts || 5) - nextAttempts, 0)} attempt(s) remaining.`,
      });
    }

    const resetToken = generateResetToken();
    await db.collection("password_reset_tokens").doc(resetToken).set(createResetTokenRecord(email, resetToken));
    await otpRef.update({ verified: true, resetToken });

    return res.status(200).json({ ok: true, message: "Verification succeeded.", resetToken, email });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Failed to verify code." });
  }
}

// Handler for reset-password endpoint
async function handleResetPassword(req, res) {
  try {
    const email = normalizeEmail(req.body?.email);
    const resetToken = String(req.body?.resetToken || "").trim();
    const password = String(req.body?.password || "").trim();

    if (!email || !EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    if (!resetToken) {
      return res.status(400).json({ message: "Your reset session expired. Please verify the OTP again." });
    }

    if (!password) {
      return res.status(400).json({ message: "Please provide a new password." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password is too weak. Use at least 6 characters." });
    }

    const { auth, db } = getFirebaseAdmin();
    const tokenRef = db.collection("password_reset_tokens").doc(resetToken);
    const tokenSnapshot = await tokenRef.get();

    if (!tokenSnapshot.exists) {
      return res.status(400).json({ message: "Invalid or expired password reset token. Please verify the OTP again." });
    }

    const tokenRecord = tokenSnapshot.data();

    if (tokenRecord.email !== email) {
      return res.status(400).json({ message: "Reset token does not match the provided email address." });
    }

    if (tokenRecord.used) {
      return res.status(400).json({ message: "This reset session has already been used. Please request a new one." });
    }

    if (isResetTokenExpired(tokenRecord)) {
      await tokenRef.delete();
      return res.status(400).json({ message: "Your reset session has expired. Please verify the OTP again." });
    }

    const userRecord = await auth.getUserByEmail(email);
    await auth.updateUser(userRecord.uid, { password });
    await auth.revokeRefreshTokens(userRecord.uid);
    await tokenRef.update({ used: true, usedAt: new Date().toISOString() });

    await db.collection("password_reset_otps").doc(email).delete().catch(() => {});

    return res.status(200).json({ ok: true, message: "Password updated successfully." });
  } catch (error) {
    if (error?.code === "auth/user-not-found") {
      return res.status(404).json({ message: "No account found with this email address." });
    }

    return res.status(500).json({ message: error?.message || "Failed to reset password." });
  }
}

// Handler for delete-user endpoint
async function handleDeleteUser(req, res) {
  try {
    const targetUid = String(req.body?.targetUid || "").trim();
    const actorToken = String(req.body?.actorToken || "").trim();

    if (!targetUid || !actorToken) {
      return res.status(400).json({ message: "targetUid and actorToken are required." });
    }

    const { auth, db } = getFirebaseAdmin();
    const decoded = await auth.verifyIdToken(actorToken);

    const actorProfileRef = db.collection("users").doc(decoded.uid);
    const actorProfileSnapshot = await actorProfileRef.get();
    const actorProfile = actorProfileSnapshot.exists ? actorProfileSnapshot.data() : null;
    const actorEmail = String(decoded.email || "").toLowerCase();

    const canDeleteUser = isActiveAdmin(actorProfile) || allowedAdminEmails.includes(actorEmail);

    if (!canDeleteUser) {
      return res.status(403).json({ message: "Only active admins can delete user accounts." });
    }

    if (decoded.uid === targetUid) {
      return res.status(400).json({ message: "Admins cannot delete their own account from this endpoint." });
    }

    await auth.deleteUser(targetUid);
    return res.status(200).json({ ok: true, deletedUid: targetUid });
  } catch (error) {
    if (error?.code === "auth/user-not-found") {
      return res.status(200).json({ ok: true, alreadyDeleted: true });
    }

    return res.status(500).json({
      message: error?.message || "Failed to delete Firebase Authentication user.",
    });
  }
}

// Main handler router
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed." });
  }

  let action = String(req.body?.action || req.query?.action || "").toLowerCase();

  // Infer action from request parameters if not explicitly provided
  if (!action) {
    if (req.body?.resetToken && req.body?.password) {
      action = "reset-password";
    } else if (req.body?.targetUid && req.body?.actorToken) {
      action = "delete-user";
    } else if (req.body?.code) {
      action = "verify-otp";
    } else if (req.body?.email) {
      action = "send-otp";
    }
  }

  switch (action) {
    case "send-otp":
      return handleSendOtp(req, res);
    case "verify-otp":
      return handleVerifyOtp(req, res);
    case "reset-password":
      return handleResetPassword(req, res);
    case "delete-user":
      return handleDeleteUser(req, res);
    default:
      return res.status(400).json({
        message: "Invalid action. Use: send-otp, verify-otp, reset-password, or delete-user.",
      });
  }
}
