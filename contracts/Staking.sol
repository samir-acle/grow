pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Holder.sol";
import "./GrowToken.sol";

contract Staking is Pausable, ERC721Holder {

    // ============
    // EVENTS:
    // ============
    event DepositToken(address indexed owner, uint tokenId);
    event WithdrawToken(address indexed owner, uint tokenId);
    event StakeToken(address indexed owner, uint tokenId, bytes32 stakeId);
    event ReleaseStakedToken(address indexed owner, uint tokenId, bytes32 stakeId);
    event BurnStakedToken(address indexed owner, uint tokenId, bytes32 stakeId);

    // ============
    // DATA STRUCTURES:
    // ============
    using SafeMath for uint;

    // ============
    // STATE VARIABLES:
    // ============
    mapping(uint => address) public tokenIdToOwner;
    mapping(uint => uint) private tokenIdToAvailableIndex;
    uint[] public availableTokens;
    mapping(uint => uint) private tokenIdToStakedIndex;
    uint[] public stakedTokens;
    mapping( bytes32 => uint) public stakeIdToTokenId;

    GrowToken private growToken;
    address private controller;

    // ============
    // MODIFIERS:
    // ============
    modifier onlyController {
        require(controller != address(0), "A controller must be set");
        require(msg.sender == controller, "The sender must be the controller");
        _;
    }

    modifier onlyTokenOwner(uint _tokenId, address _addressToVerify) {
        require(_addressToVerify != address(0), "The token must be owned");
        require(_addressToVerify == tokenIdToOwner[_tokenId], "The address must match the token owner");
        _;
    }

    modifier onlyAvailableTokens(uint _tokenId) {
        require(availableTokens[tokenIdToAvailableIndex[_tokenId]] == _tokenId, "The token must be available for staking");
        _;
    }

    modifier onlyOriginalStaker(bytes32 _stakeId, address _staker) {
        require(tokenIdToOwner[stakeIdToTokenId[_stakeId]] == _staker, "Only the token owner can be the staker");
        _;
    }

    modifier onlyIfStaked(bytes32 _stakeId) {
        if (availableTokens.length > 0) {
            uint tokenId = stakeIdToTokenId[_stakeId];
            require(tokenIdToOwner[tokenId] != address(0), "The token must be owned");
            require(availableTokens[tokenIdToAvailableIndex[tokenId]] != tokenId, "The token must not be available for staking");
        }
        _;
    }

    // if tokenid is actually token with id 0, this wont work.
    // This will be mitigated by burning token 0 during deployment.
    modifier onlyUnusedStakeId(bytes32 _stakeId) {
        require(stakeIdToTokenId[_stakeId] == 0, "Cannot stake a token for an id that is already staked");
        _;
    }

    constructor(address _growTokenAddress) public {
        growToken = GrowToken(_growTokenAddress);
    }

    /** @dev Check if token is deposited.
    * @param _tokenId The token that is being checked.
    * @return bool true if deposited, false if not
    */
    function isTokenDeposited(uint _tokenId) public view returns(bool isDeposited) {
        return tokenIdToOwner[_tokenId] != address(0);
    }

    /** @dev Check if token is staked.
    * @param _tokenId The token that is being checked.
    * @return bool true if staked, false if not
    */
    function isTokenStaked(uint _tokenId) public view returns(bool isStaked) {
        if (isTokenDeposited(_tokenId)) {
            return tokenIdToAvailableIndex[_tokenId] == 0;
        } else {
            return false;
        }
    }

    /** @dev Get the number of tokens available for staking.
    * @return uint number of available tokens
    */
    function getAvailableTokenCount() public view returns(uint count) {
        return availableTokens.length;
    }

    /** @dev Get the number of tokens being staking.
    * @return uint number of staked tokens
    */
    function getStakedTokenCount() public view returns(uint count) {
        return stakedTokens.length;
    }

    /** @dev Set the contract address that can stake and burn.
    */
    function setController(address _controller) public onlyOwner {
        controller = _controller;
    }

    /** @dev Add token to the available stake pool.
    * @param _tokenId The token that is being added.
    */
    function deposit(uint _tokenId) public whenNotPaused {
        growToken.safeTransferFrom(msg.sender, this, _tokenId);
        tokenIdToOwner[_tokenId] = msg.sender;
        addTokenToAvailable(_tokenId);
        emit DepositToken(msg.sender, _tokenId);
    }

    /** @dev Withdraw tokens from the stake pool.
    * @param _tokenId The token that is being withdrawn.
    */
    function withdraw(uint _tokenId) 
        public 
        whenNotPaused
        onlyTokenOwner(_tokenId, msg.sender)
        onlyAvailableTokens(_tokenId)
    {
        uint indexToDelete = tokenIdToAvailableIndex[_tokenId];
        address tokenOwner = tokenIdToOwner[_tokenId];

        deleteAvailableTokenAtIndex(indexToDelete);

        tokenIdToOwner[_tokenId] = address(0);
        growToken.safeTransferFrom(this, tokenOwner, _tokenId);
        emit WithdrawToken(tokenOwner, _tokenId);
    }

    /** @dev Stake token.
    * @param _stakeId An identifier for the stake for the controller
    * @param _tokenId The token to stake.
    * @param _staker The address of the token owner
    */
    function stake(bytes32 _stakeId, uint _tokenId, address _staker) public 
        whenNotPaused 
        onlyController
        onlyTokenOwner(_tokenId, _staker)
        onlyUnusedStakeId(_stakeId)
    {
        deleteAvailableTokenAtIndex(tokenIdToAvailableIndex[_tokenId]);
        delete tokenIdToAvailableIndex[_tokenId];
        stakeIdToTokenId[_stakeId] = _tokenId;
        addTokenToStaked(_tokenId);
        emit StakeToken(_staker, _tokenId, _stakeId);
    }

    /** @dev Release staked token.
    * @param _stakeId An identifier for the stake.
    * @param _staker The token owner.
    */
    function releaseStake(bytes32 _stakeId, address _staker) public 
        whenNotPaused 
        onlyController
        onlyIfStaked(_stakeId)
        onlyOriginalStaker(_stakeId, _staker)
    {
        uint tokenToRelease = stakeIdToTokenId[_stakeId];
        uint indexToDelete = tokenIdToStakedIndex[tokenToRelease];

        deleteStakedTokenAtIndex(indexToDelete);
        delete stakeIdToTokenId[_stakeId];
        addTokenToAvailable(tokenToRelease);
        emit ReleaseStakedToken(_staker, tokenToRelease, _stakeId);
    }

    /** @dev Burn staked token.
    * @param _stakeId An identifier for the stake.
    * @param _staker The token owner.
    */
    function burnStake(bytes32 _stakeId, address _staker) public 
        whenNotPaused 
        onlyController
        onlyIfStaked(_stakeId)
        onlyOriginalStaker(_stakeId, _staker)
    {
        uint tokenToBurn = stakeIdToTokenId[_stakeId];
        uint indexToDelete = tokenIdToStakedIndex[tokenToBurn];

        deleteStakedTokenAtIndex(indexToDelete);
        // see wht uses less gas, delete or hardcoded (and change everything to whichever is faster)
        delete tokenIdToOwner[tokenToBurn];
        delete stakeIdToTokenId[_stakeId];
        growToken.burn(tokenToBurn);
        emit BurnStakedToken(_staker, 1, _stakeId);
    }

    /** @dev Get address of staker.
    * @param _stakeId An identifier for the stake.
    * @return the address of the owner of the staked token.
    */
    function getStaker(bytes32 _stakeId) public 
        onlyIfStaked(_stakeId)
        returns(address staker)
    {
        return tokenIdToOwner[stakeIdToTokenId[_stakeId]];
    }

    /** @dev Remove token from available array.
    * @param _index index of the token to remove
    */
    function deleteAvailableTokenAtIndex(uint _index) private {
        require(availableTokens.length > 0, "There must be tokens available for staking but currently there are none");
        uint lastIndex = availableTokens.length.sub(1);
        // this seems weird..
        if (_index != lastIndex) {
            uint tokenToMove = availableTokens[lastIndex];
            availableTokens[_index] = tokenToMove;
            tokenIdToAvailableIndex[tokenToMove] = _index;
        }

        delete availableTokens[lastIndex];
        availableTokens.length = availableTokens.length.sub(1);
    }

    /** @dev Remove token from staked array.
    * @param _index index of the token to remove
    */
    function deleteStakedTokenAtIndex(uint _index) private {
        require(stakedTokens.length > 0, "There must be tokens staked but currently there are none");
        uint lastIndex = stakedTokens.length.sub(1);
        // this seems weird..
        if (_index != lastIndex) {
            uint tokenToMove = stakedTokens[lastIndex];
            stakedTokens[_index] = tokenToMove;
            tokenIdToStakedIndex[tokenToMove] = _index;
        }

        delete stakedTokens[lastIndex];
        stakedTokens.length = stakedTokens.length.sub(1);
    }    

    /** @dev Add token to available for staking list
    * @param _tokenId The id of the token that is now available for staking
    */
    function addTokenToAvailable(uint _tokenId) private {
        uint index = availableTokens.push(_tokenId).sub(1);
        tokenIdToAvailableIndex[_tokenId] = index;
    }

    /** @dev Add token to staked tokens list 
    * @param _tokenId The id of the token that is being staked
    */
    function addTokenToStaked(uint _tokenId) private {
        uint index = stakedTokens.push(_tokenId).sub(1);
        tokenIdToStakedIndex[_tokenId] = index;
    }    
}


// TODO - check safe math everywhere
// Pausable

// TODO - make this reusable for any ERC721Token!!!!
