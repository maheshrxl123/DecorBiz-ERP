import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { IconLock } from '@tabler/icons-react';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmationProvider } from './context/ConfirmationContext';
import { ToastContainer } from './components/ui/ToastContainer';
import { Sidebar } from './layouts/Sidebar';
import { Topbar } from './layouts/Topbar';
import { MobileBottomNav } from './layouts/MobileBottomNav';
import { useI18n } from './i18n';

// ERP Views
import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';
import { InterStoreTransfersView } from './views/InterStoreTransfersView';
import { PosView } from './views/PosView';
import { ProcurementModule } from './components/procurement/ProcurementModule';
import { CustomerManagement } from './components/customers/CustomerManagement';
import { ReturnsWorkspace } from './components/returns/ReturnsWorkspace';
import { FutureModuleView } from './views/FutureModuleView';
import { SettingsView } from './views/settings/SettingsView';
import { NotificationsCenter } from './views/NotificationsCenter';
import { ReplenishmentView } from './views/ReplenishmentView';
import { EInvoiceSettingsView } from './views/EInvoiceSettingsView';
import { CollectionsReceivablesView } from './views/CollectionsReceivablesView';
import { TileAnalyticsReportsView } from './views/TileAnalyticsReportsView';
import { EcommerceModuleView } from './views/EcommerceModuleView';
import { TasksWorkspaceView } from './views/TasksWorkspaceView';
import { AuditCentreView } from './views/AuditCentreView';
import { ActivityCentreView } from './views/ActivityCentreView';
import { WarehouseControlCenterView } from './components/warehouse/WarehouseControlCenterView';

// Common Modals & Drawers
import { GlobalSearch } from './components/common/GlobalSearch';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { notificationService } from './services/notificationService';
import { StoreSelectorModal } from './components/common/StoreSelectorModal';
import { UserProfileModal } from './components/common/UserProfileModal';
import { CommandPaletteHelpModal } from './components/common/CommandPaletteHelpModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthLoadingScreen } from './components/auth/AuthLoadingScreen';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Drawer } from './components/ui/Modal';
import { NavModuleId, StoreContext, UserProfile } from './types';

// Storefront & Auth Routes (PRD Section 2.2)
import { BusinessCard } from './storefront/BusinessCard';
import { Storefront404 } from './storefront/Storefront404';
import { StaffLoginView } from './views/auth/StaffLoginView';
import { WorkspaceSetupView } from './views/auth/WorkspaceSetupView';
import { CustomerAuthView } from './storefront/CustomerAuthView';

/**
 * Maps each ERP NavModuleId to its PRD Module Switch registry key.
 */
const MODULE_SWITCH_MAP: Partial<Record<NavModuleId, string>> = {
  dashboard: 'dashboard',
  pos: 'billing',
  billing: 'billing',
  quotations: 'quotations',
  inventory: 'inventory',
  customers: 'parties',
  parties: 'parties',
  collections: 'payments',
  payments: 'payments',
  reports: 'reports_basic',
  gst_accounts: 'gst_reports',
  purchases: 'purchases',
  suppliers: 'purchases',
  replenishment: 'purchases',
  expenses: 'expenses',
  ecommerce: 'storefront',
  storefront: 'storefront',
  warehouses: 'godowns',
  transfers: 'godowns',
  sales_returns: 'returns',
  tasks: 'projects',
  audit_centre: 'double_entry_accounts',
  activity_centre: 'double_entry_accounts',
  settings: 'settings',
};

const VALID_MODULES = new Set<NavModuleId>([
  'dashboard',
  'pos',
  'billing',
  'quotations',
  'inventory',
  'transfers',
  'purchases',
  'replenishment',
  'suppliers',
  'customers',
  'parties',
  'sales_returns',
  'notifications',
  'gst_accounts',
  'collections',
  'payments',
  'reports',
  'ecommerce',
  'storefront',
  'tasks',
  'audit_centre',
  'activity_centre',
  'warehouses',
  'expenses',
  'settings',
]);

/**
 * Dynamically injects `<meta name="robots" content="noindex, nofollow">` on all /erp/* & /create-workspace routes
 * per PRD Section 2.2 SEO isolation rules.
 */
function useErpSeoIsolation() {
  const location = useLocation();
  useEffect(() => {
    const isPrivateErpRoute =
      location.pathname.startsWith('/erp') || location.pathname.startsWith('/create-workspace');
    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta.content = isPrivateErpRoute ? 'noindex, nofollow, noarchive' : 'index, follow';
  }, [location.pathname]);
}

