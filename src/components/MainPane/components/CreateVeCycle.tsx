import {
  FC,
  ChangeEvent,
  useState,
  useCallback,
} from "react";

import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useWallet, useConnex, useWalletModal } from '@vechain/dapp-kit-react';
import { ethers } from 'ethers';

import { VECYCLE_ABI, VECYCLE_CONTRACT_ADDRESS } from "@/config";
import { useNotify } from "@/hooks";
import { uploadFile, uploadJson } from "@/utils/ipfsHelper";
import { createMetaData } from "@/utils/nftHelpers";

// Import contract details

const CreateVeCycle: FC = () => {
  const { account, connect, disconnect } = useWallet();
  const { thor } = useConnex();
  const { open: openWalletModal } = useWalletModal();
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [rewardRate, setRewardRate] = useState("");
  const [expectedDeliveryTime, setExpectedDeliveryTime] = useState("");
  const [metadata, setMetadata] = useState("");
  const [image, setImage] = useState<FileList | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { notifyError, notifySuccess } = useNotify();

  const [imageHash, setImageHash] = useState("")

  const uploadImageToIPFS = async () => {
    if (!image) {
      notifyError({
        title: "Error",
        message: "Please upload an image.",
      });
      return null;
    }
    const imageHash = await uploadFile(image);
    setImageHash(imageHash);
    const metadata = createMetaData(
      imageHash,
      productName,
      "Product",
      expectedDeliveryTime,
      {}
    );
    return await uploadJson(metadata);
  };

  const listProduct = async () => {
    if (!account) {
      notifyError({
        title: "Error",
        message: "Connect your wallet first.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const metadataHash = await uploadImageToIPFS();
      if (!metadataHash) return;

      const productPrice = ethers.parseUnits(price, 18); // Assuming 18 decimals
      const deliveryTimeUnix = Math.floor(new Date(expectedDeliveryTime).getTime() / 1000);

      // Create the transaction body

      console.log(VECYCLE_ABI)
      const contract = thor
        .account(VECYCLE_CONTRACT_ADDRESS[100010])
        .method(// Add your contract ABI for `listProduct`
          {
            "constant": false,
            "inputs": [
              { "name": "price", "type": "uint256" },
              { "name": "metadata", "type": "string" },
              { "name": "rewardRate", "type": "uint256" },
              { "name": "uri", "type": "string" },
              { "name": "expectedDeliveryTime", "type": "uint256" }
            ],
            "name": "listProduct",
            "outputs": [],
            "type": "function"
          }
        )

        console.log(contract)
        const signingService = contract.transact('1', metadataHash, '1', imageHash, '1');


      // Sign and announce the transaction
      const result = await signingService.request();

      notifySuccess({
        title: "Product Listed",
        message: `Product listed successfully with txid: ${result.txid}`,
      });
    } catch (error) {
      console.log(error);
      notifyError({
        title: "Error",
        message: `Error listing product: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Flex direction="column" align="center" justify="center" w="100%">
        <VStack w="100%" spacing={4}>
          <Text fontWeight="bold">Product Name</Text>
          <Input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Enter Product Name"
          />

          <Text fontWeight="bold">Price</Text>
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter Price in Tokens"
          />

          <Text fontWeight="bold">Reward Rate</Text>
          <Input
            value={rewardRate}
            onChange={(e) => setRewardRate(e.target.value)}
            placeholder="Enter Reward Rate"
          />

          <Text fontWeight="bold">Expected Delivery Time</Text>
          <Input
            type="datetime-local"
            value={expectedDeliveryTime}
            onChange={(e) => setExpectedDeliveryTime(e.target.value)}
          />

          <Text fontWeight="bold">Product Metadata (Optional)</Text>
          <Input
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            placeholder="Enter product metadata or description"
          />

          <Text fontWeight="bold">Upload Product Image</Text>
          <Input
            type="file"
            onChange={(e) => setImage(e.target.files)}
          />

          <Button
            colorScheme="teal"
            onClick={() => {
              if (account) {
                listProduct();
              } else {
                openWalletModal(); // Open wallet modal if not connected
              }
            }}
            isLoading={isLoading}
          >
            List Product
          </Button>
        </VStack>
      </Flex>
    </>
  );
};

export default CreateVeCycle;
