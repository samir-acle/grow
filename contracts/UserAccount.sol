pragma solidity ^0.4.23;
import "./Pledge.sol";

contract UserAccount is Pledge {

    // struct with key to data
    // array with key

    struct User {
        uint index;
        uint stake;
        uint lockedDeposits;
        uint availableDeposits;
    }

    mapping(address => User) private addressToUser;
    address[] private users;

    event LogNewUser   (address indexed userAddress, uint index);

    modifier existingUserOrCreate() {
        if(isUser(msg.sender) == false) {
            insertUser(msg.sender);
        }
        _;
    }

    function isUser(address userAddress)
        public 
        view
        returns(bool isIndeed) 
    {
        if(users.length == 0) return false;
        return (users[addressToUser[userAddress].index] == userAddress);
    }

    function insertUser(
        address userAddress
    ) 
        internal // private or internal?
        returns(uint index)
    {
        require(!isUser(userAddress));
        addressToUser[userAddress].index = users.push(userAddress) - 1;
        LogNewUser(
            userAddress, 
            addressToUser[userAddress].index);
        return users.length-1;
    }

    function getUser(address userAddress)
        public 
        view
        returns(uint index)
    {
        require(isUser(userAddress));
        return addressToUser[userAddress].index;
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
