import React, { useState } from 'react';
import {
  IconLayoutDashboard,
  IconReceipt,
  IconPlus,
  IconUsers,
  IconMenu2,
  IconShoppingCart,
  IconUserPlus,
  IconPackage,
  IconReceiptTax,
  IconCreditCard,
  IconX,
} from '@tabler/icons-react';
import { NavModuleId } from '../types';
import { useI18n } from '../i18n';
import { useWorkspace } from '../context/WorkspaceContext';

interface MobileBottomNavProps {
  activeModule: NavModuleId;
  onSelectModule: (id: NavModuleId) => void;
  onOpenMoreMenu?: () => void;
  onQuickAction?: (action: 'newBill' | 'receivePayment' | 'addParty' | 'addItem' | 'addExpense' | 'newPurchase') => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeModule,
  onSelectModule,
  onOpenMoreMenu,
  onQuickAction,
}) => {
  const { t } = useI18n();
  const { isModuleEnabled } = useWorkspace();
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  const handleAction = (action: 'newBill' | 'receivePayment' | 'addParty' | 'addItem' | 'addExpense' | 'newPurchase') => {
    setIsQuickActionsOpen(false);
    if (onQuickAction) {
      onQuickAction(action);
    } else {
      if (action === 'newBill') onSelectModule('pos');
      else if (action === 'receivePayment') onSelectModule('collections');
      else if (action === 'addParty') onSelectModule('customers');
      else if (action === 'addItem') onSelectModule('inventory');
      else if (action === 'addExpense') onSelectModule('expenses');
      else if (action === 'newPurchase') onSelectModule('purchases');
    }
  };

  return (
    <>
      {/* 5-Button Mobile Navigation Bar (PRD Section 5.2) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E7E5E4] px-1 py-1 flex items-center justify-around shadow-lg select-none pb-safe">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => onSelectModule('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl cursor-pointer ${
            activeModule === 'dashboard' ? 'text-[#1F4D3A] font-bold' : 'text-[#57534E]'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeModule === 'dashboard' ? 'bg-[#1F4D3A]/10 text-[#1F4D3A]' : ''}`}>
            <IconLayoutDashboard className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">{t('nav.home', 'Home')}</span>
        </button>

        {/* 2. Bills */}
        <button
          type="button"
          onClick={() => onSelectModule('pos')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl cursor-pointer ${
            activeModule === 'pos' || activeModule === 'billing' ? 'text-[#1F4D3A] font-bold' : 'text-[#57534E]'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeModule === 'pos' || activeModule === 'billing' ? 'bg-[#1F4D3A]/10 text-[#1F4D3A]' : ''}`}>
            <IconReceipt className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">{t('nav.bills', 'Bills')}</span>
        </button>

        {/* 3. Quick Actions (+) Button */}
        <div className="flex-1 flex justify-center -mt-4">
          <button
            type="button"
            onClick={() => setIsQuickActionsOpen(true)}
            className="w-12 h-12 rounded-full bg-[#1F4D3A] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform cursor-pointer"
            title={t('nav.quickActions', 'Quick Actions')}
          >
            <IconPlus className="w-6 h-6" />
          </button>
        </div>

        {/* 4. Parties */}
        <button
          type="button"
          onClick={() => onSelectModule('customers')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl cursor-pointer ${
            activeModule === 'customers' || activeModule === 'parties' ? 'text-[#1F4D3A] font-bold' : 'text-[#57534E]'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeModule === 'customers' || activeModule === 'parties' ? 'bg-[#1F4D3A]/10 text-[#1F4D3A]' : ''}`}>
            <IconUsers className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">{t('nav.parties', 'Parties')}</span>
        </button>

        {/* 5. More */}
        <button
          type="button"
          onClick={() => (onOpenMoreMenu ? onOpenMoreMenu() : onSelectModule('inventory'))}
          className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[#57534E] cursor-pointer"
        >
          <div className="p-1 rounded-lg">
            <IconMenu2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">{t('nav.more', 'More')}</span>
        </button>
      </nav>

      {/* Quick Actions Sheet Modal (PRD Section 5.2 — respects Module Switches) */}
      {isQuickActionsOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-t-2xl p-5 shadow-2xl border-t border-[#E7E5E4] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E4] mb-4">
              <h3 className="text-base font-bold text-[#1C1917]">{t('nav.quickActions', 'Quick Actions')}</h3>
              <button
                type="button"
                onClick={() => setIsQuickActionsOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-6">
              <button
                type="button"
                onClick={() => handleAction('newBill')}
                className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200 text-left hover:bg-stone-100 transition-colors"
              >
                <div className="p-2 rounded-lg bg-[#1F4D3A]/10 text-[#1F4D3A]">
                  <IconReceipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1C1917]">{t('actions.newBill', 'New Bill')}</div>
                  <div className="text-[11px] text-stone-500">POS Counter Bill</div>
                </div>
              </button>

              {isModuleEnabled('payments') && (
                <button
                  type="button"
                  onClick={() => handleAction('receivePayment')}
                  className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200 text-left hover:bg-stone-100 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                    <IconCreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1C1917]">{t('actions.receivePayment', 'Receive Payment')}</div>
                    <div className="text-[11px] text-stone-500">Khata Collection</div>
                  </div>
                </button>
              )}

              {isModuleEnabled('parties') && (
                <button
                  type="button"
                  onClick={() => handleAction('addParty')}
                  className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200 text-left hover:bg-stone-100 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                    <IconUserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1C1917]">{t('actions.addParty', 'Add Party')}</div>
                    <div className="text-[11px] text-stone-500">Customer / Supplier</div>
                  </div>
                </button>
              )}

              {isModuleEnabled('inventory') && (
                <button
                  type="button"
                  onClick={() => handleAction('addItem')}
                  className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200 text-left hover:bg-stone-100 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                    <IconPackage className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1C1917]">{t('actions.addItem', 'Add Item')}</div>
                    <div className="text-[11px] text-stone-500">Tile / Sanitaryware</div>
                  </div>
                </button>
              )}

              {isModuleEnabled('expenses') && (
                <button
                  type="button"
                  onClick={() => handleAction('addExpense')}
                  className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200 text-left hover:bg-stone-100 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-800">
                    <IconReceiptTax className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1C1917]">{t('actions.addExpense', 'Add Expense')}</div>
                    <div className="text-[11px] text-stone-500">Day book entry</div>
                  </div>
                </button>
              )}

              {isModuleEnabled('purchases') && (
                <button
                  type="button"
                  onClick={() => handleAction('newPurchase')}
                  className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200 text-left hover:bg-stone-100 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-800">
                    <IconShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1C1917]">{t('actions.newPurchase', 'New Purchase')}</div>
                    <div className="text-[11px] text-stone-500">Supplier GRN Inward</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
