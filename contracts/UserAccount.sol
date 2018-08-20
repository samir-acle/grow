pragma solidity ^0.4.23;
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract UserAccount {
    // ============
    // EVENTS:
    // ============
    event UserBalanceIncrease(address indexed ownerAddress, uint newProofFee);

    // ============
    // DATA STRUCTURES:
    // ============
    using SafeMath for uint;

    // ============
    // STATE VARIABLES:
    // ============
    mapping(address => uint) private balances;

    // ============
    // MODIFIERS:
    // ============


    function getBalance() public returns (uint balance) {
        return balances[msg.sender];
    }

    function withdraw() public {
        uint amount = balances[msg.sender];
        decreaseBalance(amount, msg.sender);
        msg.sender.transfer(amount);
    }

    function increaseBalance(uint _amount, address _user) internal {
        balances[_user] = balances[_user].add(_amount);
    }

    function decreaseBalance(uint _amount, address _user) internal {
        balances[_user] = balances[_user].sub(_amount);
    }
}
