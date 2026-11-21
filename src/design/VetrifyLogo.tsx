import React from 'react';
import { DecorBizLogo, DecorBizLogoProps } from './DecorBizLogo';

export type VetrifyLogoProps = DecorBizLogoProps & { useImage?: boolean };
export const VetrifyLogo: React.FC<VetrifyLogoProps> = (props) => {
  return <DecorBizLogo {...props} />;
};

export default VetrifyLogo;
