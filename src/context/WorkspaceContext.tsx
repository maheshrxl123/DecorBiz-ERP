import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import { collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { getFirestoreDb } from '../lib/firebase/config';
import { useAuth } from '../auth/AuthProvider';
import { userService } from '../services/userService';
import { organizationService } from '../services/organizationService';
import { staffService } from '../services/staffService';
import { auditService } from '../services/auditService';
import { roleResolverService, ResolvedRolePermissions } from '../services/roleResolverService';
import { storeResolverService, ResolvedStoreAccess } from '../services/storeResolverService';
import { moduleSettingsService } from '../services/moduleSettingsService';
import {
  Organization,
  PharmacyStore,
  StaffMember,
  FirestoreUser,
  Permission,
} from '../types/firestore';

export type ExtendedWorkspaceState =
  | 'checking'
  | 'unauthenticated'
  | 'authenticated-no-membership'
  | 'active-membership'
  | 'suspended-membership'
  | 'invalid-membership'
  | 'no-accessible-store'
  | 'provisioning'
  | 'error';

export interface AvailableMembership {
  organization: Organization;
  staff: StaffMember;
}

export interface CreateWorkspaceParams {
  orgName: string;
  legalName?: string;
  gstin?: string;
  mainStoreName: string;
  mainStoreCode?: string;
  phone?: string;
  email?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  drugLicenseNumber?: string;
}

interface WorkspaceContextType {
  firestoreUser: FirestoreUser | null;
  organization: Organization | null;
  currentStore: PharmacyStore | null;
  stores: PharmacyStore[]; // Accessible stores
  allStores: PharmacyStore[]; // All organization stores
  currentStaff: StaffMember | null;
  resolvedRole: ResolvedRolePermissions | null;
  resolvedStoreAccess: ResolvedStoreAccess | null;
  availableMemberships: AvailableMembership[];
  workspaceState: ExtendedWorkspaceState;
  isLoading: boolean;
  hasWorkspace: boolean;
  error: string | null;
  activeModules: Record<string, boolean>;
  isSimpleMode: boolean;
  isModuleEnabled: (moduleId: string) => boolean;
  updateModules: (updates: Record<string, boolean>) => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  canAccessStore: (storeId: string) => boolean;
  switchOrganization: (orgId: string) => Promise<void>;
  switchStore: (storeId: string) => void;
  createWorkspace: (params: CreateWorkspaceParams) => Promise<void>;
  refreshWorkspace: () => Promise<void>;
  clearError: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, status: authStatus } = useAuth();

  const [firestoreUser, setFirestoreUser] = useState<FirestoreUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [stores, setStores] = useState<PharmacyStore[]>([]);
  const [allStores, setAllStores] = useState<PharmacyStore[]>([]);
  const [currentStore, setCurrentStore] = useState<PharmacyStore | null>(null);
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);
  const [resolvedRole, setResolvedRole] = useState<ResolvedRolePermissions | null>(null);
  const [resolvedStoreAccess, setResolvedStoreAccess] = useState<ResolvedStoreAccess | null>(null);
  const [availableMemberships, setAvailableMemberships] = useState<AvailableMembership[]>([]);
  const [selectedOrgIdOverride, setSelectedOrgIdOverride] = useState<string | null>(null);
  const [workspaceState, setWorkspaceState] = useState<ExtendedWorkspaceState>('checking');
  const [activeModules, setActiveModules] = useState<Record<string, boolean>>(() =>
    moduleSettingsService.getSimpleModeDefaults()
  );
  const [error, setError] = useState<string | null>(null);

  const isProvisioningRef = useRef<boolean>(false);

  /**
   * Helper to discover all organization staff memberships for the authenticated user
   */
  const discoverUserMemberships = async (
    uid: string,
    primaryOrgIdPref?: string | null
  ): Promise<AvailableMembership[]> => {
    const db = getFirestoreDb();
    const foundMap = new Map<string, AvailableMembership>();

    const checkAndAddOrg = async (orgId: string) => {
      if (!orgId || foundMap.has(orgId)) return;
      try {
        const staffDoc = await staffService.getStaffMember(orgId, uid);
        if (staffDoc) {
          const orgDoc = await organizationService.getOrganization(orgId);
          if (orgDoc && orgDoc.status !== 'inactive') {
            foundMap.set(orgId, { organization: orgDoc, staff: staffDoc });
          }
        }
      } catch (err) {
        console.warn(`Error checking candidate organization ${orgId}:`, err);
      }
    };

    // 1. Explicit lookup for primaryOrganizationId preference if set
    if (primaryOrgIdPref) {
      await checkAndAddOrg(primaryOrgIdPref);
    }

    // 2. CollectionGroup query across all staff collections for the user's UID
    try {
      const staffQuery = query(collectionGroup(db, 'staff'), where('uid', '==', uid));
      const snapshot = await getDocs(staffQuery);
      for (const docSnap of snapshot.docs) {
        const orgId = docSnap.ref.parent.parent?.id;
        if (orgId && !foundMap.has(orgId)) {
          await checkAndAddOrg(orgId);
        }
      }
    } catch (cgErr) {
      console.warn('CollectionGroup staff discovery query warning:', cgErr);
    }

    return Array.from(foundMap.values());
  };

  const loadWorkspace = useCallback(async (orgIdOverride?: string) => {
    if (!user || !isAuthenticated || authStatus !== 'authenticated') {
      setFirestoreUser(null);
      setOrganization(null);
      setStores([]);
      setAllStores([]);
      setCurrentStore(null);
      setCurrentStaff(null);
      setResolvedRole(null);
      setResolvedStoreAccess(null);
      setAvailableMemberships([]);
      setWorkspaceState('unauthenticated');
      return;
    }

    if (isProvisioningRef.current) {
      return;
    }

    setWorkspaceState('checking');
    setError(null);

    try {
      // 1. Fetch / initialize root user profile (/users/{uid})
      let profile: FirestoreUser | null = null;
      try {
        profile = await userService.getUserProfile(user.uid);
      } catch (profileFetchErr: any) {
        if (profileFetchErr?.code === 'permission-denied') {
          throw profileFetchErr;
        }
        console.warn('Profile fetch warning:', profileFetchErr);
      }

      if (!profile) {
        profile = await userService.createUserProfile(user.uid, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          primaryOrganizationId: null,
        });
      }
      setFirestoreUser(profile);

      // 2. Discover all staff memberships across organizations
      const memberships = await discoverUserMemberships(user.uid, profile?.primaryOrganizationId);
      setAvailableMemberships(memberships);

      if (memberships.length === 0) {
        // Authenticated user with NO memberships
        setOrganization(null);
        setStores([]);
        setAllStores([]);
        setCurrentStore(null);
        setCurrentStaff(null);
        setResolvedRole(null);
        setResolvedStoreAccess(null);
        setWorkspaceState('authenticated-no-membership');
        return;
      }

      // Separate active vs suspended memberships
      const activeMemberships = memberships.filter((m) => m.staff.status === 'active');
      const suspendedMemberships = memberships.filter((m) => m.staff.status === 'suspended');

      if (activeMemberships.length === 0 && suspendedMemberships.length > 0) {
        // Only suspended membership(s) found
        const suspendedTarget = suspendedMemberships[0];
        setOrganization(suspendedTarget.organization);
        setCurrentStaff(suspendedTarget.staff);
        setStores([]);
        setAllStores([]);
        setCurrentStore(null);
        setResolvedRole(null);
        setResolvedStoreAccess(null);
        setWorkspaceState('suspended-membership');
        return;
      }

      // 3. Determine selected active organization
      let selectedMembership: AvailableMembership | undefined;

      // Priority A: Override selection (explicit parameter or user-selected org)
      const effectiveOrgOverride = orgIdOverride || selectedOrgIdOverride;
      if (effectiveOrgOverride) {
        selectedMembership = activeMemberships.find((m) => m.organization.id === effectiveOrgOverride);
      }

      // Priority B: Profile primaryOrganizationId preference
      if (!selectedMembership && profile?.primaryOrganizationId) {
        selectedMembership = activeMemberships.find((m) => m.organization.id === profile.primaryOrganizationId);
      }

      // Priority C: First active membership
      if (!selectedMembership && activeMemberships.length > 0) {
        selectedMembership = activeMemberships[0];
      }

      if (!selectedMembership) {
        setWorkspaceState('authenticated-no-membership');
        return;
      }

      const activeOrg = selectedMembership.organization;
      const activeStaff = selectedMembership.staff;

      // 4. Resolve Role & Permissions via Centralized Role Resolver Service
      const rolePermissions = await roleResolverService.resolveStaffRole(activeOrg.id, user.uid, activeStaff);

      // 5. Fetch all organization stores and resolve store access via Store Resolver Service
      const orgStores = await organizationService.getStores(activeOrg.id);
      const storeAccess = storeResolverService.resolveStoreAccess(
        activeOrg.id,
        activeStaff,
        orgStores,
        currentStore?.id
      );

      setOrganization(activeOrg);
      setCurrentStaff(activeStaff);
      setResolvedRole(rolePermissions);
      setAllStores(orgStores);
      setStores(storeAccess.accessibleStores);
      setCurrentStore(storeAccess.defaultStore);
      setResolvedStoreAccess(storeAccess);

      // 6. Load Owner module switches (defaults to Simple Mode per PRD Section 4.1)
      const loadedModules = await moduleSettingsService.loadModuleSettings(activeOrg.id);
      setActiveModules(loadedModules);

      if (storeAccess.accessibleStores.length === 0) {
        setWorkspaceState('no-accessible-store');
      } else {
        setWorkspaceState('active-membership');
      }
    } catch (err: any) {
      console.error('Workspace load error:', err);
      const isPermissionDenied =
        err?.code === 'permission-denied' ||
        err?.message?.toLowerCase().includes('missing or insufficient permissions');
      setWorkspaceState(isPermissionDenied ? 'error' : 'invalid-membership');
      setError(
        isPermissionDenied
          ? 'Cloud Firestore permission denied while reading or initializing your user profile. Please publish the latest firestore.rules in Firebase Console -> Firestore Database -> Rules.'
          : 'An error occurred while verifying your DecorBiz business workspace access.'
      );
    }
  }, [user, isAuthenticated, authStatus, selectedOrgIdOverride]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  /**
   * Switch store selection (within current accessible stores)
   */
  const switchStore = (storeId: string) => {
    if (resolvedStoreAccess?.canAccessStore(storeId)) {
      const targetStore = stores.find((s) => s.id === storeId);
      if (targetStore) {
        setCurrentStore(targetStore);
      }
    }
  };

  /**
   * Switch active organization
   */
  const switchOrganization = async (orgId: string) => {
    setSelectedOrgIdOverride(orgId);
    if (user) {
      try {
        await userService.updateUserProfile(user.uid, {
          primaryOrganizationId: orgId,
        });
      } catch (err) {
        console.warn('Failed to update primaryOrganizationId preference:', err);
      }
    }
  };

  const clearError = () => setError(null);

  /**
   * Check if current staff user possesses a specific permission
   */
  const hasPermission = (permission: Permission): boolean => {
    return roleResolverService.hasPermission(resolvedRole, permission);
  };

  /**
   * Check whether a PRD module switch is currently enabled
   */
  const isModuleEnabled = useCallback(
    (moduleId: string): boolean => {
      if (moduleId === 'dashboard' || moduleId === 'billing' || moduleId === 'settings') {
        return true;
      }
      return Boolean(activeModules[moduleId]);
    },
    [activeModules]
  );

  /**
   * Persist updated module switches to Cloud Firestore (Owner/Admin only)
   */
  const updateModules = useCallback(
    async (updates: Record<string, boolean>) => {
      if (!organization?.id || !user?.uid) {
        throw new Error('Active showroom workspace is required to update module settings.');
      }
      const nextMap = { ...activeModules, ...updates };
      const saved = await moduleSettingsService.saveModuleSettings(organization.id, nextMap, user.uid);
      setActiveModules(saved);
    },
    [activeModules, organization?.id, user?.uid]
  );

  /**
   * Check if current staff user can access a specific store ID
   */
  const canAccessStore = (storeId: string): boolean => {
    if (!resolvedStoreAccess) return false;
    return resolvedStoreAccess.canAccessStore(storeId);
  };

  /**
   * Create a new DecorBiz organization workspace
   */
  const createWorkspace = async (params: CreateWorkspaceParams) => {
    if (!user) {
      throw new Error('You must be signed in to create a DecorBiz workspace.');
    }

    if (isProvisioningRef.current) {
      console.warn('Workspace provisioning is already in progress.');
      return;
    }

    isProvisioningRef.current = true;
    setWorkspaceState('provisioning');
    setError(null);

    try {
      const result = await organizationService.createOrganization({
        ...params,
        ownerUid: user.uid,
        ownerEmail: user.email || '',
        ownerName: user.displayName || user.email?.split('@')[0] || 'Business Owner',
      });

      try {
        await auditService.logAuditEvent({
          organizationId: result.organization.id,
          storeId: result.store.id,
          actorUid: user.uid,
          actorEmail: user.email,
          actorDisplayName: user.displayName,
          action: 'organization.provisioned',
          entityType: 'organization',
          entityId: result.organization.id,
          metadata: {
            orgName: result.organization.name,
            storeName: result.store.name,
          },
        });
      } catch (auditErr) {
        console.warn('Operational audit log warning:', auditErr);
      }

      setSelectedOrgIdOverride(result.organization.id);
      isProvisioningRef.current = false;
      await loadWorkspace(result.organization.id);
    } catch (err: any) {
      isProvisioningRef.current = false;
      console.error('Workspace provisioning error:', err);

      let friendlyMessage = 'Unable to create your DecorBiz workspace right now. Please check your connection and try again.';
      if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
        friendlyMessage = 'Permission denied while creating workspace. Please publish the latest firestore.rules in Firebase Console and try again.';
      }

      setError(friendlyMessage);
      setWorkspaceState('error');
      throw new Error(friendlyMessage);
    }
  };

  const isSimpleMode = useMemo(
    () => moduleSettingsService.isSimpleModeConfig(activeModules),
    [activeModules]
  );

  const value = useMemo<WorkspaceContextType>(
    () => ({
      firestoreUser,
      organization,
      currentStore,
      stores,
      allStores,
      currentStaff,
      resolvedRole,
      resolvedStoreAccess,
      availableMemberships,
      workspaceState,
      isLoading: workspaceState === 'checking' || workspaceState === 'provisioning',
      hasWorkspace: workspaceState === 'active-membership' && !!organization && !!currentStore && !!currentStaff && !!resolvedRole,
      error,
      activeModules,
      isSimpleMode,
      isModuleEnabled,
      updateModules,
      hasPermission,
      canAccessStore,
      switchOrganization,
      switchStore,
      createWorkspace,
      refreshWorkspace: loadWorkspace,
      clearError,
    }),
    [
      firestoreUser,
      organization,
      currentStore,
      stores,
      allStores,
      currentStaff,
      resolvedRole,
      resolvedStoreAccess,
      availableMemberships,
      workspaceState,
      error,
      activeModules,
      isSimpleMode,
      isModuleEnabled,
      updateModules,
      loadWorkspace,
    ]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
