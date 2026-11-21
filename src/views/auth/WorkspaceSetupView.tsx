import React, { useState, useEffect } from 'react';
import { DecorBizLogo } from '../../design/DecorBizLogo';
import { useAuth } from '../../auth/AuthProvider';
import { useWorkspace } from '../../context/WorkspaceContext';
import { isFirebaseConfigured } from '../../lib/firebase/config';
import { APP_CONFIG } from '../../../config/app.config';
import {
  isValidEmail,
  isValidGstin,
  isValidPostalCode,
  isValidPhone,
} from '../../lib/firebase/validators';
import {
  Building2,
  Store,
  MapPin,
  FileBadge2,
  ArrowRight,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  FileText,
  ChevronDown,
  ChevronUp,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';

interface FormValidationErrors {
  orgName?: string;
  mainStoreName?: string;
  mainStoreCode?: string;
  gstin?: string;
  email?: string;
  postalCode?: string;
  phone?: string;
}

interface AccountValidationErrors {
  displayName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const WorkspaceSetupView: React.FC = () => {
  const { user, isAuthenticated, signUp, signIn, signOut, error: authError, clearError: clearAuthError } = useAuth();
  const {
    organization,
    currentStore,
    hasWorkspace,
    createWorkspace,
    isLoading,
    workspaceState,
    error: workspaceError,
    clearError: clearWorkspaceError,
  } = useWorkspace();

  // Step 1 (Unauthenticated owner account creation/sign-in)
  const [accountMode, setAccountMode] = useState<'signup' | 'signin'>('signup');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerConfirmPassword, setOwnerConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [accountErrors, setAccountErrors] = useState<AccountValidationErrors>({});

  // Step 2 (Showroom & Workspace creation)
  const [orgName, setOrgName] = useState('');
  const [mainStoreName, setMainStoreName] = useState('');
  const [mainStoreCode, setMainStoreCode] = useState('MAIN-01');
  const [legalName, setLegalName] = useState('');
  const [gstin, setGstin] = useState('');
  const [tradeLicenseNumber, setTradeLicenseNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country] = useState('India');

  const [showOptionalSections, setShowOptionalSections] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justProvisioned, setJustProvisioned] = useState(false);
  const [validationErrors, setValidationErrors] = useState<FormValidationErrors>({});
  const [hasManuallyEditedStoreName, setHasManuallyEditedStoreName] = useState(false);

  // Redirect to /erp right after creating a workspace when on standalone setup routes
  useEffect(() => {
    if (justProvisioned && hasWorkspace && workspaceState === 'active-membership') {
      const path = window.location.pathname;
      if (path === '/create-workspace' || path === '/erp/setup') {
        window.history.pushState({}, '', '/erp');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  }, [justProvisioned, hasWorkspace, workspaceState]);

  const handleOrgNameChange = (val: string) => {
    setOrgName(val);
    if (!hasManuallyEditedStoreName) {
      setMainStoreName(val.trim() ? `${val.trim()} - Main Showroom` : '');
    }
    if (validationErrors.orgName) {
      setValidationErrors((prev) => ({ ...prev, orgName: undefined }));
    }
  };

  const validateAccountForm = (): boolean => {
    const errors: AccountValidationErrors = {};
    if (accountMode === 'signup' && !ownerName.trim()) {
      errors.displayName = 'Please enter the showroom owner full name.';
    }
    if (!ownerEmail.trim() || !isValidEmail(ownerEmail.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!ownerPassword || ownerPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }
    if (accountMode === 'signup' && ownerPassword !== ownerConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    setAccountErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthSubmitting) return;
    clearAuthError();
    if (!validateAccountForm()) return;

    setIsAuthSubmitting(true);
    try {
      if (accountMode === 'signup') {
        await signUp({
          email: ownerEmail.trim(),
          password: ownerPassword,
          displayName: ownerName.trim(),
        });
      } else {
        await signIn({
          email: ownerEmail.trim(),
          password: ownerPassword,
          rememberMe: true,
        });
      }
    } catch {
      // Surfaced via AuthProvider error state
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const validateWorkspaceForm = (): boolean => {
    const errors: FormValidationErrors = {};

    if (!orgName.trim()) {
      errors.orgName = 'Business or showroom name is required.';
    } else if (orgName.trim().length < 2) {
      errors.orgName = 'Business name must be at least 2 characters.';
    }

    if (!mainStoreName.trim()) {
      errors.mainStoreName = 'Primary showroom or counter name is required.';
    }

    if (!mainStoreCode.trim()) {
      errors.mainStoreCode = 'Showroom code is required (e.g., MAIN-01).';
    }

    if (gstin.trim() && !isValidGstin(gstin.trim())) {
      errors.gstin = 'Invalid GSTIN format (15 alphanumeric characters, e.g., 23AAAAA0000A1Z5).';
    }

    if (email.trim() && !isValidEmail(email.trim())) {
      errors.email = 'Please enter a valid contact email address.';
    }

    if (postalCode.trim() && !isValidPostalCode(postalCode.trim(), country)) {
      errors.postalCode = 'PIN code must be a valid 6-digit Indian postal code (e.g., 452001).';
    }

    if (phone.trim() && !isValidPhone(phone.trim())) {
      errors.phone = 'Please enter a valid phone number (10-15 digits).';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || isLoading || workspaceState === 'provisioning') {
      return;
    }

    clearWorkspaceError();

    if (!validateWorkspaceForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createWorkspace({
        orgName: orgName.trim(),
        legalName: legalName.trim() || orgName.trim(),
        gstin: gstin.trim().toUpperCase(),
        drugLicenseNumber: tradeLicenseNumber.trim(),
        mainStoreName: mainStoreName.trim(),
        mainStoreCode: mainStoreCode.trim().toUpperCase(),
        phone: phone.trim(),
        email: email.trim(),
        street: street.trim(),
        city: city.trim(),
        state: stateName.trim(),
        postalCode: postalCode.trim(),
        country,
      });
      setJustProvisioned(true);
    } catch {
      // Error surfaced via WorkspaceContext state
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isSubmitting || isLoading || workspaceState === 'provisioning' || isAuthSubmitting;
  const activeStep = !isAuthenticated ? 1 : hasWorkspace ? 3 : 2;
  const activeError = authError || workspaceError;

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div
      id="decorbiz-workspace-setup-screen"
      className="min-h-screen w-full bg-[#F6F3EE] text-[#1C1917] flex flex-col justify-between antialiased selection:bg-[#1F4D3A]/20 selection:text-[#1F4D3A]"
    >
      {/* Top Bar */}
      <header className="bg-white border-b border-[#E7E5E4] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/');
            }}
            className="whitespace-nowrap shrink-0"
          >
            <DecorBizLogo size="md" showTagline={false} />
          </a>

          <div className="flex items-center gap-4 shrink-0">
            {isAuthenticated && user ? (
              <>
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-[#1C1917]">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[11px] text-[#57534E]">{user.email}</span>
                </div>
                <button
                  type="button"
                  id="decorbiz-onboarding-signout-button"
                  onClick={() => signOut()}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E7E5E4] bg-white hover:bg-[#F6F3EE] text-xs font-semibold text-[#B91C1C] transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <a
                href="/erp/login"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('/erp/login');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E7E5E4] bg-white hover:bg-[#F6F3EE] text-xs font-semibold text-[#1F4D3A] transition-colors whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Staff Sign In</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex items-center">
        <div className="w-full bg-white rounded-2xl border border-[#E7E5E4] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Panel: Onboarding Progress & Provisioned Defaults */}
          <aside className="lg:col-span-5 bg-[#1F4D3A] text-white p-7 sm:p-9 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-[#C4A574] tracking-wide">
                First-Time Showroom Onboarding
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-serif-heading font-bold text-white leading-tight [text-wrap:balance]">
                Create your showroom workspace
              </h1>
              <p className="mt-3 text-sm text-stone-200 leading-relaxed">
                No workspace is active yet. Set up your business profile and primary billing counter to launch DecorBiz ERP.
              </p>

              {/* Step Checklist */}
              <ol className="mt-8 space-y-5">
                <li className="flex items-start gap-3.5">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono-num shrink-0 ${
                      activeStep > 1
                        ? 'bg-[#C4A574] text-[#1C1917]'
                        : 'bg-white/15 text-white border border-white/25'
                    }`}
                  >
                    {activeStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : '01'}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">01. Owner Account</p>
                    <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">
                      {isAuthenticated
                        ? `Signed in as ${user?.email || 'Owner'}`
                        : 'Register your showroom owner login credentials.'}
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3.5">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono-num shrink-0 ${
                      activeStep > 2
                        ? 'bg-[#C4A574] text-[#1C1917]'
                        : activeStep === 2
                        ? 'bg-white text-[#1F4D3A]'
                        : 'bg-white/10 text-stone-300 border border-white/15'
                    }`}
                  >
                    {activeStep > 2 ? <CheckCircle2 className="w-4 h-4" /> : '02'}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">02. Showroom & GST Profile</p>
                    <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">
                      Configure your trade name, primary branch code, and optional GST details.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3.5">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono-num shrink-0 ${
                      activeStep === 3
                        ? 'bg-[#C4A574] text-[#1C1917]'
                        : 'bg-white/10 text-stone-300 border border-white/15'
                    }`}
                  >
                    03
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">03. Ready for Counter Billing</p>
                    <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">
                      Access POS billing, tile area calculator, khata, and stock ledger.
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Provisioned Defaults Summary */}
            <div className="mt-8 pt-6 border-t border-white/15 space-y-2 text-xs text-stone-200">
              <p className="font-semibold text-[#C4A574]">Included Workspace Defaults</p>
              <p>
                {APP_CONFIG.productLines.map((line) => line.nameEn).join(' · ')}
              </p>
              <p className="text-stone-300 font-mono-num">
                Currency: {APP_CONFIG.defaultCurrency} ({APP_CONFIG.currencySymbol}) · Counter Prefix: {APP_CONFIG.invoice.counterPrefix} · Wastage: {APP_CONFIG.invoice.defaultTileWastagePercent}%
              </p>
            </div>
          </aside>

          {/* Right Panel: Interactive Form */}
          <section className="lg:col-span-7 p-7 sm:p-9 bg-white">
            {/* Firebase unconfigured notice */}
            {!isFirebaseConfigured && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#A16207] shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <p className="font-semibold">Firebase configuration required</p>
                  <p className="mt-1 text-amber-800">
                    Set <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">VITE_FIREBASE_API_KEY</code>,{' '}
                    <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">VITE_FIREBASE_PROJECT_ID</code>, and{' '}
                    <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">VITE_FIREBASE_APP_ID</code> in your environment to create and persist a showroom workspace.
                  </p>
                </div>
              </div>
            )}

            {/* Active Error Banner */}
            {activeError && (
              <div
                id="decorbiz-onboarding-error-banner"
                className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#B91C1C] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-[#991B1B]">Unable to Complete Setup</h4>
                    <p className="text-xs text-[#B91C1C] mt-0.5 leading-relaxed">{activeError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearAuthError();
                    clearWorkspaceError();
                  }}
                  className="text-xs font-semibold text-[#991B1B] hover:underline cursor-pointer whitespace-nowrap shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* CASE A: Workspace already exists for signed-in user */}
            {isAuthenticated && hasWorkspace && workspaceState === 'active-membership' && (
              <div className="py-8 space-y-6">
                <div className="w-12 h-12 rounded-xl bg-[#1F4D3A]/10 text-[#1F4D3A] flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-serif-heading font-bold text-[#1C1917]">
                    Showroom Workspace Ready
                  </h2>
                  <p className="text-sm text-[#57534E] mt-1.5 leading-relaxed">
                    You are signed in with active access to{' '}
                    <span className="font-semibold text-[#1C1917]">{organization?.name}</span>
                    {currentStore?.name ? ` (${currentStore.name})` : ''}.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigateTo('/erp')}
                    className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#1F4D3A] hover:bg-[#143528] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>Open Showroom ERP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* CASE B: User not signed in yet -> Step 1: Owner Account */}
            {!isAuthenticated && (
              <div>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-serif-heading font-bold text-[#1C1917]">
                      {accountMode === 'signup' ? 'Step 1: Create Owner Account' : 'Step 1: Sign In as Owner'}
                    </h2>
                    <p className="text-xs text-[#57534E] mt-1">
                      {accountMode === 'signup'
                        ? 'Your account will receive full Owner permissions for the new showroom.'
                        : 'Sign in with your account to create a new showroom workspace.'}
                    </p>
                  </div>

                  {/* Mode Toggle */}
                  <div className="flex items-center gap-1 p-1 bg-[#F6F3EE] rounded-lg border border-[#E7E5E4] shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        clearAuthError();
                        setAccountErrors({});
                        setAccountMode('signup');
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        accountMode === 'signup'
                          ? 'bg-white text-[#1C1917] shadow-xs'
                          : 'text-[#57534E] hover:text-[#1C1917]'
                      }`}
                    >
                      New Owner
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clearAuthError();
                        setAccountErrors({});
                        setAccountMode('signin');
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        accountMode === 'signin'
                          ? 'bg-white text-[#1C1917] shadow-xs'
                          : 'text-[#57534E] hover:text-[#1C1917]'
                      }`}
                    >
                      Sign In
                    </button>
                  </div>
                </div>

                <form onSubmit={handleAccountSubmit} className="space-y-4" noValidate>
                  {accountMode === 'signup' && (
                    <div>
                      <label htmlFor="setup-owner-name" className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                        Owner Full Name <span className="text-[#B91C1C]">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-[#57534E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="setup-owner-name"
                          type="text"
                          value={ownerName}
                          onChange={(e) => {
                            setOwnerName(e.target.value);
                            if (accountErrors.displayName) {
                              setAccountErrors((prev) => ({ ...prev, displayName: undefined }));
                            }
                          }}
                          disabled={isBusy}
                          placeholder="e.g. Rajesh Patidar"
                          className={`w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border text-sm bg-white outline-none transition-colors ${
                            accountErrors.displayName
                              ? 'border-[#B91C1C] ring-2 ring-[#B91C1C]/15'
                              : 'border-[#E7E5E4] focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/15'
                          }`}
                        />
                      </div>
                      {accountErrors.displayName && (
                        <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">{accountErrors.displayName}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label htmlFor="setup-owner-email" className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                      Owner Email Address <span className="text-[#B91C1C]">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#57534E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="setup-owner-email"
                        type="email"
                        value={ownerEmail}
                        onChange={(e) => {
                          setOwnerEmail(e.target.value);
                          if (accountErrors.email) {
                            setAccountErrors((prev) => ({ ...prev, email: undefined }));
                          }
                        }}
                        disabled={isBusy}
                        placeholder="owner@decorstudio.in"
                        className={`w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border text-sm bg-white outline-none transition-colors ${
                          accountErrors.email
                            ? 'border-[#B91C1C] ring-2 ring-[#B91C1C]/15'
                            : 'border-[#E7E5E4] focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/15'
                        }`}
                      />
                    </div>
                    {accountErrors.email && (
                      <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">{accountErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="setup-owner-password" className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                      Password <span className="text-[#B91C1C]">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#57534E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="setup-owner-password"
                        type={showPassword ? 'text' : 'password'}
                        value={ownerPassword}
                        onChange={(e) => {
                          setOwnerPassword(e.target.value);
                          if (accountErrors.password) {
                            setAccountErrors((prev) => ({ ...prev, password: undefined }));
                          }
                        }}
                        disabled={isBusy}
                        placeholder="Minimum 6 characters"
                        className={`w-full min-h-[44px] pl-10 pr-10 py-2 rounded-xl border text-sm bg-white outline-none transition-colors ${
                          accountErrors.password
                            ? 'border-[#B91C1C] ring-2 ring-[#B91C1C]/15'
                            : 'border-[#E7E5E4] focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/15'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#57534E] hover:text-[#1C1917] cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {accountErrors.password && (
                      <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">{accountErrors.password}</p>
                    )}
                  </div>

                  {accountMode === 'signup' && (
                    <div>
                      <label htmlFor="setup-owner-confirm-password" className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                        Confirm Password <span className="text-[#B91C1C]">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#57534E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="setup-owner-confirm-password"
                          type={showPassword ? 'text' : 'password'}
                          value={ownerConfirmPassword}
                          onChange={(e) => {
                            setOwnerConfirmPassword(e.target.value);
                            if (accountErrors.confirmPassword) {
                              setAccountErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                            }
                          }}
                          disabled={isBusy}
                          placeholder="Re-enter password"
                          className={`w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border text-sm bg-white outline-none transition-colors ${
                            accountErrors.confirmPassword
                              ? 'border-[#B91C1C] ring-2 ring-[#B91C1C]/15'
                              : 'border-[#E7E5E4] focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/15'
                          }`}
                        />
                      </div>
                      {accountErrors.confirmPassword && (
                        <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">{accountErrors.confirmPassword}</p>
                      )}
                    </div>
                  )}

                  <div className="pt-3 flex items-center justify-end">
                    <button
                      type="submit"
                      id="decorbiz-owner-account-continue-button"
                      disabled={isBusy}
                      className="w-full sm:w-auto min-h-[44px] px-7 py-2.5 rounded-xl bg-[#1F4D3A] hover:bg-[#143528] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {isAuthSubmitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>{accountMode === 'signup' ? 'Creating Account...' : 'Signing In...'}</span>
                        </>
                      ) : (
                        <>
                          <span>Continue to Showroom Setup</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* CASE C: Authenticated & No Workspace -> Step 2: Showroom Setup Form */}
            {isAuthenticated && !hasWorkspace && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-serif-heading font-bold text-[#1C1917]">
                    Showroom & Workspace Details
                  </h2>
                  <p className="text-xs text-[#57534E] mt-1">
                    Enter your business trade name and primary showroom details to initialize your ERP workspace.
                  </p>
                </div>

                <form onSubmit={handleSetupSubmit} className="space-y-5" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Business / Showroom Trade Name */}
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="decorbiz-setup-org-name"
                        className="block text-xs font-semibold text-[#1C1917] mb-1.5"
                      >
                        Business / Trade Name <span className="text-[#B91C1C]">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-[#57534E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="decorbiz-setup-org-name"
                          type="text"
                          placeholder={`e.g. ${APP_CONFIG.placeholderBusiness.tradeName}`}
                          value={orgName}
                          onChange={(e) => handleOrgNameChange(e.target.value)}
                          disabled={isBusy}
                          aria-invalid={!!validationErrors.orgName}
                          className={`w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border text-sm outline-none bg-white transition-colors ${
                            validationErrors.orgName
                              ? 'border-[#B91C1C] ring-2 ring-[#B91C1C]/15'
                              : 'border-[#E7E5E4] focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/15'
                          }`}
                          required
                        />
                      </div>
                      {validationErrors.orgName && (
                        <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">
                          {validationErrors.orgName}
                        </p>
                      )}
                    </div>

                    {/* Primary Showroom Name */}
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="decorbiz-setup-store-name"
                        className="block text-xs font-semibold text-[#1C1917] mb-1.5"
                      >
                        Primary Showroom / Counter Name <span className="text-[#B91C1C]">*</span>
                      </label>
                      <div className="relative">
                        <Store className="w-4 h-4 text-[#57534E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="decorbiz-setup-store-name"
                          type="text"
                          placeholder={`e.g. ${APP_CONFIG.placeholderBusiness.tradeName} - Main Showroom`}
                          value={mainStoreName}
                          onChange={(e) => {
                            setMainStoreName(e.target.value);
                            setHasManuallyEditedStoreName(true);
                            if (validationErrors.mainStoreName) {
                              setValidationErrors((prev) => ({ ...prev, mainStoreName: undefined }));
                            }
                          }}
                          disabled={isBusy}
                          aria-invalid={!!validationErrors.mainStoreName}
                          className={`w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border text-sm outline-none bg-white transition-colors ${
                            validationErrors.mainStoreName
                              ? 'border-[#B91C1C] ring-2 ring-[#B91C1C]/15'
                              : 'border-[#E7E5E4] focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/15'
                          }`}
                          required
                        />
                      </div>
                      {validationErrors.mainStoreName && (
                        <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">
                          {validationErrors.mainStoreName}
                        </p>
                      )}
                    </div>

                    {/* Showroom Code */}
                    <div>
                      <label
                        htmlFor="decorbiz-setup-store-code"
                        className="block text-xs font-semibold text-[#1C1917] mb-1.5"
                      >
                        Showroom Code <span className="text-[#B91C1C]">*</span>
                      </label>
                      <input
                        id="decorbiz-setup-store-code"
                        type="text"
                        placeholder="MAIN-01"
                        value={mainStoreCode}
                        onChange={(e) => {
                          setMainStoreCode(e.target.value.toUpperCase());
                          if (validationErrors.mainStoreCode) {
                            setValidationErrors((prev) => ({ ...prev, mainStoreCode: undefined }));
                          }
                        }}
                        disabled={isBusy}
                        aria-invalid={!!validationErrors.mainStoreCode}
                        className={`w-full min-h-[44px] px-4 py-2 rounded-xl border text-sm font-mono-num outline-none bg-white uppercase transition-colors ${
                          validationErrors.mainStoreCode
                            ? 'border-[#B91C1C] ring-2 ring-[#B91C1C]/15'
                            : 'border-[#E7E5E4] focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/15'
                        }`}
                        required
                      />
                      {validationErrors.mainStoreCode && (
                        <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">
                          {validationErrors.mainStoreCode}
                        </p>
                      )}
                    </div>

                    {/* City */}
                    <div>
                      <label
                        htmlFor="decorbiz-setup-city"
                        className="block text-xs font-semibold text-[#1C1917] mb-1.5"
                      >
                        City
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-[#57534E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="decorbiz-setup-city"
                          type="text"
                          placeholder={`e.g. ${APP_CONFIG.placeholderBusiness.city}`}
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          disabled={isBusy}
                          className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-[#E7E5E4] focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/15 text-sm outline-none bg-white transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Legal, GST & Contact Section */}
                  <div>
                    <button
                      type="button"
                      id="decorbiz-toggle-optional-fields"
                      onClick={() => setShowOptionalSections((prev) => !prev)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#F6F3EE] hover:bg-[#EDE8E0] border border-[#E7E5E4] flex items-center justify-between text-xs font-semibold text-[#1C1917] transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#1F4D3A]" />
                        <span>
                          {showOptionalSections ? 'Hide' : 'Add'} GSTIN, Legal Name & Contact Details (Optional)
                        </span>
                      </span>
                      {showOptionalSections ? (
                        <ChevronUp className="w-4 h-4 text-[#57534E]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#57534E]" />
                      )}
                    </button>
                  </div>

                  {showOptionalSections && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#E7E5E4]">
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="decorbiz-setup-legal-name"
                          className="block text-xs font-semibold text-[#1C1917] mb-1.5"
                        >
                          Legal Entity Name (if different)
                        </label>
                        <input
                          id="decorbiz-setup-legal-name"
                          type="text"
                          placeholder={`e.g. ${APP_CONFIG.placeholderBusiness.legalName}`}
                          value={legalName}
                          onChange={(e) => setLegalName(e.target.value)}
                          disabled={isBusy}
                          className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E5E4] focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/15 text-sm outline-none bg-white"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="decorbiz-setup-gstin"
                          className="block text-xs font-semibold text-[#1C1917] mb-1.5"
                        >
                          GSTIN
                        </label>
                        <input
                          id="decorbiz-setup-gstin"
                          type="text"
                          placeholder={APP_CONFIG.placeholderBusiness.gstin}
                          value={gstin}
                          onChange={(e) => {
                            setGstin(e.target.value.toUpperCase());
                            if (validationErrors.gstin) {
                              setValidationErrors((prev) => ({ ...prev, gstin: undefined }));
                            }
                          }}
                          disabled={isBusy}
                          className={`w-full min-h-[44px] px-4 py-2 rounded-xl border text-sm font-mono-num outline-none bg-white uppercase ${
                            validationErrors.gstin
                              ? 'border-[#B91C1C] ring-2 ring-[#B91C1C]/15'
                              : 'border-[#E7E5E4] focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/15'
                          }`}
                        />
                        {validationErrors.gstin && (
                          <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">
                            {validationErrors.gstin}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="decorbiz-setup-trade-license"
                          className="block text-xs font-semibold text-[#1C1917] mb-1.5"
                        >
                          Udyam / Trade Registration No.
                        </label>
                        <div className="relative">
                          <FileBadge2 className="w-4 h-4 text-[#57534E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="decorbiz-setup-trade-license"
                            type="text"
                            placeholder="e.g. UDYAM-MP-23-0012345"
                            value={tradeLicenseNumber}
                            onChange={(e) => setTradeLicenseNumber(e.target.value)}
                            disabled={isBusy}
                            className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-[#E7E5E4] focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/15 text-sm outline-none bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="decorbiz-setup-phone"
                          className="block text-xs font-semibold text-[#1C1917] mb-1.5"
                        >
                          Showroom Phone
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-[#57534E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="decorbiz-setup-phone"
                            type="tel"
                            placeholder={APP_CONFIG.placeholderBusiness.phone}
                            value={phone}
                            onChange={(e) => {
                              setPhone(e.target.value);
                              if (validationErrors.phone) {
                                setValidationErrors((prev) => ({ ...prev, phone: undefined }));
                              }
                            }}
                            disabled={isBusy}
                            className={`w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border text-sm outline-none bg-white ${
                              validationErrors.phone
                                ? 'border-[#B91C1C] ring-2 ring-[#B91C1C]/15'
                                : 'border-[#E7E5E4] focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/15'
                            }`}
                          />
                        </div>
                        {validationErrors.phone && (
                          <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">
                            {validationErrors.phone}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="decorbiz-setup-email"
                          className="block text-xs font-semibold text-[#1C1917] mb-1.5"
                        >
                          Showroom Contact Email
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-[#57534E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="decorbiz-setup-email"
                            type="email"
                            placeholder={APP_CONFIG.placeholderBusiness.email}
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (validationErrors.email) {
                                setValidationErrors((prev) => ({ ...prev, email: undefined }));
                              }
                            }}
                            disabled={isBusy}
                            className={`w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border text-sm outline-none bg-white ${
                              validationErrors.email
                                ? 'border-[#B91C1C] ring-2 ring-[#B91C1C]/15'
                                : 'border-[#E7E5E4] focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/15'
                            }`}
                          />
                        </div>
                        {validationErrors.email && (
                          <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">
                            {validationErrors.email}
                          </p>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label
                          htmlFor="decorbiz-setup-street"
                          className="block text-xs font-semibold text-[#1C1917] mb-1.5"
                        >
                          Street Address
                        </label>
                        <input
                          id="decorbiz-setup-street"
                          type="text"
                          placeholder={APP_CONFIG.placeholderBusiness.address}
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          disabled={isBusy}
                          className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E5E4] focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/15 text-sm outline-none bg-white"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="decorbiz-setup-state"
                          className="block text-xs font-semibold text-[#1C1917] mb-1.5"
                        >
                          State
                        </label>
                        <input
                          id="decorbiz-setup-state"
                          type="text"
                          placeholder={`e.g. ${APP_CONFIG.placeholderBusiness.state}`}
                          value={stateName}
                          onChange={(e) => setStateName(e.target.value)}
                          disabled={isBusy}
                          className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E5E4] focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/15 text-sm outline-none bg-white"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="decorbiz-setup-postal-code"
                          className="block text-xs font-semibold text-[#1C1917] mb-1.5"
                        >
                          PIN Code
                        </label>
                        <input
                          id="decorbiz-setup-postal-code"
                          type="text"
                          placeholder={APP_CONFIG.placeholderBusiness.pincode}
                          value={postalCode}
                          onChange={(e) => {
                            setPostalCode(e.target.value);
                            if (validationErrors.postalCode) {
                              setValidationErrors((prev) => ({ ...prev, postalCode: undefined }));
                            }
                          }}
                          disabled={isBusy}
                          className={`w-full min-h-[44px] px-4 py-2 rounded-xl border text-sm font-mono-num outline-none bg-white ${
                            validationErrors.postalCode
                              ? 'border-[#B91C1C] ring-2 ring-[#B91C1C]/15'
                              : 'border-[#E7E5E4] focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/15'
                          }`}
                        />
                        {validationErrors.postalCode && (
                          <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">
                            {validationErrors.postalCode}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Submit Action */}
                  <div className="pt-5 border-t border-[#E7E5E4] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-[#57534E]">
                      Creates your isolated showroom and assigns Owner access.
                    </p>

                    <button
                      type="submit"
                      id="decorbiz-create-workspace-submit-button"
                      disabled={isBusy || !isFirebaseConfigured}
                      className="w-full sm:w-auto min-h-[44px] px-7 py-2.5 rounded-xl bg-[#1F4D3A] hover:bg-[#143528] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {isBusy ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Creating Workspace...</span>
                        </>
                      ) : (
                        <>
                          <span>Create Workspace</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E7E5E4] py-4 px-6 text-center text-xs text-[#57534E]">
        &copy; {new Date().getFullYear()} {APP_CONFIG.name} &middot; Tiles, Sanitaryware &amp; Bath ERP
      </footer>
    </div>
  );
};
