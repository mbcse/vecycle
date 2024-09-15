import { useRef } from "react";

import {
  Box,
  Image,
  Text,
  VStack,
  Button,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";

const NftCard = ({ 
  title, 
  imageUrl, 
  description, 
  price, 
  rewardRate, 
  deliveryTime,
  productId, 
  onBuy
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  const handleBuy = () => {
    onBuy(productId);
    onClose();
  };

  return (
    <>
      <Box
        bg="white"
        maxW="sm"
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        boxShadow="xl"
        transition="transform 0.3s"
        _hover={{
          transform: "scale(1.05)",
          boxShadow: "2xl",
        }}
        mb={8}
      >
        <Image
          src={imageUrl.replace('ipfs://', 'https://gateway.lighthouse.storage/ipfs/')}
          alt={title}
          borderRadius="lg"
          objectFit="cover"
          w="100%"
          height="200px"
        />
        <VStack p="6" spacing="4" align="start">
          <Text fontWeight="bold" fontSize="2xl" color="purple.600">
            {title}
          </Text>
          <Text>{description}</Text>
          <Text fontWeight="bold" color="purple.500">
            Price: {price}
          </Text>
          <Text fontWeight="bold" color="purple.500">
            Reward Rate: {rewardRate}
          </Text>
          <Text fontWeight="bold" color="purple.500">
            Delivery Time: {deliveryTime}
          </Text>
          <Button colorScheme="teal" onClick={onOpen}>
            Buy
          </Button>
        </VStack>
      </Box>

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirm Purchase
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to purchase this product?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="teal" onClick={handleBuy} ml={3}>
                Confirm Purchase
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default NftCard;
