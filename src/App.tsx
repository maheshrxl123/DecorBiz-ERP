import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmationProvider } from './context/ConfirmationContext';
import { ToastContainer } from './components/ui/ToastContainer';
import { Sidebar } from './layouts/Sidebar';
import { Topbar } from './layouts/Topbar';
import { MobileBottomNav } from './layouts/MobileBottomNav';

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
import { APP_CONFIG } from '../config/app.config';

// Storefront & Auth Routes (PRD Section 2.2)
import { BusinessCard } from './storefront/BusinessCard';
import { Storefront404 } from './storefront/Storefront404';
import { StaffLoginView } from './views/auth/StaffLoginView';
import { WorkspaceSetupView } from './views/auth/WorkspaceSetupView';
import { CustomerAuthView } from './storefront/CustomerAuthView';

function AuthenticatedAppShell() {
  const { user } = useAuth();
  const { organization, currentStore: firestoreStore, currentStaff, firestoreUser, switchStore, hasPermission } = useWorkspace();
  const [activeModule, setActiveModule] = useState<NavModuleId>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

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
    name: firestoreStore?.name || organization?.name || APP_CONFIG.placeholderBusiness.tradeName,
    location: firestoreStore?.address
      ? [firestoreStore.address.city, firestoreStore.address.state].filter(Boolean).join(', ') || APP_CONFIG.placeholderBusiness.city
      : APP_CONFIG.placeholderBusiness.city,
    gstin: firestoreStore?.gstin || organization?.gstin || APP_CONFIG.placeholderBusiness.gstin,
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
        setActiveModule('pos');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectModule = (moduleId: NavModuleId) => {
    setActiveModule(moduleId);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderActiveView = () => {
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

      {/* Mobile Navigation Drawer */}
      <Drawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title={activeStoreContext.name}
        subtitle="Showroom ERP Navigation"
        width="md"
      >
        <nav className="space-y-1">
          {(
            [
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'pos', label: 'Billing (POS)', allowed: hasPermission('pos.create') },
              { id: 'quotations', label: 'Quotations', allowed: hasPermission('pos.create') },
              { id: 'inventory', label: 'Items & Stock', allowed: hasPermission('inventory.read') },
              { id: 'warehouses', label: 'Warehouses & Yards', allowed: hasPermission('inventory.read') },
              { id: 'transfers', label: 'Branch Transfers', allowed: hasPermission('inventory.read') },
              { id: 'customers', label: 'Parties & Khata', allowed: hasPermission('customer.read') },
              { id: 'collections', label: 'Payments & Collections', allowed: hasPermission('pos.create') },
              { id: 'purchases', label: 'Purchases & Suppliers', allowed: hasPermission('purchases.read') },
              { id: 'replenishment', label: 'Replenishment', allowed: hasPermission('purchases.read') },
              { id: 'sales_returns', label: 'Returns & Credit Notes', allowed: hasPermission('pos.create') },
              { id: 'ecommerce', label: 'Online Orders & Storefront', allowed: hasPermission('inventory.read') },
              { id: 'tasks', label: 'Tasks & Follow-ups' },
              { id: 'reports', label: 'Reports & Analytics', allowed: hasPermission('reports.read') },
              { id: 'gst_accounts', label: 'GST & E-Invoicing', allowed: hasPermission('reports.read') },
              { id: 'audit_centre', label: 'Audit Centre', allowed: hasPermission('reports.read') },
              { id: 'settings', label: 'Settings', allowed: hasPermission('settings.read') || hasPermission('settings.update') },
            ] as { id: NavModuleId; label: string; allowed?: boolean }[]
          )
            .filter((item) => item.allowed !== false)
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

function RouterApp() {
  const { status, isAuthenticated } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // SPA redirect when already authenticated on /erp/login (avoiding side effects during render)
  useEffect(() => {
    if (currentPath === '/erp/login' && isAuthenticated) {
      window.history.replaceState({}, '', '/erp');
      setCurrentPath('/erp');
    }
  }, [currentPath, isAuthenticated]);

  const searchParams = new URLSearchParams(window.location.search);
  const hasInviteParams = Boolean(
    searchParams.get('invite')?.trim() && searchParams.get('org')?.trim()
  );

  // 1. Root Storefront / Business Card (PRD Section 2.2 & W0) or Staff Invitation Acceptance
  if (currentPath === '/' || currentPath === '') {
    if (hasInviteParams) {
      return (
        <ProtectedRoute>
          <AuthenticatedAppShell />
        </ProtectedRoute>
      );
    }
    return <BusinessCard />;
  }

  // 2. Customer Authentication (/account/login)
  if (currentPath === '/account/login') {
    return <CustomerAuthView />;
  }

  // 3. First-Time Workspace Setup (/create-workspace or /erp/setup)
  if (currentPath === '/create-workspace' || currentPath === '/erp/setup') {
    if (status === 'loading') {
      return <AuthLoadingScreen message="Preparing DecorBiz workspace setup..." />;
    }
    return (
      <WorkspaceProvider>
        <WorkspaceSetupView />
      </WorkspaceProvider>
    );
  }

  // 4. Staff Login (/erp/login)
  if (currentPath === '/erp/login') {
    if (isAuthenticated) {
      return <AuthLoadingScreen message="Redirecting to showroom dashboard..." />;
    }
    return <StaffLoginView />;
  }

  // 5. Staff ERP Routes (/erp and /erp/*)
  if (currentPath.startsWith('/erp')) {
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

  // 6. Unknown Route -> Storefront 404
  return <Storefront404 />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmationProvider>
          <AuthProvider>
            <RouterApp />
            <ToastContainer />
          </AuthProvider>
        </ConfirmationProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
