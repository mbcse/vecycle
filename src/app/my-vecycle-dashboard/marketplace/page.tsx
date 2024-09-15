"use client";
import { useEffect, useState } from "react";

import { Box, Flex, Text, SimpleGrid, Button, Stack } from "@chakra-ui/react";
import { useWallet, useConnex } from '@vechain/dapp-kit-react';
import { ethers } from "ethers"; // If you need it for ether conversion

import { Footer, Header } from "@/components";
import LoadingScreen from "@/components/MainPane/components/LoadingScreen";
import { NftCard } from "@/components/NftCard";
import { SideBar } from "@/components/Sidebar";
import { VECYCLE_CONTRACT_ADDRESS } from "@/config";

export default function ListedProducts() {
  const { account } = useWallet();
  const { thor } = useConnex();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      if (!account) return;
      setIsLoading(true);
      try {

        // Instantiate the contract for `getUserListedProducts`
        const contract = thor.account(VECYCLE_CONTRACT_ADDRESS[100010]).method({
          inputs: [{ internalType: "address", name: "_user", type: "address" }],
          name: "getUserListedProducts",
          outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
          stateMutability: "view",
          type: "function",
        });

        // Fetch product IDs listed by the user
        const productIds = await contract.call(account);
        const productList = [];

        // Iterate over each product ID to fetch product details and dispute information
        for (const productId of productIds.decoded[0]) {
          const productContract = thor.account(VECYCLE_CONTRACT_ADDRESS[100010]).method({
            inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            name: "productInfo",
            outputs: [
              { internalType: "uint256", name: "price", type: "uint256" },
              { internalType: "uint256", name: "quantity", type: "uint256" },
              { internalType: "enum VeCycle.ProductListingStatus", name: "listingStatus", type: "uint8" },
              { internalType: "enum VeCycle.ProductApprovalStatus", name: "approvalStatus", type: "uint8" },
              { internalType: "string", name: "metadata", type: "string" },
              { internalType: "uint256", name: "rewardRate", type: "uint256" },
              { internalType: "uint256", name: "deliveryTime", type: "uint256" },
              { internalType: "uint256", name: "deliveredTime", type: "uint256" },
              { internalType: "bool", name: "disputeRaised", type: "bool" },
              { internalType: "uint256", name: "disputeId", type: "uint256" },
            ],
            stateMutability: "view",
            type: "function",
          });

          const productData = await productContract.call(productId);
          console.log(productData)
          const metaDataRes = await fetch(productData.decoded[4].replace('ipfs://', 'https://gateway.lighthouse.storage/ipfs/'));
          const metadata = (await metaDataRes.json());
          console.log(metadata)
          const productInfo = {
            id: productId,
            price: ethers.formatEther(productData.decoded[0]), // Assuming price is in wei
            rewardRate: productData.decoded[5] + "%",
            deliveryTime: new Date(productData.decoded[6] * 1000).toLocaleString(),
            metadata: metadata.description,
            disputeRaised: productData.decoded[8],
            uri: metadata.image.replace('ipfs://', 'https://gateway.lighthouse.storage/ipfs/')
          };

          // If there's a dispute, fetch dispute details
          if (productInfo.disputeRaised) {
            const disputeContract = thor.account(VECYCLE_CONTRACT_ADDRESS[100010]).method({
              inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
              name: "disputeInfo",
              outputs: [
                { internalType: "string", name: "reason", type: "string" },
                { internalType: "bool", name: "resolved", type: "bool" },
                { internalType: "bool", name: "approved", type: "bool" },
                { internalType: "uint256", name: "approvals", type: "uint256" },
                { internalType: "uint256", name: "rejections", type: "uint256" },
              ],
              stateMutability: "view",
              type: "function",
            });

            const disputeData = await disputeContract.call(productId);
            const disputeInfo = {
              reason: disputeData.decoded[0],
              resolved: disputeData.decoded[1],
              approved: disputeData.decoded[2],
              approvals: disputeData.decoded[3],
              rejections: disputeData.decoded[4],
            };

            productInfo["disputeInfo"] = disputeInfo;
          }

          productList.push(productInfo);
        }

        setItems(productList);
      } catch (error) {
        console.error("Failed to fetch items", error);
      }
      setIsLoading(false);
    };

    fetchItems();
  }, [account, thor]);

  return (
    <Flex flexDirection="column" minHeight="100vh" bg="gray.50">
      <LoadingScreen isLoading={isLoading} />
      <Header />
      <Text align="center" fontSize="4xl" my={6} color="purple.700">
        Listed Products
      </Text>
      <Flex>
        <SideBar />
        <Box as="main" flex={1} p={6} ml="250px">
          <SimpleGrid columns={{ sm: 1, md: 2, lg: 3 }} spacing={8}>
            {items.map((item) => (
              <Box key={item.id} borderWidth="1px" borderRadius="lg" overflow="hidden">
                <NftCard
                  title={item.metadata}
                  imageUrl={item.uri || "/placeholder.png"}
                  description={item.metadata}
                  price={item.price}
                  rewardRate={item.rewardRate}
                  deliveryTime={item.deliveryTime}
                />
                <Stack spacing={4} p={4}>
                  <Button colorScheme="teal" isDisabled={item.disputeRaised}>
                    {item.disputeRaised ? "In Dispute" : "Available"}
                  </Button>
                </Stack>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      </Flex>
      <Footer />
    </Flex>
  );
}
