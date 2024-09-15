"use client";
import {
  FC,
  useState,
} from "react";

import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  VStack,
  Select,
} from "@chakra-ui/react";
import { useWallet, useConnex, useWalletModal } from '@vechain/dapp-kit-react';
import { ethers } from 'ethers';

import { VECYCLE_CONTRACT_ADDRESS } from "@/config";
import { useNotify } from "@/hooks";
import { uploadFile, uploadJson } from "@/utils/ipfsHelper";
import { createMetaData } from "@/utils/nftHelpers";

const SubmitContent: FC = () => {
  const { account } = useWallet();
  const { thor } = useConnex();
  const { open: openWalletModal } = useWalletModal();
  
  const [contentType, setContentType] = useState("article");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [twitterLink, setTwitterLink] = useState("");
  const [contentLink, setContentLink] =  useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { notifyError, notifySuccess } = useNotify();

  const uploadContentToIPFS = async () => {
    if (!contentLink) {
      notifyError({
        title: "Error",
        message: "Please upload content.",
      });
      return null;
    }
    const contentHash = await uploadFile(contentLink);
    const metadata = createMetaData(
      contentHash,
      title,
      contentType,
      twitterLink,
      {}
    );
    return await uploadJson(metadata);
  };

  const submitContent = async () => {
    if (!account) {
      notifyError({
        title: "Error",
        message: "Connect your wallet first.",
      });
      return;
    }

    setIsLoading(true);

    try {
      // const contentHash = await uploadContentToIPFS();
      // if (!contentHash) return;

      // Interact with the smart contract
      const contract = thor
        .account(VECYCLE_CONTRACT_ADDRESS[100010])
        .method({
          "inputs": [
              {
                  "internalType": "string",
                  "name": "_contentType",
                  "type": "string"
              },
              {
                  "internalType": "string",
                  "name": "_dataLink",
                  "type": "string"
              },
              {
                  "internalType": "string",
                  "name": "_title",
                  "type": "string"
              },
              {
                  "internalType": "string",
                  "name": "_description",
                  "type": "string"
              },
              {
                  "internalType": "string",
                  "name": "_twitterLink",
                  "type": "string"
              }
          ],
          "name": "submitContent",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
      });

      const txclause = contract.transact(
        contentType,
        contentLink,  // This represents the uploaded IPFS link (data link)
        title,
        description,
        twitterLink
      );

      // Sign and announce the transaction
      const result = await txclause.request();

      notifySuccess({
        title: "Content Submitted",
        message: `Content submitted successfully with txid: ${result.txid}`,
      });
    } catch (error) {
      console.error(error);
      notifyError({
        title: "Error",
        message: `Error submitting content: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Flex direction="column" align="center" justify="center" w="100%">
        <VStack w="100%" spacing={4}>
          <Text fontWeight="bold">Content Type</Text>
          <Select value={contentType} onChange={(e) => setContentType(e.target.value)}>
            <option value="article">Article</option>
            <option value="video">Video</option>
          </Select>

          <Text fontWeight="bold">Title</Text>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter Title"
          />

          <Text fontWeight="bold">Description</Text>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter Description"
          />

          <Text fontWeight="bold">Twitter Link</Text>
          <Input
            value={twitterLink}
            onChange={(e) => setTwitterLink(e.target.value)}
            placeholder="Enter Twitter Link"
          />

          <Text fontWeight="bold">Content Link</Text>
          <Input
            type="text"
            onChange={(e) => setContentLink(e.target.value)}
          />

          <Button
            colorScheme="teal"
            onClick={() => {
              if (account) {
                submitContent();
              } else {
                openWalletModal(); // Open wallet modal if not connected
              }
            }}
            isLoading={isLoading}
          >
            Submit Content
          </Button>
        </VStack>
      </Flex>
    </>
  );
};

export default SubmitContent;
