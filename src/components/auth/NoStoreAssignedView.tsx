import React from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Store, LogOut, RefreshCw, Building2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { DecorBizLogo } from '../../design/DecorBizLogo';

export const NoStoreAssignedView: React.FC = () => {
  const { signOut } = useAuth();
  const { organization, refreshWorkspace, switchOrganization, availableMemberships } = useWorkspace();

  const otherActiveMemberships = availableMemberships.filter(
    (m) => m.staff.status === 'active' && m.organization.id !== organization?.id
  );

  return (
    <div className="min-h-screen w-screen bg-[#F6F3EE] flex flex-col items-center justify-center p-4 sm:p-6 text-[#1C1917] antialiased">
      <div className="mb-6">
        <DecorBizLogo size="md" showTagline={false} />
      </div>

      <div className="w-full max-w-md bg-white border border-[#E7E5E4] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
          <Store className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-[#1C1917]">No Showroom Branch Assigned</h1>
          <p className="text-xs text-stone-600 leading-relaxed">
            You are an active team member of <span className="font-semibold text-[#1C1917]">{organization?.name}</span>, but no showroom or warehouse branch is assigned to your profile yet.
          </p>
          <p className="text-[11px] text-stone-500">
            Please contact your showroom owner or administrator to assign a branch.
          </p>
        </div>

        {otherActiveMemberships.length > 0 && (
          <div className="pt-4 border-t border-[#E7E5E4] space-y-2 text-left">
            <p className="text-xs font-semibold text-stone-700">Or Switch Workspace:</p>
            {otherActiveMemberships.map((m) => (
              <button
                key={m.organization.id}
                onClick={() => switchOrganization(m.organization.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#F6F3EE] border border-[#E7E5E4] hover:border-[#1F4D3A] transition-colors text-xs text-[#1C1917] cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-[#1F4D3A]" />
                <span className="font-bold">{m.organization.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-[#E7E5E4] flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={signOut}
            className="text-xs text-stone-600 hover:text-[#1C1917] hover:bg-[#F6F3EE]"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>

          <Button
            variant="secondary"
            onClick={refreshWorkspace}
            className="text-xs bg-[#1F4D3A] text-white hover:bg-[#143528]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Check Again
          </Button>
        </div>
      </div>
    </div>
  );
};
