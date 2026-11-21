import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle2, Building2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { DecorBizLogo } from '../../design/DecorBizLogo';

/**
 * Staff Login View (/erp/login)
 * PRD Section 2.2 & Implementation Plan Section 2
 * Staff only via Owner invitation (no public staff sign up).
 * Includes noindex meta tag.
 */
export const StaffLoginView: React.FC = () => {
  const { signIn, sendPasswordReset, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError('Please enter your staff email address');
      return;
    }

    if (isForgotPassword) {
      setIsSubmitting(true);
      try {
        await sendPasswordReset(email.trim());
        setResetSent(true);
      } catch (err: any) {
        setLocalError(err.message || 'Failed to send password reset email');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!password) {
      setLocalError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn({ email: email.trim(), password });
      window.location.href = '/erp';
    } catch (err: any) {
      setLocalError(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F3EE] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#1F4D3A]/20 selection:text-[#1F4D3A]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-block mb-4">
          <DecorBizLogo size="lg" showTagline={true} />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-[#1C1917]">
          {isForgotPassword ? 'Reset Staff Password' : 'Staff Showroom Access'}
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          {isForgotPassword
            ? 'Enter your registered email to receive a recovery link'
            : 'Private ERP system for authorized showroom personnel'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#E7E5E4] rounded-2xl sm:px-10">
          {(error || localError) && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
              <span>{error || localError}</span>
            </div>
          )}

          {resetSent ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-[#1C1917]">Reset Link Dispatched</h3>
              <p className="text-xs text-stone-600">
                A password reset email has been sent to <strong>{email}</strong>. Please check your inbox.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setResetSent(false);
                }}
                className="mt-4 text-xs font-semibold text-[#1F4D3A] hover:underline"
              >
                Return to Staff Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Staff Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="staff@decorstudio.in"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 focus:border-[#1F4D3A]"
                  />
                </div>
              </div>

              {!isForgotPassword && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-stone-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-[11px] font-semibold text-[#1F4D3A] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 focus:border-[#1F4D3A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#1F4D3A] hover:bg-[#143528] text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-60"
              >
                {isSubmitting
                  ? 'Verifying credentials...'
                  : isForgotPassword
                  ? 'Send Reset Link'
                  : 'Sign In to Showroom'}
              </button>

              {isForgotPassword && (
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="w-full text-center text-xs font-semibold text-stone-500 hover:text-stone-800 pt-2 flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>
              )}
            </form>
          )}

          {!isForgotPassword && !resetSent && (
            <div className="mt-6 pt-5 border-t border-[#E7E5E4] text-center">
              <p className="text-xs text-[#57534E] mb-2.5">
                Setting up DecorBiz for the first time with no showroom workspace yet?
              </p>
              <a
                href="/create-workspace"
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, '', '/create-workspace');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-[#1F4D3A] text-[#1F4D3A] hover:bg-[#1F4D3A]/5 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Building2 className="w-4 h-4" />
                <span>Create Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
