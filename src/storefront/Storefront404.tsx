import React from 'react';
import { Home, ArrowLeft } from 'lucide-react';
import { DecorBizLogo } from '../design/DecorBizLogo';

/**
 * Storefront 404 Page (PRD Section 2.2)
 * Rendered whenever an unauthenticated visitor or non-staff user visits /erp or /erp/*
 * Shows standard 404 without exposing login form or 'staff only' hints.
 */
export const Storefront404: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F6F3EE] flex flex-col justify-between selection:bg-[#1F4D3A]/20 selection:text-[#1F4D3A]">
      <header className="bg-white border-b border-[#E7E5E4] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <DecorBizLogo size="sm" showTagline={true} />
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-16 text-center flex-1 flex flex-col justify-center">
        <div className="text-7xl font-serif-heading font-extrabold text-[#1F4D3A] mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold text-[#1C1917] mb-2">
          Page Not Found
        </h1>
        <p className="text-sm text-stone-600 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>

        <div>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F4D3A] text-white font-semibold text-sm hover:bg-[#143528] transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            Return to Homepage
          </a>
        </div>
      </main>

      <footer className="bg-white border-t border-[#E7E5E4] py-4 px-6 text-center text-xs text-stone-500">
        &copy; {new Date().getFullYear()} DecorBiz. All rights reserved.
      </footer>
    </div>
  );
};
