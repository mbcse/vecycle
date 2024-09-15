// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import "./interfaces//IX2EarnRewardsPool.sol"; // VeBetterDAO reward pool contract interface

contract VeCycle is Initializable, ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721PausableUpgradeable, AccessControlUpgradeable, ERC721BurnableUpgradeable, UUPSUpgradeable {

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    uint256 public _nextTokenId;
    uint256 public _nextDisputeId;
    uint256 public constant APPROVALS_NEEDED = 1;

    mapping(uint256 => string) private _tokenURIs;


    IX2EarnRewardsPool public rewardsPool;
    uint256 public APP_ID;

    address _paymentToken;

    enum ProductListingStatus { ACTIVE, SOLD, DELIVERED, COMPLETED, IN_DISPUTE }
    enum ProductApprovalStatus { PENDING, APPROVED, REJECTED }

    struct ProductInfo {
        uint256 price;
        uint256 quantity;
        ProductListingStatus listingStatus;
        ProductApprovalStatus approvalStatus;
        string metadata;
        uint256 rewardRate;
        uint256 deliveryTime;
        uint256 deliveredTime;
        bool disputeRaised;
        uint256 disputeId;
    }


    struct DisputeInfo {
        string reason;
        bool resolved;
        bool approved;
        uint256 approvals;
        uint256 rejections;
        mapping(address => bool) voted; // Keep track of maintainers who voted
        address[] acceptors;
        address[] rejectors;
    }

    mapping(uint256 => ProductInfo) public productInfo;
    mapping(uint256 => DisputeInfo) public disputeInfo;
    mapping(uint256 => uint256) public deliveryTimers;

    mapping(address => uint256[]) public userListedProducts;

    // Events
    event ProductListed(address indexed seller, uint256 indexed productId, uint256 price, string metadata);
    event ProductBought(address indexed buyer, uint256 indexed productId, uint256 amount);
    event ProductDelivered(address indexed seller, uint256 indexed productId);
    event DisputeRaised(address indexed buyer, uint256 indexed productId, string reason);
    event DisputeResolved(uint256 indexed productId, bool approved);
    event RewardDistributed(uint256 indexed productId, address indexed seller);
    event MetadataUpdate(uint256 _tokenId);

    function initialize(address _owner, address minter, address _rewardsPool, uint256 _appId, address _paymentTokenAddress) initializer public {
        __ERC721_init("VeCycle", "VCE");
        __ERC721Enumerable_init();
        __ERC721Pausable_init();
        __AccessControl_init();
        __ERC721Burnable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
        _grantRole(UPGRADER_ROLE, _owner);
        _grantRole(MINTER_ROLE, minter);

        rewardsPool = IX2EarnRewardsPool(_rewardsPool);
        APP_ID = _appId;
        _paymentToken = _paymentTokenAddress;
    }

    // Seller lists a product
    function listProduct(uint256 price, string memory metadata, uint256 rewardRate, string memory uri, uint256 expectedDeliveryTime ) external {
        require(price > 0, "Price must be greater than 0");

        uint256 productId = _nextTokenId++;
        ProductInfo storage product = productInfo[productId];
        product.price = price;
        product.quantity = 1;
        product.listingStatus = ProductListingStatus.ACTIVE;
        product.approvalStatus = ProductApprovalStatus.PENDING;
        product.metadata = metadata;
        product.rewardRate = rewardRate;
        product.deliveredTime = expectedDeliveryTime;

        _safeMint(msg.sender, productId);
        _setTokenURI(productId, uri);

        userListedProducts[msg.sender].push(productId);

        emit ProductListed(msg.sender, productId, price, metadata);
    }

    function getUserListedProducts(address _user) external view returns (uint256[] memory) {
        return userListedProducts[_user];
    }

    // Buyer purchases the product
    function buyProduct(uint256 productId, address buyer, uint256 amount) external {
        ProductInfo storage product = productInfo[productId];
        require(product.listingStatus == ProductListingStatus.ACTIVE, "Product is not available for purchase");
        require(amount >= product.price, "Insufficient payment");

        IERC20 paymentToken = IERC20(_paymentToken); // Replace with USDC contract address
        paymentToken.transferFrom(buyer, address(this), amount);

        product.listingStatus = ProductListingStatus.SOLD;
        // deliveryTimers[productId].setDeadline(block.timestamp + 1 days); // Set 24-hour delivery deadline
        emit ProductBought(buyer, productId, amount);
    }

    // Seller marks the product as delivered
    function markProductAsDelivered(uint256 productId) external {
        ProductInfo storage product = productInfo[productId];
        require(ownerOf(productId) == msg.sender, "Only the seller can mark as delivered");
        require(product.listingStatus == ProductListingStatus.SOLD, "Product is not in sold status");

        product.listingStatus = ProductListingStatus.DELIVERED;
        product.deliveredTime = block.timestamp + 1 days; // Set 24-hour window for buyer confirmation or dispute

        emit ProductDelivered(msg.sender, productId);
    }

    // Buyer raises a dispute before 24-hour window expires
    function raiseDispute(uint256 productId, string memory reason) external {
        ProductInfo storage product = productInfo[productId];
        require(product.listingStatus == ProductListingStatus.DELIVERED, "Product is not in delivered state");
        require(block.timestamp < product.deliveredTime, "Dispute window has passed");

        product.listingStatus = ProductListingStatus.IN_DISPUTE;
        uint256 disputeId = _nextDisputeId++;
        DisputeInfo storage dispute = disputeInfo[disputeId];
        disputeInfo[disputeId].reason = reason;
        product.disputeRaised = true;
        product.disputeId = disputeId;

        emit DisputeRaised(msg.sender, productId, reason);
    }

    // Consensus-based approval process for maintainers
    function voteOnDispute(uint256 productId, bool approve) external onlyRole(ADMIN_ROLE) {
        ProductInfo storage product = productInfo[productId];
        require(product.listingStatus == ProductListingStatus.IN_DISPUTE, "No active dispute");
        require(!disputeInfo[product.disputeId].voted[msg.sender], "Already voted");

        disputeInfo[product.disputeId].voted[msg.sender] = true;

        if (approve) {
            disputeInfo[product.disputeId].approvals++;
            disputeInfo[product.disputeId].acceptors.push(msg.sender);
        } else {
            disputeInfo[product.disputeId].rejections++;
            disputeInfo[product.disputeId].rejectors.push(msg.sender);
        }
        

        // Check if consensus reached
        if (disputeInfo[product.disputeId].approvals >= APPROVALS_NEEDED) {
            _finalizeDispute(productId, true); // Approve the dispute
        } else if (disputeInfo[product.disputeId].rejections >= APPROVALS_NEEDED) {
            _finalizeDispute(productId, false); // Reject the dispute
        }
    }

    function _finalizeDispute(uint256 productId, bool approved) internal {
        ProductInfo storage product = productInfo[productId];
        product.listingStatus = ProductListingStatus.COMPLETED;

        // Transfer USDC funds depending on dispute resolution
        IERC20 paymentToken = IERC20(_paymentToken); // Replace with USDC contract address
        if (approved) {
            paymentToken.transfer(ownerOf(productId), product.price); // Refund the buyer
        } else {
            paymentToken.transfer(msg.sender, product.price); // Release funds to the seller
        }

        // Distribute rewards to the seller upon successful delivery
        if (!product.disputeRaised || approved) {
            // rewardsPool.distributeReward(APP_ID, product.rewardRate, ownerOf(productId), "");
            // rewardsPool.distributeReward(APP_ID, product.rewardRate, ownerOf(productId), "");

            emit RewardDistributed(productId, ownerOf(productId));
        }

        emit DisputeResolved(productId, approved);
    }

    struct ContentEntry {
        string contentType;  // article or video
        string title;
        string description;
        string twitterLink;
        string contentLink;
        address creator;
        bool approved;
    }

    uint256 public _nextContentEntryId;

    mapping(uint256 => ContentEntry) public contentEntries;
    mapping(address => uint256[]) public userContentEntries;

    event ContentSubmitted(uint256 indexed contentId, address indexed creator, string title);

    function submitContent(
        string memory _contentType,
        string memory _dataLink,
        string memory _title,
        string memory _description,
        string memory _twitterLink
    ) public {
        ContentEntry memory content = ContentEntry({
            contentType: _contentType,
            title: _title,
            description: _description,
            twitterLink: _twitterLink,
            contentLink: _dataLink,
            creator: msg.sender,
            approved: false
        });

        uint256 nextContentId = _nextContentEntryId++;

        contentEntries[nextContentId] = content;

        userContentEntries[msg.sender].push(nextContentId);
        emit ContentSubmitted(nextContentId, msg.sender, _title);
    }

    function approveContent(uint256 _contentId) public {
        require(_contentId <= _nextContentEntryId, "Invalid content ID");
        contentEntries[_contentId].approved = true;
    }

    function getContent(uint256 _contentId) public view returns (ContentEntry memory) {
        require(_contentId <= _nextContentEntryId, "Invalid content ID");
        return contentEntries[_contentId];
    }

    function getContentCount() public view returns (uint256) {
        return _nextContentEntryId;
    }

    function getUserContentEntries(address _user) public view returns (uint256[] memory){
        return userContentEntries[_user];
    }

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        _tokenURIs[tokenId] = _tokenURI;
        emit MetadataUpdate(tokenId);
    }

        function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via string.concat).
        if (bytes(_tokenURI).length > 0) {
            return string.concat(base, _tokenURI);
        }

        return super.tokenURI(tokenId);
    }

    // ERC721 required functions
    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, ERC721EnumerableUpgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721PausableUpgradeable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._increaseBalance(account, value);
    }


    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
