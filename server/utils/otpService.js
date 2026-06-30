import crypto from 'crypto';
import Otp from '../models/Otp.js';
import User from '../models/User.js';

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export const generateOtp = () =>
  crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');

const getOtpPepper = () =>
  process.env.OTP_SECRET || process.env.JWT_SECRET || 'vidyasathi-otp-pepper';

export const hashOtp = (otp) =>
  crypto.createHmac('sha256', getOtpPepper()).update(otp).digest('hex');

export const normalizeEmail = (email) => email.toLowerCase().trim();

export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** Gmail ignores dots — canonical form for lookup & OTP storage */
export const canonicalEmail = (email) => {
  const e = normalizeEmail(email);
  const at = e.lastIndexOf('@');
  if (at === -1) return e;

  let local = e.slice(0, at);
  let domain = e.slice(at + 1);

  if (domain === 'googlemail.com') domain = 'gmail.com';
  if (domain === 'gmail.com') {
    local = local.replace(/\./g, '');
  }

  return `${local}@${domain}`;
};

/** Find user even if Gmail dots differ from registration (e.g. a.b@gmail vs ab@gmail) */
export const findUserByEmail = async (email) => {
  const trimmed = normalizeEmail(email);
  const canonical = canonicalEmail(trimmed);

  let user = await User.findOne({ email: { $in: [trimmed, canonical] } });
  if (user) return user;

  if (!canonical.endsWith('@gmail.com')) {
    return null;
  }

  const gmailUsers = await User.find({ email: /@gmail\.com$/i }).select('email');
  const match = gmailUsers.find((u) => canonicalEmail(u.email) === canonical);
  if (!match) return null;

  return User.findById(match._id);
};

export const createAndStoreOtp = async (email, purpose) => {
  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const key = canonicalEmail(email);

  await Otp.deleteMany({ email: key, purpose });
  await Otp.create({
    email: key,
    otpHash,
    purpose,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
  });

  return otp;
};

export const verifyOtpCode = async (email, purpose, otp) => {
  if (!otp || !/^\d{6}$/.test(otp)) {
    return { valid: false, message: 'Please enter a valid 6-digit OTP' };
  }

  const key = canonicalEmail(email);

  const record = await Otp.findOne({
    email: key,
    purpose,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!record) {
    return { valid: false, message: 'OTP expired or not found. Please request a new one.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await Otp.deleteOne({ _id: record._id });
    return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
  }

  const candidateHash = hashOtp(otp);
  const stored = record.otpHash;
  const match =
    stored.length === candidateHash.length &&
    crypto.timingSafeEqual(Buffer.from(stored, 'hex'), Buffer.from(candidateHash, 'hex'));

  if (!match) {
    record.attempts += 1;
    await record.save();
    return {
      valid: false,
      message: `Invalid OTP. ${MAX_ATTEMPTS - record.attempts} attempts remaining.`,
    };
  }

  await Otp.deleteOne({ _id: record._id });
  return { valid: true };
};
