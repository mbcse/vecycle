import { useEffect, useState } from "react";

import { Button, Fade, HStack, Text } from "@chakra-ui/react";
import { useWallet, useWalletModal, WalletButton } from "@vechain/dapp-kit-react";
import { FaWallet } from "react-icons/fa6";

// import { AddressIcon } from "./Icon";
 const humanAddress = (
    address: string,
    lengthBefore = 4,
    lengthAfter = 10,
  ) => {
    const before = address.substring(0, lengthBefore);
    const after = address.substring(address.length - lengthAfter);
    return `${before}…${after}`;
  };


export const ConnectWalletButton = () => {
    const { account } = useWallet();
    const { open, onConnectionStatusChange } = useWalletModal();
    const [buttonText, setButtonText] = useState('Connect Wallet');

    useEffect(() => {
        const handleConnected = (address: string | null): void => {
            if (address) {
                const formattedAddress = `${address.slice(
                    0,
                    6,
                )}...${address.slice(-4)}`;
                setButtonText(`Disconnect from ${formattedAddress}`);
            } else {
                setButtonText('Connect Wallet');
            }
        };

        handleConnected(account);

        onConnectionStatusChange(handleConnected);
    }, [account, onConnectionStatusChange]);

    return (
        <div className="container">
            <WalletButton />
            {/* <button onClick={open} type="button">
                {buttonText}
            </button> */}
        </div>
    );
};