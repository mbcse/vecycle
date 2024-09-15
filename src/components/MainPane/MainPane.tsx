import { useEffect, useState, type FC } from "react";

import { 
  Box, 
  Divider, 
  Flex, 
  Heading, 
  Text, 
  useColorMode, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel 
} from "@chakra-ui/react";
import { useWallet, useWalletModal } from '@vechain/dapp-kit-react';

import styles from "@/styles/mainPane.module.css";

import { Address } from "./components";
import CreateVeCycle from "./components/CreateVeCycle";
import SubmitContent from "./components/SubmitContent";

const MainPane: FC = () => {
  const { account } = useWallet();
  const { colorMode } = useColorMode();
  const { open, onConnectionStatusChange } = useWalletModal();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const handleConnected = (address: string | null): void => {
      if (address) {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    };

    handleConnected(account);
    onConnectionStatusChange(handleConnected);
  }, [account, onConnectionStatusChange]);

  return (
    <Box
      className={styles.container}
      border={colorMode === "light" ? "none" : "1px solid rgba(152, 161, 192, 0.24)"}
    >
      <Heading as="h2" fontSize={"2rem"} mb={1} className="text-shadow">
        List Your Product or Submit Content
      </Heading>

      <Heading as="h6" fontSize={"1rem"} mb={10} className="text-shadow">
        <Text color="orange.500">Write, Create, Sell: Earn B3TR!</Text>
      </Heading>

      <Flex className={styles.content}>
        {isConnected ? (
          <>
            <Address />
            <Divider mb={5} />

            <Tabs w="100%" variant="unstyled">
              <TabList display="flex" w="100%">
                <Tab 
                  w="50%" 
                  _selected={{ color: "white", bg: "teal.500" }}
                  _hover={{ bg: "teal.400" }}
                  _focus={{ boxShadow: "outline" }}
                  fontWeight="bold"
                  color="gray.500"
                  borderBottom="2px solid"
                  borderColor="teal.500"
                  transition="all 0.2s"
                >
                  List Your Product
                </Tab>
                <Tab 
                  w="50%" 
                  _selected={{ color: "white", bg: "blue.500" }}
                  _hover={{ bg: "blue.400" }}
                  _focus={{ boxShadow: "outline" }}
                  fontWeight="bold"
                  color="gray.500"
                  borderBottom="2px solid"
                  borderColor="blue.500"
                  transition="all 0.2s"
                >
                  Submit Content
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <CreateVeCycle />
                </TabPanel>
                <TabPanel>
                  <SubmitContent />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </>
        ) : (
          <Text>Connect to a wallet to start using the platform</Text>
        )}
      </Flex>
    </Box>
  );
};

export default MainPane;
