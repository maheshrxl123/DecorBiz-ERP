import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { MapPin, Phone, Mail, ShieldCheck, LogOut, User, Store } from 'lucide-react';
import { db } from '../lib/firebase/config';
import { DecorBizLogo } from '../design/DecorBizLogo';
import { useAuth } from '../auth/AuthProvider';
import {
  customerAccountService,
  type CustomerAccountProfile,
} from '../services/customerAccountService';

interface PublicBusinessProfile {
  tradeName?: string;
  legalName?: string;
  showroomName?: string;
  tagline?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  hours?: string;
  logoUrl?: string;
}

export const BusinessCard: React.FC = () => {
  const { user, isAuthenticated, signOut } = useAuth();
  const [customerProfile, setCustomerProfile] = useState<CustomerAccountProfile | null>(null);
  const [business, setBusiness] = useState<PublicBusinessProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    let active = true;
    const loadBusinessProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const snap = await getDoc(doc(db, 'business', 'profile'));
        if (active && snap.exists()) {
          setBusiness(snap.data() as PublicBusinessProfile);
        } else if (active) {
          setBusiness(null);
        }
      } catch (err) {
        console.warn('Could not load business profile from Firestore:', err);
        if (active) setBusiness(null);
      } finally {
        if (active) setIsLoadingProfile(false);
      }
    };

    loadBusinessProfile();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!isAuthenticated || !user?.uid) {
      setCustomerProfile(null);
      return;
    }

    customerAccountService
      .getCustomerAccount(user.uid)
      .then((profile) => {
        if (active) setCustomerProfile(profile);
      })
      .catch((err) => {
        console.warn('Could not load customer account profile:', err);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.uid]);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const displayName = business?.tradeName || business?.showroomName || business?.legalName || '';
  const fullAddress =
    business?.address ||
    [business?.city, business?.state].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-[#F6F3EE] flex flex-col justify-between selection:bg-[#1F4D3A]/20 selection:text-[#1F4D3A]">
      {/* Public Header */}
      <header className="bg-white border-b border-[#E7E5E4] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <DecorBizLogo size="md" showTagline={true} />
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-right">
                  <div className="w-7 h-7 rounded-full bg-[#1F4D3A]/10 text-[#1F4D3A] flex items-center justify-center">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs font-semibold text-[#1C1917]">
                      {customerProfile?.name || user.displayName || user.email}
                    </p>
                    <p className="text-[11px] text-[#57534E] capitalize">
                      {customerProfile
                        ? `${customerProfile.customerType} · ${customerProfile.approvalStatus}`
                        : user.email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E7E5E4] bg-white hover:bg-[#F6F3EE] text-xs font-semibold text-[#1C1917] transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#57534E]" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <a
                href="/account/login"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('/account/login');
                }}
                className="text-xs font-semibold text-[#1F4D3A] hover:underline"
              >
                Customer Sign In
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Business Card Content (PRD Screen W0 — backed strictly by Cloud Firestore) */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center w-full">
        {isLoadingProfile ? (
          <div className="bg-white rounded-2xl shadow-sm border border-[#E7E5E4] p-8 md:p-12 animate-pulse space-y-4">
            <div className="h-5 w-36 bg-stone-200 rounded" />
            <div className="h-9 w-72 bg-stone-200 rounded" />
            <div className="h-4 w-full max-w-md bg-stone-100 rounded" />
          </div>
        ) : !business || !displayName ? (
          <div className="bg-white rounded-2xl shadow-sm border border-[#E7E5E4] p-8 md:p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#F6F3EE] text-[#1F4D3A] flex items-center justify-center mx-auto">
              <Store className="w-6 h-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-serif-heading font-bold text-[#1C1917]">
              Showroom Profile Not Configured Yet
            </h1>
            <p className="text-sm text-stone-600 max-w-lg mx-auto">
              Connect and configure your showroom workspace in Cloud Firestore to display your verified business details here.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => navigateTo('/erp/login')}
                className="px-4 py-2 rounded-xl bg-[#1F4D3A] hover:bg-[#173A2B] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Staff Sign In
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/create-workspace')}
                className="px-4 py-2 rounded-xl border border-[#E7E5E4] bg-white hover:bg-[#F6F3EE] text-[#1C1917] text-xs font-semibold transition-colors cursor-pointer"
              >
                Set Up Showroom
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-[#E7E5E4] p-8 md:p-12">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-[#1F4D3A]/10 text-[#1F4D3A] text-xs font-bold uppercase tracking-wider mb-3">
                  Showroom &amp; Warehouse
                </div>
                <h1 className="text-3xl md:text-4xl font-serif-heading font-bold text-[#1C1917]">
                  {displayName}
                </h1>
              </div>
              {business.logoUrl && (
                <img
                  src={business.logoUrl}
                  alt={displayName}
                  className="h-14 w-auto object-contain rounded-lg border border-[#E7E5E4] p-1"
                />
              )}
            </div>

            {(business.tagline || business.legalName) && (
              <p className="text-base text-stone-600 mb-8 max-w-xl">
                {business.tagline || business.legalName}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[#E7E5E4]">
              {fullAddress && (
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#F6F3EE] text-[#1F4D3A] flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Showroom Address</h4>
                    <p className="text-sm font-semibold text-[#1C1917] mt-0.5">{fullAddress}</p>
                    {business.pincode && <p className="text-xs text-stone-500">PIN: {business.pincode}</p>}
                  </div>
                </div>
              )}

              {business.phone && (
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#F6F3EE] text-[#1F4D3A] flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Phone &amp; WhatsApp</h4>
                    <p className="text-sm font-semibold text-[#1C1917] mt-0.5">{business.phone}</p>
                    {business.hours && <p className="text-xs text-stone-500">{business.hours}</p>}
                  </div>
                </div>
              )}

              {business.email && (
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#F6F3EE] text-[#1F4D3A] flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Email Enquiries</h4>
                    <p className="text-sm font-semibold text-[#1C1917] mt-0.5">{business.email}</p>
                  </div>
                </div>
              )}

              {business.gstin && (
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#F6F3EE] text-[#1F4D3A] flex-shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">GSTIN</h4>
                    <p className="text-sm font-semibold text-[#1C1917] mt-0.5 font-mono">{business.gstin}</p>
                    {business.state && <p className="text-xs text-stone-500">{business.state}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E7E5E4] py-6 px-6 text-center text-xs text-stone-500">
        <p>&copy; {new Date().getFullYear()} {business?.legalName || displayName || 'DecorBiz'}. All rights reserved.</p>
      </footer>
    </div>
  );
};