function AuthenticatedAppShell() {
  const { user } = useAuth();
  const {
    organization,
    currentStore: firestoreStore,
    currentStaff,
    firestoreUser,
    switchStore,
    hasPermission,
    isModuleEnabled,
  } = useWorkspace();
  const { t } = useI18n();
  const navigate = useNavigate();
  const params = useParams<{ module?: string }>();

  const resolvedParamModule: NavModuleId =
    params.module && VALID_MODULES.has(params.module as NavModuleId)
      ? (params.module as NavModuleId)
      : 'dashboard';

  const [activeModule, setActiveModule] = useState<NavModuleId>(resolvedParamModule);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  useEffect(() => {
    setActiveModule(resolvedParamModule);
  }, [resolvedParamModule]);

  // Real-time listener for unread notifications count
  useEffect(() => {
    if (!organization?.id || !user?.uid) {
      setUnreadNotificationsCount(0);
      return;
    }
    const unsubscribe = notificationService.subscribeUserNotifications(
      organization.id,
      user.uid,
      (list) => {
        const unread = list.filter((n) => !n.read).length;
        setUnreadNotificationsCount(unread);
      },
      (err) => {
        console.error('Failed to update unread notifications count:', err);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [organization?.id, user?.uid]);

  const activeStoreContext: StoreContext = {
    id: firestoreStore?.id || 'store_main',
    name: firestoreStore?.name || organization?.name || '',
    location: firestoreStore?.address
      ? [firestoreStore.address.city, firestoreStore.address.state].filter(Boolean).join(', ')
      : '',
    gstin: firestoreStore?.gstin || organization?.gstin || '',
    status: 'online',
  };

  const currentUser: UserProfile = {
    id: user?.uid || 'usr_staff',
    name: user?.displayName || user?.email?.split('@')[0] || 'Staff User',
    email: user?.email || '',
    role: (currentStaff?.roleId || 'Owner') as any,
    phone: currentStaff?.phone || undefined,
    photoURL: user?.photoURL || currentStaff?.photoURL || firestoreUser?.photoURL || undefined,
  };

  const handleSelectModule = (moduleId: NavModuleId) => {
    setActiveModule(moduleId);
    setIsMobileMenuOpen(false);
    navigate(moduleId === 'dashboard' ? '/erp' : `/erp/${moduleId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Keyboard Shortcuts (Ctrl+K search, Ctrl+/ help, F1 POS)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setIsHelpOpen((prev) => !prev);
      }
      if (e.key === 'F1') {
        e.preventDefault();
        handleSelectModule('pos');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isCurrentModuleAllowed = () => {
    if (activeModule === 'notifications' || activeModule === 'settings') return true;
    const switchKey = MODULE_SWITCH_MAP[activeModule];
    if (!switchKey) return true;
    if (activeModule === 'gst_accounts') {
      return isModuleEnabled('gst_reports') || isModuleEnabled('einvoice');
    }
    return isModuleEnabled(switchKey);
  };

  const renderActiveView = () => {
    if (!isCurrentModuleAllowed()) {
      return (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-10 text-center max-w-lg mx-auto my-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F6F3EE] text-[#1F4D3A] flex items-center justify-center mx-auto">
            <IconLock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#1C1917]">
            {t('modules.disabledTitle', 'Module Disabled')}
          </h2>
          <p className="text-xs text-[#57534E] leading-relaxed">
            {t(
              'modules.disabledDescription',
              'This module is currently turned off in Simple Mode. The showroom Owner can enable it under Settings -> Modules.'
            )}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleSelectModule('dashboard')}
              className="px-4 py-2 rounded-xl border border-[#E7E5E4] text-xs font-semibold text-[#1C1917] hover:bg-[#F6F3EE] cursor-pointer"
            >
              {t('nav.home', 'Dashboard')}
            </button>
            {(hasPermission('settings.read') || hasPermission('settings.update')) && (
              <button
                type="button"
                onClick={() => handleSelectModule('settings')}
                className="px-4 py-2 rounded-xl bg-[#1F4D3A] hover:bg-[#173A2B] text-white text-xs font-semibold cursor-pointer"
              >
                {t('modules.openModuleSettings', 'Open Module Settings')}
              </button>
            )}
          </div>
        </div>
      );
    }

    switch (activeModule) {
      case 'dashboard':
        return <DashboardView onNavigate={handleSelectModule} />;
      case 'pos':
      case 'billing':
        return <PosView />;
      case 'quotations':
        return <PosView />;
      case 'inventory':
        return <InventoryView />;
      case 'transfers':
        return <InterStoreTransfersView />;
      case 'purchases':
        return <ProcurementModule mode="purchases" />;
      case 'replenishment':
        return <ReplenishmentView />;
      case 'suppliers':
        return <ProcurementModule mode="suppliers" />;
      case 'customers':
      case 'parties':
        return <CustomerManagement />;
      case 'sales_returns':
        return <ReturnsWorkspace />;
      case 'notifications':
        return <NotificationsCenter onNavigateToModule={handleSelectModule} />;
      case 'gst_accounts':
        return <EInvoiceSettingsView />;
      case 'collections':
      case 'payments':
        return <CollectionsReceivablesView />;
      case 'reports':
        return <TileAnalyticsReportsView />;
      case 'ecommerce':
      case 'storefront':
        return <EcommerceModuleView />;
      case 'tasks':
        return <TasksWorkspaceView onNavigateToModule={handleSelectModule} />;
      case 'audit_centre':
        return <AuditCentreView />;
      case 'activity_centre':
        return <ActivityCentreView onNavigateToModule={handleSelectModule} />;
      case 'warehouses':
        return <WarehouseControlCenterView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <FutureModuleView
            moduleId={activeModule}
            onNavigateToActive={handleSelectModule}
          />
        );
    }
  };

  const mobileNavItems: { id: NavModuleId; moduleKey: string; label: string; allowed?: boolean }[] = [
    { id: 'dashboard', moduleKey: 'dashboard', label: t('nav.home', 'Dashboard') },
    { id: 'pos', moduleKey: 'billing', label: t('nav.bills', 'Billing (POS)'), allowed: hasPermission('pos.create') },
    { id: 'quotations', moduleKey: 'quotations', label: t('nav.quotations', 'Quotations'), allowed: hasPermission('pos.create') },
    { id: 'inventory', moduleKey: 'inventory', label: t('nav.inventory', 'Items & Stock'), allowed: hasPermission('inventory.read') },
    { id: 'customers', moduleKey: 'parties', label: t('nav.parties', 'Parties & Khata'), allowed: hasPermission('customer.read') },
    { id: 'collections', moduleKey: 'payments', label: t('nav.payments', 'Payments'), allowed: hasPermission('pos.create') },
    { id: 'reports', moduleKey: 'reports_basic', label: t('nav.reports', 'Reports'), allowed: hasPermission('reports.read') },
    { id: 'purchases', moduleKey: 'purchases', label: t('nav.purchases', 'Purchases'), allowed: hasPermission('purchases.read') },
    { id: 'replenishment', moduleKey: 'purchases', label: t('nav.replenishment', 'Replenishment'), allowed: hasPermission('purchases.read') },
    { id: 'warehouses', moduleKey: 'godowns', label: t('nav.warehouses', 'Godowns & Yards'), allowed: hasPermission('inventory.read') },
    { id: 'transfers', moduleKey: 'godowns', label: t('nav.transfers', 'Godown Transfers'), allowed: hasPermission('inventory.read') },
    { id: 'sales_returns', moduleKey: 'returns', label: t('nav.returns', 'Returns & Credit Notes'), allowed: hasPermission('pos.create') },
    { id: 'ecommerce', moduleKey: 'storefront', label: t('nav.storefront', 'Online Storefront'), allowed: hasPermission('inventory.read') },
    { id: 'tasks', moduleKey: 'projects', label: t('nav.tasks', 'Tasks') },
    {
      id: 'gst_accounts',
      moduleKey: isModuleEnabled('einvoice') ? 'einvoice' : 'gst_reports',
      label: isModuleEnabled('einvoice') ? t('nav.einvoice', 'E-Invoice & E-Way') : t('nav.gstReports', 'GST Reports'),
      allowed: hasPermission('reports.read'),
    },
    { id: 'audit_centre', moduleKey: 'double_entry_accounts', label: t('nav.auditCentre', 'Audit Log'), allowed: hasPermission('reports.read') },
    {
      id: 'settings',
      moduleKey: 'settings',
      label: t('nav.settings', 'Settings'),
      allowed: hasPermission('settings.read') || hasPermission('settings.update'),
    },
  ];

  return (
    <div className="h-screen w-screen bg-[#F6F3EE] text-[#1C1917] flex flex-col md:flex-row antialiased overflow-hidden">
      {/* Desktop Sidebar (240px collapsing to 72px per PRD 5.2) */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={handleSelectModule}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        unreadNotificationsCount={unreadNotificationsCount}
        userName={currentUser.name}
        userRole={currentUser.role}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Topbar
          currentStore={activeStoreContext}
          currentUser={currentUser}
          unreadNotificationsCount={unreadNotificationsCount}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          onOpenStoreSelector={() => setIsStoreModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full mx-auto pb-20 md:pb-8 overscroll-contain">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Mobile 5-Control Bottom Nav Bar (PRD Section 5.2) */}
      <MobileBottomNav
        activeModule={activeModule}
        onSelectModule={handleSelectModule}
        onOpenMoreMenu={() => setIsMobileMenuOpen(true)}
        onQuickAction={(action) => {
          if (action === 'newBill') handleSelectModule('pos');
          else if (action === 'receivePayment') handleSelectModule('collections');
          else if (action === 'addParty') handleSelectModule('customers');
          else if (action === 'addItem') handleSelectModule('inventory');
          else if (action === 'newPurchase') handleSelectModule('purchases');
        }}
      />

      {/* Mobile Navigation Drawer (strictly filtered by active module switches) */}
      <Drawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title={activeStoreContext.name || 'DecorBiz'}
        subtitle="Showroom ERP Navigation"
        width="md"
      >
        <nav className="space-y-1">
          {mobileNavItems
            .filter((item) => item.allowed !== false && isModuleEnabled(item.moduleKey))
            .map((item) => {
              const isActive = activeModule === item.id || (item.id === 'pos' && activeModule === 'billing');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectModule(item.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#1F4D3A] text-white'
                      : 'text-[#57534E] hover:bg-[#F6F3EE] hover:text-[#1C1917]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
        </nav>
      </Drawer>

      {/* Modals & Dialogs */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={(route) => {
          if (route) handleSelectModule(route as any);
        }}
      />

      <CommandPaletteHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onNavigate={(mod) => handleSelectModule(mod)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNavigateToModule={(mod) => handleSelectModule(mod as any)}
      />

      <StoreSelectorModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        currentStore={activeStoreContext}
        onSelectStore={(st) => switchStore(st.id)}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}

function RootStorefrontRoute() {
  const [searchParams] = useSearchParams();
  const hasInviteParams = Boolean(
    searchParams.get('invite')?.trim() && searchParams.get('org')?.trim()
  );

  if (hasInviteParams) {
    return (
      <ProtectedRoute>
        <AuthenticatedAppShell />
      </ProtectedRoute>
    );
  }
  return <BusinessCard />;
}

function WorkspaceSetupRoute() {
  const { status } = useAuth();
  if (status === 'loading') {
    return <AuthLoadingScreen message="Preparing DecorBiz workspace setup..." />;
  }
  return (
    <WorkspaceProvider>
      <WorkspaceSetupView />
    </WorkspaceProvider>
  );
}

function StaffLoginRoute() {
  const { isAuthenticated, status } = useAuth();
  if (status === 'loading') {
    return <AuthLoadingScreen message="Verifying staff session..." />;
  }
  if (isAuthenticated) {
    return <Navigate to="/erp" replace />;
  }
  return <StaffLoginView />;
}

function ProtectedErpRoute() {
  const { status, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const hasInviteParams = Boolean(
    searchParams.get('invite')?.trim() && searchParams.get('org')?.trim()
  );

  if (status === 'loading') {
    return <AuthLoadingScreen message="Loading DecorBiz showroom..." />;
  }
  // PRD Section 2.2: Unauthenticated visit to /erp sees Storefront 404 (unless accepting an invitation)
  if ((!isAuthenticated || status === 'unauthenticated') && !hasInviteParams) {
    return <Storefront404 />;
  }
  return (
    <ProtectedRoute>
      <AuthenticatedAppShell />
    </ProtectedRoute>
  );
}

function RouterApp() {
  useErpSeoIsolation();

  return (
    <Routes>
      <Route path="/" element={<RootStorefrontRoute />} />
      <Route path="/account/login" element={<CustomerAuthView />} />
      <Route path="/create-workspace" element={<WorkspaceSetupRoute />} />
      <Route path="/erp/setup" element={<WorkspaceSetupRoute />} />
      <Route path="/erp/login" element={<StaffLoginRoute />} />
      <Route path="/erp" element={<ProtectedErpRoute />} />
      <Route path="/erp/:module" element={<ProtectedErpRoute />} />
      <Route path="*" element={<Storefront404 />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <ConfirmationProvider>
            <AuthProvider>
              <RouterApp />
              <ToastContainer />
            </AuthProvider>
          </ConfirmationProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
