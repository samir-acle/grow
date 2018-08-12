pragma solidity ^0.4.23;
import "./Pledge.sol";

contract UserAccount {

    // make this just user account to eth
    // can have deposit and withdraw functions
    // ERC721 will be in its contract
    // stake will be in its contract

    // struct with key to data
    // array with key

    struct User {
        uint index;
        uint stake;
        uint lockedDeposits;
        uint availableDeposits;
    }

    mapping(address => User) internal addressToUserAccount;
    address[] private users;

    event LogNewUser   (address indexed userAddress, uint index);

    modifier existingUserOrCreate() {
        if(isUser(msg.sender) == false) {
            insertUser(msg.sender);
        }
        _;
    }

    function isUser(address _userAddress)
        public 
        view
        returns(bool isIndeed) 
    {
        if(users.length == 0) return false;
        return (users[addressToUserAccount[_userAddress].index] == _userAddress);
    }

    function insertUser(
        address userAddress
    ) 
        internal // private or internal?
        returns(uint index)
    {
        require(!isUser(userAddress));
        addressToUserAccount[userAddress].index = users.push(userAddress) - 1;
        LogNewUser(
            userAddress, 
            addressToUserAccount[userAddress].index);
        return users.length-1;
    }

    function getUser(address userAddress)
        public 
        view
        returns(uint index)
    {
        require(isUser(userAddress));
        return addressToUserAccount[userAddress].index;
    }

    function getUserCount() 
        public
        view
        returns(uint count)
    {
        return users.length;
    }

    function getUserAtIndex(uint index)
        public
        view
        returns(address userAddress)
    {
        return users[index];
    }    
}
