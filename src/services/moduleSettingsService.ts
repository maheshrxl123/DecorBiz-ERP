/**
 * DecorBiz Module Switches & Simple Mode Persistence Service
 * Persists Owner module switches to Cloud Firestore `settings/modules` (PRD Section 3.3 & 16)
 * and mirrors them on the active organization settings document for workspace consistency.
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestoreDb } from '../lib/firebase/config';
import { getActiveModules, MODULE_REGISTRY } from '../../config/modules.config';
import { moduleSettingsDoc } from '../lib/firebase/collections';

export interface ModuleSettingsRecord {
  modules: Record<string, boolean>;
  simpleMode: boolean;
  organizationId?: string;
  updatedBy?: string;
  updatedAt?: unknown;
}

export const moduleSettingsService = {
  /**
   * Compute default Simple Mode module map (only V1 core modules enabled).
   */
  getSimpleModeDefaults(): Record<string, boolean> {
    return getActiveModules();
  },

  /**
   * Check whether a module map matches default Simple Mode (all non-V1 modules off).
   */
  isSimpleModeConfig(modules: Record<string, boolean>): boolean {
    return Object.values(MODULE_REGISTRY).every((mod) => {
      if (mod.enabledInSimpleMode) return true;
      return !modules[mod.id];
    });
  },

  /**
   * Load module settings from Cloud Firestore (`settings/modules`, falling back to organization settings).
   */
  async loadModuleSettings(organizationId?: string | null): Promise<Record<string, boolean>> {
    const db = getFirestoreDb();

    try {
      const rootSnap = await getDoc(moduleSettingsDoc(db));
      if (rootSnap.exists()) {
        const data = rootSnap.data() as Partial<ModuleSettingsRecord>;
        if (data?.modules && typeof data.modules === 'object') {
          return getActiveModules(data.modules);
        }
      }
    } catch (err) {
      console.warn('Could not read root settings/modules:', err);
    }

    if (organizationId) {
      try {
        const orgSnap = await getDoc(doc(db, 'organizations', organizationId));
        if (orgSnap.exists()) {
          const orgModules = (orgSnap.data() as any)?.settings?.modules;
          if (orgModules && typeof orgModules === 'object') {
            return getActiveModules(orgModules);
          }
        }
      } catch (err) {
        console.warn('Could not read organization module settings:', err);
      }
    }

    return getActiveModules();
  },

  /**
   * Persist Owner module switch changes to Cloud Firestore (`settings/modules` + org settings mirror).
   */
  async saveModuleSettings(
    organizationId: string,
    modules: Record<string, boolean>,
    updatedByUid: string
  ): Promise<Record<string, boolean>> {
    const db = getFirestoreDb();
    const normalized = getActiveModules(modules);
    // Core Version 1 modules marked enabledInSimpleMode stay enabled to keep billing operational
    for (const mod of Object.values(MODULE_REGISTRY)) {
      if (mod.id === 'dashboard' || mod.id === 'billing') {
        normalized[mod.id] = true;
      }
    }
    const simpleMode = this.isSimpleModeConfig(normalized);

    // 1. Write to canonical PRD root document `settings/modules`
    await setDoc(
      moduleSettingsDoc(db),
      {
        modules: normalized,
        simpleMode,
        organizationId,
        updatedBy: updatedByUid,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 2. Mirror on active organization settings document
    if (organizationId) {
      await setDoc(
        doc(db, 'organizations', organizationId),
        {
          settings: {
            modules: normalized,
            simpleMode,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    return normalized;
  },
};
