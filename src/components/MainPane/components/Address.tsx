import { type FC } from "react";

import { useWallet, useConnex, useWalletModal } from '@vechain/dapp-kit-react';

import { InfoText } from "@/components";
import { useWindowSize } from "@/hooks";
import { getEllipsisTxt } from "@/utils/formatters";


const Address: FC = (): JSX.Element => {
  const { account: address } = useWallet();
  const { isTablet } = useWindowSize();

  const displayedAddress = isTablet && address ? getEllipsisTxt(address, 4) : address;

  return <InfoText label="Address" value={displayedAddress} />;
};

export default Address;
