pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
// definitley pausable

// TODO - check order of inheritance
//  TODO - not usding uri? maybe better way to do this...
// TODO - write quick and easy tests
contract GrowToken is ERC721Token("GrowToken", "GROW"), Ownable {

        // ============
    // EVENTS:
    // ============
    event GrowTokenMinted(address indexed ownerAddress, bytes32 tokenDetails, uint tokenId);
    event GrowTokenBurned(address indexed ownerAddress, bytes32 tokenDetails, uint tokenId);

    // ============
    // STATE VARIABLES:
    // ============
    bytes32[] public tokenDetails;
    address private minter;
    address private burner;

    // ============
    // MODIFIERS:
    // ============
    /**
    * @dev Throws if called by any account other than the controller.
    */
    modifier onlyMinter() {
        require(msg.sender == minter, "Only the controller can call this function");
        _;
    }

     /**
    * @dev Throws if called by any account other than the controller.
    */
    modifier onlyBurner() {
        require(msg.sender == burner, "Only the controller can call this function");
        _;
    }

    /** @dev Sers the controller of the GrowToken contract.
      * @param _controller Address of the contract that can mint and burn tokens
      */
    function setMinter(address _controller) public onlyOwner {
        minter = _controller;
    }

    /** @dev Sers the controller of the GrowToken contract.
      * @param _controller Address of the contract that can mint and burn tokens
      */
    function setBurner(address _controller) public onlyOwner {
        burner = _controller;
    }

    /** @dev Mints a new token and stores details.
      * @param _tokenDetailsHash IPFS hash minus the function and size
      * @param _toAddress address to send new token to
      */
    function mint (bytes32 _tokenDetailsHash, address _toAddress)
        public
        onlyMinter
    {
        uint tokenId = tokenDetails.push(_tokenDetailsHash) - 1;
        _mint(_toAddress, tokenId);
        emit GrowTokenMinted(_toAddress, _tokenDetailsHash, tokenId);
    }

    /** @dev Burns a token.
      * @param _tokenId id of the token to be burned.
      */
    function burn(uint _tokenId)
        public
        onlyBurner
    {
        _burn(msg.sender, _tokenId);
        emit GrowTokenBurned(msg.sender, tokenDetails[_tokenId], _tokenId);
    }    
}


