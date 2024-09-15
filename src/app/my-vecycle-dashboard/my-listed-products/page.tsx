"use client";
import { useEffect, useState } from "react";

import {
  Box,
  Flex,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
  Link,
} from "@chakra-ui/react";
import { useWallet, useConnex } from "@vechain/dapp-kit-react"; // Assuming VeChain or similar integration
import { ethers } from "ethers";

import { Footer, Header } from "@/components";
import LoadingScreen from "@/components/MainPane/components/LoadingScreen";
import { SideBar } from "@/components/Sidebar";
import { VECYCLE_ABI, VECYCLE_CONTRACT_ADDRESS } from "@/config";

interface ProductInfo {
  id: number;
  price: string;
  rewardRate: string;
  deliveryTime: string;
  metadata: string;
  disputeRaised: boolean;
}

interface DisputeInfo {
  reason: string;
  resolved: boolean;
  approved: boolean;
  approvals: number;
  rejections: number;
  acceptors: string[];
  rejectors: string[];
}

export default function ListedItems() {
  const { account } = useWallet(); // Get user account from the wallet
  const { thor } = useConnex(); // Get connex object for blockchain interaction
  const [items, setItems] = useState<ProductInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      if (!account) return;
      setIsLoading(true);

      try {
        const contract = thor.account(VECYCLE_CONTRACT_ADDRESS[100010]).method({
          inputs: [{ internalType: "address", name: "_user", type: "address" }],
          name: "getUserListedProducts",
          outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
          stateMutability: "view",
          type: "function",
        });

        // Fetch product IDs listed by the user
        const productIds = await contract.call(account);
        console.log(productIds)
        const productList: ProductInfo[] = [];

        // Iterate over each product ID to fetch product details and dispute information
        for (const productId of productIds.decoded[0]) {
          const productContract = thor.account(VECYCLE_CONTRACT_ADDRESS[100010]).method({
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "name": "productInfo",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "price",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "quantity",
                    "type": "uint256"
                },
                {
                    "internalType": "enum VeCycle.ProductListingStatus",
                    "name": "listingStatus",
                    "type": "uint8"
                },
                {
                    "internalType": "enum VeCycle.ProductApprovalStatus",
                    "name": "approvalStatus",
                    "type": "uint8"
                },
                {
                    "internalType": "string",
                    "name": "metadata",
                    "type": "string"
                },
                {
                    "internalType": "uint256",
                    "name": "rewardRate",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "deliveryTime",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "deliveredTime",
                    "type": "uint256"
                },
                {
                    "internalType": "bool",
                    "name": "disputeRaised",
                    "type": "bool"
                },
                {
                    "internalType": "uint256",
                    "name": "disputeId",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        });

          const productData = await productContract.call(productId);
          console.log(productData);
          const productInfo: ProductInfo = {
            id: productId,
            price: ethers.formatEther(productData.decoded[0]), // Assuming price is in wei
            rewardRate: productData.decoded[2] + "%",
            deliveryTime: new Date(productData.decoded[3] * 1000).toLocaleString(),
            metadata: productData.decoded[4],
            disputeRaised: productData.decoded[5],
          };

          if (productInfo.disputeRaised) {
            const disputeContract = thor.account(VECYCLE_CONTRACT_ADDRESS[100010]).method(            {
              "inputs": [
                  {
                      "internalType": "uint256",
                      "name": "",
                      "type": "uint256"
                  }
              ],
              "name": "disputeInfo",
              "outputs": [
                  {
                      "internalType": "string",
                      "name": "reason",
                      "type": "string"
                  },
                  {
                      "internalType": "bool",
                      "name": "resolved",
                      "type": "bool"
                  },
                  {
                      "internalType": "bool",
                      "name": "approved",
                      "type": "bool"
                  },
                  {
                      "internalType": "uint256",
                      "name": "approvals",
                      "type": "uint256"
                  },
                  {
                      "internalType": "uint256",
                      "name": "rejections",
                      "type": "uint256"
                  }
              ],
              "stateMutability": "view",
              "type": "function"
          });

            const disputeData = await disputeContract.call(productId);
            console.log(disputeData)
            const disputeInfo: DisputeInfo = {
              reason: disputeData.decoded[0],
              resolved: disputeData.decoded[1],
              approved: disputeData.decoded[2],
              approvals: disputeData.decoded[3],
              rejections: disputeData.decoded[4],
              acceptors: disputeData.decoded[5],
              rejectors: disputeData.decoded[6],
            };

            // Append dispute info to product list
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
      <Flex>
        <SideBar />
        <Box as="main" flex={1} p={6} ml="250px" overflowX="auto">
          <Text fontSize="4xl" mb={6} color="purple.700">
            Listed Items
          </Text>
          <TableContainer>
            <Table variant="striped" colorScheme="purple">
              <TableCaption>Items Listed</TableCaption>
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Price</Th>
                  <Th>Reward Rate</Th>
                  <Th>Delivery Time</Th>
                  <Th>Metadata</Th>
                  <Th>Dispute Raised</Th>
                </Tr>
              </Thead>
              <Tbody>
                {items.map((item) => (
                  <Tr key={item.id}>
                    <Td>{"#" + item.id}</Td>
                    <Td>{item.price} Tokens</Td>
                    <Td>{item.rewardRate}</Td>
                    <Td>{item.deliveryTime}</Td>
                    <Td>{item.metadata}</Td>
                    <Td>{item.disputeRaised ? "Yes" : "No"}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
          {items.map(
            (item) =>
              item.disputeRaised && (
                <Box key={item.id} mt={6} p={4} bg="gray.200" borderRadius="md">
                  <Text fontSize="2xl">Dispute Info for Product #{item.id}</Text>
                  <Text>Reason: {item["disputeInfo"].reason}</Text>
                  <Text>Resolved: {item["disputeInfo"].resolved ? "Yes" : "No"}</Text>
                  <Text>Approved: {item["disputeInfo"].approved ? "Yes" : "No"}</Text>
                  <Text>Approvals: {item["disputeInfo"].approvals}</Text>
                  <Text>Rejections: {item["disputeInfo"].rejections}</Text>
                </Box>
              )
          )}
        </Box>
      </Flex>
      <Footer />
    </Flex>
  );
}
