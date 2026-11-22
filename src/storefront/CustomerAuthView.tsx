import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { DecorBizLogo } from '../design/DecorBizLogo';
import {
  customerAccountService,
  type CustomerAccountType,
} from '../services/customerAccountService';

/**
 * Customer Authentication View (/account/login)
 * PRD Section 11.4
 * Collects name, email, password, phone, customer type (retail, contractor, plumber, architect, mason, dealer)
 * and persists the customer profile in Cloud Firestore (/customers/{uid} and /users/{uid}).
 */
export const CustomerAuthView: React.FC = () => {
  const { signIn, signUp, error, clearError } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [customerType, setCustomerType] = useState<CustomerAccountType>('retail');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedEmail || !password) {
      setLocalError('Please complete all required fields.');
      return;
    }

    if (isRegister && !trimmedName) {
      setLocalError('Please enter your full name.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegister) {
        const authUser = await signUp({
          email: trimmedEmail,
          password,
          displayName: trimmedName,
        });

        await customerAccountService.syncCustomerAccountOnAuth({
          uid: authUser.uid,
          email: authUser.email || trimmedEmail,
          name: trimmedName,
          phone: trimmedPhone,
          customerType,
          isRegistration: true,
        });
      } else {
        const authUser = await signIn({
          email: trimmedEmail,
          password,
        });

        // Ensures existing Firebase Auth-only customer accounts are backfilled into Cloud Firestore
        await customerAccountService.syncCustomerAccountOnAuth({
          uid: authUser.uid,
          email: authUser.email || trimmedEmail,
          name: authUser.displayName,
          isRegistration: false,
        });
      }

      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err: any) {
      setLocalError(err?.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F3EE] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#1F4D3A]/20 selection:text-[#1F4D3A]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <a href="/" className="inline-block mb-4">
          <DecorBizLogo size="lg" showTagline={true} />
        </a>
        <h2 className="text-xl font-bold tracking-tight text-[#1C1917]">
          {isRegister ? 'Create Customer Account' : 'Customer Sign In'}
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          {isRegister
            ? 'Register to track orders, manage quotations and apply for trade pricing'
            : 'Access your saved orders, delivery tracking, and trade account'}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Rajesh Sharma"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 focus:border-[#1F4D3A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 focus:border-[#1F4D3A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Account Type (Trade Pricing)
                  </label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value as CustomerAccountType)}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 focus:border-[#1F4D3A]"
                  >
                    <option value="retail">Individual / Homeowner (Retail)</option>
                    <option value="contractor">Contractor</option>
                    <option value="architect">Architect / Interior Designer</option>
                    <option value="plumber">Plumber</option>
                    <option value="mason">Mason / Mistri</option>
                    <option value="dealer">Sub-Dealer</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Email Address
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
                  placeholder="customer@domain.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 focus:border-[#1F4D3A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Password
              </label>
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#1F4D3A] hover:bg-[#143528] text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              {isSubmitting
                ? 'Processing...'
                : isRegister
                ? 'Create Account'
                : 'Sign In to Account'}
            </button>

            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  clearError();
                  setLocalError(null);
                }}
                className="text-xs font-semibold text-[#1F4D3A] hover:underline"
              >
                {isRegister
                  ? 'Already have an account? Sign in here'
                  : 'New customer? Create an account here'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
