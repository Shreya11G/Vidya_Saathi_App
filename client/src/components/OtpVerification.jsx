import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';

const OtpVerification = ({
  email,
  purpose,
  otp,
  onOtpChange,
  onOtpSent,
  disabled = false,
  useAuthenticatedEndpoint = false,
  autoSend = false,
}) => {
  const [sending, setSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [countdown, setCountdown] = useState(0);
  const autoSentRef = useRef(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = useCallback(async () => {
    if (!email?.trim()) {
      toast.error('Please enter your email address first');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSending(true);
    const toastId = toast.loading('Sending OTP to your email...');

    try {
      const endpoint = useAuthenticatedEndpoint
        ? '/auth/send-otp-authenticated'
        : '/auth/send-otp';

      const payload = useAuthenticatedEndpoint
        ? {}
        : { email: email.trim(), purpose };

      const response = await api.post(endpoint, payload);

      if (response.data.success) {
        setOtpSent(true);
        setSentTo(response.data.sentTo || email.trim());
        setCountdown(60);
        onOtpSent?.();

        if (response.data.devMode) {
          toast.success('OTP sent! Check the server terminal in dev mode.', { id: toastId });
        } else {
          toast.success('OTP sent to your email', { id: toastId });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP', { id: toastId });
    } finally {
      setSending(false);
    }
  }, [email, purpose, useAuthenticatedEndpoint, onOtpSent]);

  useEffect(() => {
    if (autoSend && email?.trim() && !autoSentRef.current) {
      autoSentRef.current = true;
      handleSendOtp();
    }
  }, [autoSend, email, handleSendOtp]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email Verification Code
        </label>
        <button
          type="button"
          onClick={handleSendOtp}
          disabled={disabled || sending || countdown > 0 || !email?.trim()}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
        >
          {sending ? (
            <LoadingSpinner size="small" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {sending
            ? 'Sending...'
            : countdown > 0
              ? `Resend in ${countdown}s`
              : otpSent
                ? 'Resend OTP'
                : 'Send OTP'}
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Mail className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={otp}
          onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white tracking-[0.5em] text-center font-mono text-lg"
          placeholder="000000"
          disabled={disabled || sending}
          autoComplete="one-time-code"
        />
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {sending
          ? 'Sending verification code — this may take a few seconds...'
          : otpSent
            ? `A 6-digit code was sent to ${sentTo || email}. Check inbox and spam. Expires in 10 minutes.`
            : 'Click "Send OTP" to receive a verification code in your email.'}
      </p>
    </div>
  );
};

export default OtpVerification;
