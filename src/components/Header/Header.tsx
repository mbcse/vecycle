"use client";
import { type FC } from "react";

import { Button, HStack, Heading } from "@chakra-ui/react";
import { Avatar } from "@coinbase/onchainkit/identity";
import { useWallet } from '@vechain/dapp-kit-react';
import { Red_Rose } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

import { useWindowSize } from "@/hooks/useWindowSize";

import { ConnectWalletButton } from "./ConnectWalletButton";
import Vecycle from "../../../public/img/vecycle.png";
import { DarkModeButton } from "../DarkModeButton";



const Header: FC = () => {
  let { account: address } = useWallet();
  const { isTablet } = useWindowSize();

  if (!address) {
    address = "0x0000000000000000000000000000000000000000"; // 0 zero address
  }

  return (
    <HStack
      as="header"
      p={"1.5rem"}
      position="sticky"
      top={0}
      zIndex={10}
      justifyContent={"space-between"}
    >
      <HStack>
      <Link href={"/"}>

        <Image src={Vecycle.src} alt="logo" width={200} height={100} />
        {/* {!isTablet && ( */}
             {/* <Heading as="h1" fontSize={"1.5rem"} className="text-shadow">
            //   VeCycle
            // </Heading> */}
        {/* // )} */}
        </Link>
      </HStack>

      <HStack>
        <Button colorScheme="green">
          <Link href="/my-vecycle-dashboard/marketplace"> Dashboard </Link>
        </Button>
        <ConnectWalletButton/>
        <DarkModeButton />
      </HStack>
    </HStack>
  );
};

export default Header;
