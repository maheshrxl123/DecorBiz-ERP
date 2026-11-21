import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  FileSpreadsheet,
  Package,
  Users,
  CreditCard,
  ShoppingBag,
  BarChart3,
  ReceiptText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Activity,
  Warehouse,
  CheckSquare,
  Globe,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { NavModuleId } from '../types';
import { DecorBizLogo } from '../design/DecorBizLogo';
import { useWorkspace } from '../context/WorkspaceContext';
import { MODULE_REGISTRY } from '../../config/modules.config';
import { t } from '../i18n';

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

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  isCollapsed,
  onToggleCollapse,
  userName = 'Admin User',
  userRole = 'Owner',
  onOpenProfile,
}) => {
  const { hasPermission, organization } = useWorkspace();

  // Showroom modules per PRD Section 5.2 & Section 16
  const navItems: { id: NavModuleId; label: string; icon: any; permissionCheck?: boolean }[] = [
    { id: 'dashboard', label: t('nav.home', 'Dashboard'), icon: LayoutDashboard },
    { id: 'pos', label: t('nav.bills', 'Billing (POS)'), icon: Receipt, permissionCheck: hasPermission('pos.create') },
    { id: 'quotations', label: t('nav.quotations', 'Quotations'), icon: FileSpreadsheet, permissionCheck: hasPermission('pos.create') },
    { id: 'inventory', label: t('nav.inventory', 'Items & Stock'), icon: Package, permissionCheck: hasPermission('inventory.read') },
    { id: 'customers', label: t('nav.parties', 'Parties & Khata'), icon: Users, permissionCheck: hasPermission('customer.read') },
    { id: 'collections', label: t('nav.payments', 'Payments'), icon: CreditCard, permissionCheck: hasPermission('pos.create') },
    { id: 'purchases', label: t('nav.purchases', 'Purchases'), icon: ShoppingBag, permissionCheck: hasPermission('purchases.read') },
    { id: 'reports', label: t('nav.reports', 'Reports'), icon: BarChart3, permissionCheck: hasPermission('reports.read') },
    { id: 'gst_accounts', label: 'GST Reports', icon: ReceiptText, permissionCheck: hasPermission('reports.read') },
    { id: 'settings', label: t('nav.settings', 'Settings'), icon: Settings, permissionCheck: hasPermission('settings.read') || hasPermission('settings.update') },
  ];

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
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {navItems.map((item) => {
          if (item.permissionCheck === false) return null;
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
