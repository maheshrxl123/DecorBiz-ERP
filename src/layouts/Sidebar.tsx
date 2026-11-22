import React from 'react';
import {
  IconLayoutDashboard,
  IconReceipt,
  IconFileSpreadsheet,
  IconPackage,
  IconUsers,
  IconCreditCard,
  IconShoppingBag,
  IconChartBar,
  IconReceiptTax,
  IconSettings,
  IconChevronLeft,
  IconChevronRight,
  IconShieldCheck,
  IconBuildingWarehouse,
  IconTruckDelivery,
  IconRotateClockwise,
  IconWorld,
  IconChecklist,
  IconRefreshAlert,
} from '@tabler/icons-react';
import { NavModuleId } from '../types';
import { DecorBizLogo } from '../design/DecorBizLogo';
import { useWorkspace } from '../context/WorkspaceContext';
import { useI18n } from '../i18n';

interface SidebarProps {
  activeModule: NavModuleId;
  onSelectModule: (id: NavModuleId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  unreadNotificationsCount?: number;
  userName?: string;
  userRole?: string;
  onOpenProfile?: () => void;
}

interface SidebarNavItem {
  id: NavModuleId;
  moduleKey: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permissionCheck?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  isCollapsed,
  onToggleCollapse,
  userName = 'Staff User',
  userRole = 'Owner',
  onOpenProfile,
}) => {
  const { hasPermission, isModuleEnabled, isSimpleMode } = useWorkspace();
  const { t } = useI18n();

  // Strictly filtered by PRD Section 4.1 Simple Mode / Owner Module Switches
  const navItems: SidebarNavItem[] = [
    // Version 1 — Core Showroom (Simple Mode defaults)
    { id: 'dashboard', moduleKey: 'dashboard', label: t('nav.home', 'Dashboard'), icon: IconLayoutDashboard },
    { id: 'pos', moduleKey: 'billing', label: t('nav.bills', 'Billing (POS)'), icon: IconReceipt, permissionCheck: hasPermission('pos.create') },
    { id: 'quotations', moduleKey: 'quotations', label: t('nav.quotations', 'Quotations'), icon: IconFileSpreadsheet, permissionCheck: hasPermission('pos.create') },
    { id: 'inventory', moduleKey: 'inventory', label: t('nav.inventory', 'Items & Stock'), icon: IconPackage, permissionCheck: hasPermission('inventory.read') },
    { id: 'customers', moduleKey: 'parties', label: t('nav.parties', 'Parties & Khata'), icon: IconUsers, permissionCheck: hasPermission('customer.read') },
    { id: 'collections', moduleKey: 'payments', label: t('nav.payments', 'Payments'), icon: IconCreditCard, permissionCheck: hasPermission('pos.create') },
    { id: 'reports', moduleKey: 'reports_basic', label: t('nav.reports', 'Reports'), icon: IconChartBar, permissionCheck: hasPermission('reports.read') },

    // Version 2 — Purchasing & Control (off in Simple Mode until Owner enables)
    { id: 'purchases', moduleKey: 'purchases', label: t('nav.purchases', 'Purchases'), icon: IconShoppingBag, permissionCheck: hasPermission('purchases.read') },
    { id: 'replenishment', moduleKey: 'purchases', label: t('nav.replenishment', 'Replenishment'), icon: IconRefreshAlert, permissionCheck: hasPermission('purchases.read') },

    // Version 3 — Online Storefront
    { id: 'ecommerce', moduleKey: 'storefront', label: t('nav.storefront', 'Online Storefront'), icon: IconWorld, permissionCheck: hasPermission('inventory.read') },

    // Version 4 — Delivery, Godowns & Returns
    { id: 'warehouses', moduleKey: 'godowns', label: t('nav.warehouses', 'Godowns & Yards'), icon: IconBuildingWarehouse, permissionCheck: hasPermission('inventory.read') },
    { id: 'transfers', moduleKey: 'godowns', label: t('nav.transfers', 'Godown Transfers'), icon: IconTruckDelivery, permissionCheck: hasPermission('inventory.read') },
    { id: 'sales_returns', moduleKey: 'returns', label: t('nav.returns', 'Returns & Credit Notes'), icon: IconRotateClockwise, permissionCheck: hasPermission('pos.create') },
    { id: 'tasks', moduleKey: 'projects', label: t('nav.tasks', 'Tasks'), icon: IconChecklist },

    // Version 5 — E-Invoice & Compliance (GST HSN Reports stay available when gst_reports or einvoice is active)
    {
      id: 'gst_accounts',
      moduleKey: isModuleEnabled('einvoice') ? 'einvoice' : 'gst_reports',
      label: isModuleEnabled('einvoice') ? t('nav.einvoice', 'E-Invoice & E-Way') : t('nav.gstReports', 'GST Reports'),
      icon: IconReceiptTax,
      permissionCheck: hasPermission('reports.read'),
    },
    { id: 'audit_centre', moduleKey: 'double_entry_accounts', label: t('nav.auditCentre', 'Audit Log'), icon: IconShieldCheck, permissionCheck: hasPermission('reports.read') },

    // Settings (always accessible for Owner/Admin to toggle modules & staff)
    {
      id: 'settings',
      moduleKey: 'settings',
      label: t('nav.settings', 'Settings'),
      icon: IconSettings,
      permissionCheck: hasPermission('settings.read') || hasPermission('settings.update'),
    },
  ];

  const visibleItems = navItems.filter(
    (item) => item.permissionCheck !== false && isModuleEnabled(item.moduleKey)
  );

  return (
    <aside
      className={`hidden md:flex flex-col h-screen bg-[#FFFFFF] text-[#1C1917] border-r border-[#E7E5E4] transition-all duration-200 select-none z-30 flex-shrink-0 ${
        isCollapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#E7E5E4]">
        {!isCollapsed ? (
          <DecorBizLogo size="sm" showTagline={true} />
        ) : (
          <div className="mx-auto">
            <DecorBizLogo variant="symbol" size="sm" />
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <IconChevronRight className="w-4 h-4" /> : <IconChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Mode Badge */}
      {!isCollapsed && (
        <div className="px-3 pt-3">
          <div className="px-2.5 py-1 rounded-lg bg-[#F6F3EE] border border-[#E7E5E4] flex items-center justify-between text-[10px] font-semibold text-[#57534E]">
            <span>{isSimpleMode ? t('modules.simpleModeActive', 'Simple Mode Active') : t('modules.customModeActive', 'Custom Modules Active')}</span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {visibleItems.map((item) => {
          const isActive = activeModule === item.id || (item.id === 'pos' && activeModule === 'billing');
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectModule(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#1F4D3A] text-white shadow-sm'
                  : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#F6F3EE]'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#57534E]'}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-[#E7E5E4]">
        <button
          type="button"
          onClick={onOpenProfile}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#F6F3EE] transition-colors cursor-pointer text-left"
        >
          <div className="w-8 h-8 rounded-full bg-[#1F4D3A]/10 text-[#1F4D3A] flex items-center justify-center font-bold text-xs flex-shrink-0">
            {userName ? userName[0].toUpperCase() : 'U'}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-[#1C1917] truncate">{userName}</div>
              <div className="text-[10px] text-stone-500 capitalize truncate">{userRole}</div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
