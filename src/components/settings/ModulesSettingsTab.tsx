import React, { useState, useEffect } from 'react';
import {
  IconToggleLeft,
  IconToggleRight,
  IconRefresh,
  IconDeviceFloppy,
  IconSparkles,
  IconLock,
  IconCheck,
} from '@tabler/icons-react';
import { MODULE_REGISTRY, getActiveModules, type ModuleDefinition } from '../../../config/modules.config';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';
import { useI18n } from '../../i18n';

const VERSION_GROUPS: { version: 1 | 2 | 3 | 4 | 5; titleEn: string; titleHi: string; subtitle: string }[] = [
  {
    version: 1,
    titleEn: 'Version 1 — Core Showroom (Simple Mode)',
    titleHi: 'वर्ज़न 1 — मुख्य शोरूम (सिंपल मोड)',
    subtitle: 'Essential daily counter billing, quotations, items, parties, payments, and GST reports.',
  },
  {
    version: 2,
    titleEn: 'Version 2 — Purchasing & Control',
    titleHi: 'वर्ज़न 2 — खरीद और नियंत्रण',
    subtitle: 'Supplier purchases, expenses, stock audits, breakage register, and warranty tracking.',
  },
  {
    version: 3,
    titleEn: 'Version 3 — Online Storefront',
    titleHi: 'वर्ज़न 3 — ऑनलाइन वेबसाइट',
    subtitle: 'Public e-commerce catalogue, website order queue, coupons, loyalty, and showroom visits.',
  },
  {
    version: 4,
    titleEn: 'Version 4 — Delivery, Godowns & Projects',
    titleHi: 'वर्ज़न 4 — डिलीवरी, गोदाम और प्रोजेक्ट्स',
    subtitle: 'Multi-godown transfers, delivery challans, multi-room project suites, and sales returns.',
  },
  {
    version: 5,
    titleEn: 'Version 5 — Advanced Accounts, E-Invoice & AI',
    titleHi: 'वर्ज़न 5 — लेखांकन, ई-इनवॉइस और एआई',
    subtitle: 'Double-entry accounting, server-side GSP E-Invoice/E-Way Bill, and Owner-gated AI assistant.',
  },
];

export const ModulesSettingsTab: React.FC = () => {
  const { activeModules, isSimpleMode, currentStaff, updateModules } = useWorkspace();
  const { success, error: toastError } = useToast();
  const { t, isHindi } = useI18n();

  const [draft, setDraft] = useState<Record<string, boolean>>(activeModules);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(activeModules);
  }, [activeModules]);

  const isOwner = currentStaff?.roleId === 'owner' || currentStaff?.roleId === 'admin';
  const hasUnsavedChanges = Object.keys(MODULE_REGISTRY).some((id) => Boolean(draft[id]) !== Boolean(activeModules[id]));

  const toggleModule = (mod: ModuleDefinition) => {
    if (!isOwner) return;
    if (mod.id === 'dashboard' || mod.id === 'billing') return;
    setDraft((prev) => ({
      ...prev,
      [mod.id]: !prev[mod.id],
    }));
  };

  const handleResetSimpleMode = () => {
    if (!isOwner) return;
    setDraft(getActiveModules());
  };

  const handleSave = async () => {
    if (!isOwner) return;
    setIsSaving(true);
    try {
      await updateModules(draft);
      success('Module switches updated in Cloud Firestore.', 'Modules Saved');
    } catch (err: any) {
      toastError(err?.message || 'Failed to update module settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#F6F3EE] border border-[#E7E5E4]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <IconSparkles className="w-5 h-5 text-[#1F4D3A]" />
            <h3 className="text-base font-bold text-[#1C1917]">
              {t('modules.title', 'Modules & Simple Mode')}
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isSimpleMode
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {isSimpleMode
                ? t('modules.simpleModeActive', 'Simple Mode Active')
                : t('modules.customModeActive', 'Custom Modules Active')}
            </span>
          </div>
          <p className="text-xs text-[#57534E] max-w-2xl">
            {t(
              'modules.subtitle',
              'Control which ERP modules are active for your showroom. Simple Mode keeps only Version 1 core screens visible.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={!isOwner || isSaving}
            onClick={handleResetSimpleMode}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D6D3D1] bg-white hover:bg-stone-50 text-xs font-semibold text-[#1C1917] disabled:opacity-50 cursor-pointer"
          >
            <IconRefresh className="w-4 h-4" />
            <span>{t('modules.resetSimpleMode', 'Reset to Simple Mode')}</span>
          </button>
          <button
            type="button"
            disabled={!isOwner || !hasUnsavedChanges || isSaving}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F4D3A] hover:bg-[#173A2B] text-white text-xs font-semibold shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <IconDeviceFloppy className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : t('modules.saveChanges', 'Save Module Settings')}</span>
          </button>
        </div>
      </div>

      {!isOwner && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <IconLock className="w-4 h-4 flex-shrink-0" />
          <span>Only the showroom Owner can enable or disable ERP modules.</span>
        </div>
      )}

      {/* Versioned Module Groups */}
      <div className="space-y-6">
        {VERSION_GROUPS.map((group) => {
          const groupModules = Object.values(MODULE_REGISTRY).filter((m) => m.version === group.version);
          if (groupModules.length === 0) return null;

          return (
            <div key={group.version} className="rounded-2xl border border-[#E7E5E4] overflow-hidden bg-white">
              <div className="px-5 py-3.5 bg-[#FAF8F5] border-b border-[#E7E5E4]">
                <h4 className="text-sm font-bold text-[#1C1917]">
                  {isHindi ? group.titleHi : group.titleEn}
                </h4>
                <p className="text-xs text-[#57534E] mt-0.5">{group.subtitle}</p>
              </div>

              <div className="divide-y divide-[#F1EFEA]">
                {groupModules.map((mod) => {
                  const enabled = Boolean(draft[mod.id]);
                  const isLockedCore = mod.id === 'dashboard' || mod.id === 'billing';

                  return (
                    <div
                      key={mod.id}
                      className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-[#FAF8F5]/60 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-[#1C1917]">
                            {isHindi ? mod.nameHi : mod.name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                            {mod.id}
                          </span>
                          {mod.enabledInSimpleMode && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <IconCheck className="w-3 h-3" />
                              Simple Mode
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#57534E] mt-0.5">{mod.description}</p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        disabled={!isOwner || isLockedCore}
                        onClick={() => toggleModule(mod)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex-shrink-0 ${
                          isLockedCore
                            ? 'bg-emerald-50 text-emerald-700 cursor-not-allowed opacity-80'
                            : enabled
                              ? 'bg-[#1F4D3A] text-white hover:bg-[#173A2B] cursor-pointer'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 cursor-pointer'
                        } disabled:opacity-60`}
                      >
                        {enabled ? (
                          <>
                            <IconToggleRight className="w-5 h-5" />
                            <span>{isLockedCore ? 'Required' : 'ON'}</span>
                          </>
                        ) : (
                          <>
                            <IconToggleLeft className="w-5 h-5" />
                            <span>OFF</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
