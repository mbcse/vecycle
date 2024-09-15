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
import { useWallet, useConnex } from "@vechain/dapp-kit-react";

import { Footer, Header } from "@/components";
import LoadingScreen from "@/components/MainPane/components/LoadingScreen";
import { SideBar } from "@/components/Sidebar";
import { VECYCLE_CONTRACT_ADDRESS } from "@/config";

interface ContentEntry {
  id: number;
  contentType: string;
  title: string;
  description: string;
  twitterLink: string;
  contentLink: string;
  creator: string;
  approved: boolean;
}

export default function MyListedContent() {
  const { account } = useWallet();
  const { thor } = useConnex();
  const [contentEntries, setContentEntries] = useState<ContentEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      if (!account) return;

      setIsLoading(true);

      try {
        const contract = thor.account(VECYCLE_CONTRACT_ADDRESS[100010]).method({
          inputs: [{ internalType: "address", name: "_user", type: "address" }],
          name: "getUserContentEntries",
          outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
          stateMutability: "view",
          type: "function",
        });

        const contract2 = thor.account(VECYCLE_CONTRACT_ADDRESS[100010]).method({
          inputs: [{ internalType: "uint256", name: "_contentId", type: "uint256" }],
          name: "getContent",
          outputs: [
            {
              components: [
                { internalType: "string", name: "contentType", type: "string" },
                { internalType: "string", name: "title", type: "string" },
                { internalType: "string", name: "description", type: "string" },
                { internalType: "string", name: "twitterLink", type: "string" },
                { internalType: "string", name: "contentLink", type: "string" },
                { internalType: "address", name: "creator", type: "address" },
                { internalType: "bool", name: "approved", type: "bool" },
              ],
              internalType: "struct VeCycle.ContentEntry",
              name: "",
              type: "tuple",
            },
          ],
          stateMutability: "view",
          type: "function",
        });

        // Fetch content IDs associated with the current user
        const userContentIds = await contract.call(account);

        console.log(userContentIds);
        const contentList: ContentEntry[] = [];

        for (const contentId of userContentIds.decoded[0]) {
          const contentData = await contract2.call(contentId);
          console.log(contentData)
          contentList.push({
            id: contentId,
            contentType: contentData.decoded[0][0],
            title: contentData.decoded[0][1],
            description: contentData.decoded[0][2],
            twitterLink: contentData.decoded[0][3],
            contentLink: contentData.decoded[0][4],
            creator: contentData.decoded[0][5],
            approved: contentData.decoded[0][6],
          });
        }

        setContentEntries(contentList);
      } catch (error) {
        console.error("Error fetching content", error);
      }

      setIsLoading(false);
    };

    fetchContent();
  }, [account, thor]);

  return (
    <Flex flexDirection="column" minHeight="100vh" bg="gray.50">
      <LoadingScreen isLoading={isLoading} />
      <Header />
      <Flex>
        <SideBar />
        <Box as="main" flex={1} p={6} ml="250px" overflowX="auto">
          {/* Ensure table is responsive and scrolls horizontally if needed */}
          <Text fontSize="4xl" mb={6} color="purple.700">
            My Listed Content
          </Text>
          <TableContainer maxW="100%" overflowX="auto">
            <Table variant="striped" colorScheme="purple" size="md">
              <TableCaption placement="top">My Content Entries</TableCaption>
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Type</Th>
                  <Th>Title</Th>
                  <Th>Description</Th>
                  <Th>Twitter Link</Th>
                  <Th>Contents Link</Th>
                  <Th>Approved</Th>
                </Tr>
              </Thead>
              <Tbody>
                {contentEntries.map((content) => (
                  <Tr key={content.id}>
                    <Td>{"#" + content.id}</Td>
                    <Td>{content.contentType}</Td>
                    <Td maxWidth="200px" isTruncated>
                      {content.title}
                    </Td>
                    <Td maxWidth="300px" isTruncated>
                      {content.description}
                    </Td>
                    <Td>
                      <Link href={content.twitterLink} color="blue.500" isExternal>
                        View
                      </Link>
                    </Td>

                    <Td>
                      <Link href={content.contentLink} color="blue.500" isExternal>
                        View
                      </Link>
                    </Td>
                    <Td>{content.approved ? "Yes" : "No"}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </Flex>
      <Footer />
    </Flex>
  );
}
