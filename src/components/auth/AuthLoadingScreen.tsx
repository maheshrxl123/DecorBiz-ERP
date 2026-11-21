import React from 'react';
import { DecorBizLogo } from '../../design/DecorBizLogo';

interface AuthLoadingScreenProps {
  message?: string;
}

export const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  message = 'Initializing DecorBiz showroom workspace...',
}) => {
  return (
    <div
      id="decorbiz-auth-loading-screen"
      className="min-h-screen w-full bg-[#F6F3EE] flex flex-col items-center justify-center p-6 text-[#1C1917] select-none"
    >
      <div className="flex flex-col items-center text-center max-w-sm w-full">
        <div className="mb-6">
          <DecorBizLogo size="lg" showTagline={true} />
        </div>

        <div className="w-8 h-8 border-2 border-[#1F4D3A]/20 border-t-[#1F4D3A] rounded-full animate-spin mb-4" />

        <p className="text-sm font-medium text-[#57534E]">{message}</p>
      </div>
    </div>
  );
};
