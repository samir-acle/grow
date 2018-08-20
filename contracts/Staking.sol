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

    // ============
    // STATE VARIABLES:
    // ============
    mapping(uint => address) private tokenIdToOwner;
    mapping(uint => uint) private tokenIdToAvailableIndex;
    uint[] private availableTokens;
    mapping( bytes32 => uint) public stakeIdToTokenId;
    GrowToken private growToken;
    address private controller;

    // ============
    // MODIFIERS:
    // ============
    modifier onlyController {
        require(controller != address(0));
        require(msg.sender == controller);
        _;
    }

    modifier onlyTokenOwner(uint _tokenId, address _addressToVerify) {
        require(_addressToVerify != address(0));
        require(_addressToVerify == tokenIdToOwner[_tokenId]);
        _;
    }

    modifier onlyAvailableTokens(uint _tokenId) {
        require(availableTokens[tokenIdToAvailableIndex[_tokenId]] == _tokenId);
        _;
    }

    modifier onlyOriginalStaker(bytes32 _stakeId, address _staker) {
        require(tokenIdToOwner[stakeIdToTokenId[_stakeId]] == _staker);
        _;
    }

    modifier onlyIfStaked(bytes32 _stakeId) {
        if (availableTokens.length > 0) {
            uint tokenId = stakeIdToTokenId[_stakeId];
            require(tokenIdToOwner[tokenId] != address(0));
            require(availableTokens[tokenIdToAvailableIndex[tokenId]] != tokenId);
        }
        _;
    }

// TODO - test this new stake stuff
// comment that if tokenid is 0 it wont work but this will be mitigated
// by controlling and burning it

    modifier onlyUnusedStakeId(bytes32 _stakeId) {
        require(stakeIdToTokenId[_stakeId] == 0);
        _;
    }

    constructor(address _growTokenAddress) public {
        growToken = GrowToken(_growTokenAddress);
    }

    /** @dev Set the controller that can stake and burn.
    */
    function setController(address _controller) public onlyOwner {
        controller = _controller;
    }

    /** @dev Get total number of available tokens for staking.
    */
    function getAvailableStakeCount() public view returns(uint availableStakes) {
        return availableTokens.length;
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

    // TODO - REENTRANCY
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

    // could technically use this to stake for other things??
    /** @dev Stake token.
    * @param _stakeId An identifier for the stake for the controller
    * @param _tokenId The token to stake.
    */
    function stake(bytes32 _stakeId, uint _tokenId, address _staker) public 
        whenNotPaused 
        onlyController
        onlyTokenOwner(_tokenId, _staker)
        onlyUnusedStakeId(_stakeId)
    {
        deleteAvailableTokenAtIndex(tokenIdToAvailableIndex[_tokenId]);
        stakeIdToTokenId[_stakeId] = _tokenId;
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
        require(availableTokens.length > 0);
        uint lastIndex = availableTokens.length - 1;
        // this seems weird..
        if (_index != lastIndex) {
            uint tokenToMove = availableTokens[lastIndex];
            availableTokens[_index] = tokenToMove;
            tokenIdToAvailableIndex[tokenToMove] = _index;
        }

        delete availableTokens[lastIndex];
        availableTokens.length--;
    }

    /** @dev Add token to available for staking list
    * @param _tokenId The id of the token that is now available for staking
    */
    function addTokenToAvailable(uint _tokenId) private {
        uint index = availableTokens.push(_tokenId) - 1;
        tokenIdToAvailableIndex[_tokenId] = index;
    }
}


// TODO - check safe math everywhere
// Pausable

// TODO - make this reusable for any ERC721Token!!!!
