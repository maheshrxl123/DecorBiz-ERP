import React, { useState } from 'react';
import { StaffManagementView } from './StaffManagementView';
import { BranchesManagementTab } from '../../components/settings/BranchesManagementTab';
import { OrganizationSettingsTab } from '../../components/settings/OrganizationSettingsTab';
import { SecurityComplianceTab } from '../../components/settings/SecurityComplianceTab';
import { AuditLogViewerTab } from '../../components/settings/AuditLogViewerTab';
import { ModulesSettingsTab } from '../../components/settings/ModulesSettingsTab';
import { PageHeader } from '../../components/common/PageHeader';
import { KpiCard } from '../../components/ui/KpiCard';
import { Button } from '../../components/ui/Button';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';
import { useI18n } from '../../i18n';
import {
  IconUsers,
  IconBuildingStore,
  IconBuilding,
  IconShield,
  IconShieldCheck,
  IconRefresh,
  IconAdjustments,
  IconLanguage,
} from '@tabler/icons-react';

type SettingsTab = 'modules' | 'staff' | 'branches' | 'organization' | 'security' | 'audit';

interface TabConfig {
  id: SettingsTab;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
}

export const SettingsView: React.FC = () => {
  const { organization, stores, allStores, currentStore, currentStaff, resolvedRole, isSimpleMode, refreshWorkspace } =
    useWorkspace();
  const { success, error } = useToast();
  const { t, lang, setLanguage } = useI18n();
  const [activeTab, setActiveTab] = useState<SettingsTab>('modules');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshWorkspace();
      success('Platform configuration and role permissions refreshed.', 'Settings Synchronized');
    } catch (err: any) {
      error(err?.message || 'Failed to refresh platform configuration.', 'Sync Failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  const totalBranchesCount = allStores.length || stores.length || 0;
  const activeStaffRole = currentStaff?.roleId ? currentStaff.roleId.toUpperCase() : 'STAFF';
  const permissionsCount = resolvedRole?.permissions?.length || 0;

  const tabList: TabConfig[] = [
    {
      id: 'modules',
      label: t('settings.tabs.modules', 'Modules & Simple Mode'),
      subtitle: 'Enable or disable optional ERP modules per PRD Version 1–5',
      icon: IconAdjustments,
    },
    {
      id: 'staff',
      label: t('settings.tabs.staff', 'Staff & Roles'),
      subtitle: 'Employee provisioning, RBAC roles, and invite links',
      icon: IconUsers,
    },
    {
      id: 'branches',
      label: t('settings.tabs.branches', 'Showrooms & Branches'),
      subtitle: 'Showrooms, godown yards, stock depots, and billing points',
      icon: IconBuildingStore,
      badgeCount: totalBranchesCount,
    },
    {
      id: 'organization',
      label: t('settings.tabs.organization', 'Business Profile'),
      subtitle: 'Legal entity details, GSTIN, and statutory operational rules',
      icon: IconBuilding,
    },
    {
      id: 'security',
      label: t('settings.tabs.security', 'Security & Alerts'),
      subtitle: 'Multi-channel notifications, session guards, and credentials',
      icon: IconShield,
    },
    {
      id: 'audit',
      label: t('settings.tabs.audit', 'Audit Ledger'),
      subtitle: 'Immutable statutory compliance logs and event tracking',
      icon: IconShieldCheck,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t('settings.title', 'Settings & Configuration')}
        subtitle={t(
          'settings.subtitle',
          'Manage showroom modules, staff access, branches, language, and GST compliance'
        )}
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#1F4D3A] text-xs font-bold border border-emerald-200">
            <IconShieldCheck className="w-3.5 h-3.5" />
            {isSimpleMode ? t('modules.simpleModeActive', 'Simple Mode Active') : t('modules.customModeActive', 'Custom Modules Active')}
          </span>
        }
        primaryAction={
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-xl border border-[#E7E5E4] bg-white p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  lang === 'en' ? 'bg-[#1F4D3A] text-white' : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  lang === 'hi' ? 'bg-[#1F4D3A] text-white' : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                हिन्दी
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              className="flex items-center gap-2"
            >
              <IconRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Sync Config
            </Button>
          </div>
        }
      />

      {/* KPI Overview Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Business Entity"
          value={organization?.name || '—'}
          subtitle={organization?.gstin ? `GST: ${organization.gstin}` : 'GSTIN Not Configured'}
          icon={<IconBuilding className="w-5 h-5 text-[#1F4D3A]" />}
        />
        <KpiCard
          title="Showrooms & Branches"
          value={`${totalBranchesCount} Active`}
          subtitle={currentStore?.name ? `Current: ${currentStore.name}` : 'No Branch Selected'}
          icon={<IconBuildingStore className="w-5 h-5 text-indigo-600" />}
        />
        <KpiCard
          title="Active Operator Role"
          value={activeStaffRole}
          subtitle={`${permissionsCount} Assigned Privileges`}
          icon={<IconShield className="w-5 h-5 text-emerald-600" />}
        />
        <KpiCard
          title={t('settings.language', 'Display Language')}
          value={lang === 'hi' ? 'हिन्दी (Hindi)' : 'English (IN)'}
          subtitle={isSimpleMode ? 'Simple Mode (V1 Core)' : 'Extended Modules Enabled'}
          icon={<IconLanguage className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Tab Navigation & Content Container */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-xs overflow-hidden">
        <div className="p-2 sm:p-3 bg-[#FAF8F5] border-b border-[#E7E5E4] overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            {tabList.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all select-none cursor-pointer ${
                    isActive
                      ? 'bg-[#1F4D3A] text-white shadow-xs font-bold'
                      : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#E7E5E4]/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#57534E]'}`} />
                  <span>{tab.label}</span>
                  {tab.badgeCount !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#E7E5E4] text-[#57534E]'
                      }`}
                    >
                      {tab.badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6 sm:p-8 min-h-[540px]">
          {activeTab === 'modules' && <ModulesSettingsTab />}
          {activeTab === 'staff' && <StaffManagementView />}
          {activeTab === 'branches' && <BranchesManagementTab />}
          {activeTab === 'organization' && <OrganizationSettingsTab />}
          {activeTab === 'security' && <SecurityComplianceTab />}
          {activeTab === 'audit' && <AuditLogViewerTab />}
        </div>
      </div>
    </div>
  );
};
