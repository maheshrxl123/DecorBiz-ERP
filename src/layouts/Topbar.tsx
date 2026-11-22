import React, { useState } from 'react';
import {
  IconSearch,
  IconBell,
  IconChevronDown,
  IconMenu2,
  IconLanguage,
  IconMoon,
  IconSun,
  IconBuildingStore,
} from '@tabler/icons-react';
import { StoreContext, UserProfile } from '../types';
import { DecorBizLogo } from '../design/DecorBizLogo';
import { useI18n } from '../i18n';

interface TopbarProps {
  currentStore: StoreContext;
  currentUser: UserProfile;
  unreadNotificationsCount?: number;
  onOpenSearch: () => void;
  onOpenHelp: () => void;
  onOpenNotifications: () => void;
  onOpenStoreSelector: () => void;
  onOpenProfile: () => void;
  onOpenMobileMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentStore,
  currentUser,
  unreadNotificationsCount = 0,
  onOpenSearch,
  onOpenNotifications,
  onOpenStoreSelector,
  onOpenProfile,
  onOpenMobileMenu,
}) => {
  const { lang, toggleLanguage, t } = useI18n();
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme ? 'dark' : 'light');
  };

  return (
    <header className="h-16 bg-white border-b border-[#E7E5E4] px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-2 sm:gap-4 select-none z-20 flex-shrink-0">
      {/* Left: Mobile Navigation Drawer Toggle, Logo & Search */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 max-w-2xl">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open mobile navigation menu"
          className="md:hidden p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl cursor-pointer flex-shrink-0"
        >
          <IconMenu2 className="w-5 h-5" />
        </button>

        <div className="md:hidden flex-shrink-0">
          <DecorBizLogo variant="symbol" size="sm" />
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3 py-1.5 sm:py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 hover:border-stone-300 rounded-xl text-xs text-stone-500 transition-all cursor-pointer shadow-xs group"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <IconSearch className="w-4 h-4 text-[#1F4D3A] flex-shrink-0" />
              <span className="truncate text-[11px] sm:text-xs">
                {t('actions.search', 'Search name, SKU, or barcode...')}
              </span>
            </div>
            <kbd className="hidden lg:inline-flex items-center px-2 py-0.5 text-[10px] font-bold text-stone-500 bg-white border border-stone-200 rounded font-mono flex-shrink-0">
              Ctrl + K
            </kbd>
          </button>
        </div>
      </div>

      {/* Right: Branch, Language, Theme, Notifications, Profile */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {currentStore.name && (
          <button
            type="button"
            onClick={onOpenStoreSelector}
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-medium text-[#1C1917] transition-colors cursor-pointer max-w-[180px]"
            title="Switch active showroom / godown"
          >
            <IconBuildingStore className="w-4 h-4 text-[#1F4D3A] flex-shrink-0" />
            <span className="truncate">{currentStore.name}</span>
          </button>
        )}

        {/* Language Switcher (PRD Section 5.1 & Section 17) */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-[#1F4D3A] transition-colors cursor-pointer"
          title="Switch Language (English / हिन्दी)"
        >
          <IconLanguage className="w-4 h-4 text-[#1F4D3A]" />
          <span className="text-xs">{lang === 'en' ? 'हिन्दी' : 'English'}</span>
        </button>

        {/* Theme Switcher */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
          title="Toggle Dark / Light Mode"
        >
          {isDark ? <IconSun className="w-4 h-4 text-amber-500" /> : <IconMoon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
          title="Notifications"
        >
          <IconBell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#B91C1C] text-white text-[10px] font-bold flex items-center justify-center tabular-nums ring-2 ring-white">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        <div className="h-6 w-px bg-stone-200 mx-0.5 hidden sm:block" />

        {/* User Profile */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer group"
          title={`Profile: ${currentUser.name}`}
        >
          <div className="w-8 h-8 rounded-full bg-[#1F4D3A] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
            {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-[#1C1917] leading-none truncate max-w-[120px]">
              {currentUser.name || currentUser.email || 'Staff User'}
            </span>
            <span className="text-[10px] font-medium text-stone-500 mt-0.5 capitalize">
              {currentUser.role || 'Staff Member'}
            </span>
          </div>
          <IconChevronDown className="w-3.5 h-3.5 text-stone-400 hidden sm:block flex-shrink-0" />
        </button>
      </div>
    </header>
  );
};
