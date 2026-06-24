// /tempStorage/otpStore.js

// Map<email, { otp: string, expiresAt: number, verified: boolean }>
const otpStore = new Map();

function saveOtp(email, otp, ttlMs = 5 * 60 * 1000) {
  otpStore.set(email, {
    otp: String(otp),              // keep as string
    expiresAt: Date.now() + ttlMs, // default 5 minutes
    verified: false,               // not verified yet
  });
}

function getOtp(email) {
  return otpStore.get(email);
}

function markVerified(email) {
  const entry = otpStore.get(email);
  if (entry) otpStore.set(email, { ...entry, verified: true });
}

function deleteOtp(email) {
  otpStore.delete(email);
}

/**
 * Validate OTP for signup and consume it.
 * - If already verified via /verify-otp → pass
 * - Else require incomingOtp to match & not be expired
 * - On success, delete the entry (consume)
 */
function validateAndConsume(email, incomingOtp) {
  const entry = otpStore.get(email);
  if (!entry || entry.expiresAt < Date.now()) return { ok: false, reason: "expired_or_missing" };

  if (entry.verified === true) {
    otpStore.delete(email);
    return { ok: true };
  }

  if (String(incomingOtp) !== String(entry.otp)) return { ok: false, reason: "mismatch" };

  otpStore.delete(email);
  return { ok: true };
}

module.exports = {
  saveOtp,
  getOtp,
  markVerified,
  deleteOtp,
  validateAndConsume,
};
