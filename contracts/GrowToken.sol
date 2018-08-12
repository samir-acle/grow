pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./IpfsStorage.sol";

// TODO - check order of inheritance
contract GrowToken is IpfsStorage, ERC721Token("GrowToken", "GROW"), Ownable {

    // this should be same hash as in pledge? so maybe link to pledge instead?
    MultiHash[] growTokenDetails;

    function mint (bytes32 _hashDigest, uint8 _hashFunction, uint8 _size)
        public
        onlyOwner
    {
        MultiHash memory tokenDetails = MultiHash(_hashDigest, _hashFunction, _size);
        uint tokenId = growTokenDetails.push(tokenDetails) - 1;

        _mint(msg.sender, tokenId);
    }
}


