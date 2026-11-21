import React from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ShieldAlert, LogOut, Building2, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { DecorBizLogo } from '../../design/DecorBizLogo';

export const AccessSuspendedView: React.FC = () => {
  const { signOut } = useAuth();
  const {
    organization,
    availableMemberships,
    switchOrganization,
  } = useWorkspace();

  const activeMemberships = availableMemberships.filter((m) => m.staff.status === 'active');

  return (
    <div className="min-h-screen w-screen bg-[#F6F3EE] flex flex-col items-center justify-center p-4 sm:p-6 text-[#1C1917] antialiased">
      <div className="mb-6">
        <DecorBizLogo size="md" showTagline={false} />
      </div>

      <div className="w-full max-w-md bg-white border border-[#E7E5E4] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-[#1C1917]">Access Suspended</h1>
          <p className="text-xs text-stone-600 leading-relaxed">
            Your access to <span className="font-semibold text-[#1C1917]">{organization?.name || 'this showroom workspace'}</span> has been suspended by an administrator.
          </p>
        </div>

        {activeMemberships.length > 0 && (
          <div className="pt-4 border-t border-[#E7E5E4] space-y-3 text-left">
            <p className="text-xs font-semibold text-stone-700">Switch to an Active Workspace:</p>
            <div className="space-y-2">
              {activeMemberships.map((m) => (
                <button
                  key={m.organization.id}
                  onClick={() => switchOrganization(m.organization.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F6F3EE] border border-[#E7E5E4] hover:border-[#1F4D3A] transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-[#1F4D3A]" />
                    <div>
                      <p className="text-xs font-bold text-[#1C1917] group-hover:text-[#1F4D3A] transition-colors">
                        {m.organization.name}
                      </p>
                      <p className="text-[11px] text-stone-500 capitalize">Role: {m.staff.roleId}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#1F4D3A] transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-[#E7E5E4] flex justify-center">
          <Button
            variant="ghost"
            onClick={signOut}
            className="text-xs text-stone-600 hover:text-[#1C1917] hover:bg-[#F6F3EE]"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
