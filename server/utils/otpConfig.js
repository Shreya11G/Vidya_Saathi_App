/** OTP is required only when OTP_ENABLED=true in server/.env */
export const isOtpEnabled = () => process.env.OTP_ENABLED === 'true';
