import React, { useEffect, useState } from 'react';
import { MapPin, Phone, Mail, ShieldCheck, LogOut, User } from 'lucide-react';
import { APP_CONFIG } from '../../config/app.config';
import { DecorBizLogo } from '../design/DecorBizLogo';
import { useAuth } from '../auth/AuthProvider';
import {
  customerAccountService,
  type CustomerAccountProfile,
} from '../services/customerAccountService';

export const BusinessCard: React.FC = () => {
  const business = APP_CONFIG.placeholderBusiness;
  const { user, isAuthenticated, signOut } = useAuth();
  const [customerProfile, setCustomerProfile] = useState<CustomerAccountProfile | null>(null);

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
                  window.history.pushState({}, '', '/account/login');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-semibold text-[#1F4D3A] hover:underline"
              >
                Customer Sign In
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Business Card Content (PRD Screen W0) */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E7E5E4] p-8 md:p-12">
          <div className="inline-block px-3 py-1 rounded-full bg-[#1F4D3A]/10 text-[#1F4D3A] text-xs font-bold uppercase tracking-wider mb-4">
            Showroom & Warehouse
          </div>
          <h1 className="text-3xl md:text-4xl font-serif-heading font-bold text-[#1C1917] mb-3">
            {business.tradeName}
          </h1>
          <p className="text-base text-stone-600 mb-8 max-w-xl">
            {business.legalName} — Premium Ceramic & Vitrified Tiles, Large-Format Slabs, Designer Sanitaryware, Faucets & Construction Chemicals.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[#E7E5E4]">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#F6F3EE] text-[#1F4D3A] flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Showroom Address</h4>
                <p className="text-sm font-semibold text-[#1C1917] mt-0.5">{business.address}</p>
                <p className="text-xs text-stone-500">PIN: {business.pincode}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#F6F3EE] text-[#1F4D3A] flex-shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Phone & WhatsApp</h4>
                <p className="text-sm font-semibold text-[#1C1917] mt-0.5">{business.phone}</p>
                <p className="text-xs text-stone-500">Mon - Sat: 10:00 AM - 8:30 PM</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#F6F3EE] text-[#1F4D3A] flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Email Enquiries</h4>
                <p className="text-sm font-semibold text-[#1C1917] mt-0.5">{business.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#F6F3EE] text-[#1F4D3A] flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">GSTIN & Scheme</h4>
                <p className="text-sm font-semibold text-[#1C1917] mt-0.5">{business.gstin}</p>
                <p className="text-xs text-stone-500">Regular GST Dealer ({business.state})</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E7E5E4] py-6 px-6 text-center text-xs text-stone-500">
        <p>&copy; {new Date().getFullYear()} {business.legalName}. All rights reserved.</p>
      </footer>
    </div>
  );
};
