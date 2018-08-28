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

    /** @dev Get balance of the sender
      * @return uint balance in wei
      */
    function getBalance() external view returns (uint balance) {
        return balances[msg.sender];
    }

    /** @dev Withdraw msg senders balance
      */
    function withdraw() external {
        require(address(this).balance > balances[msg.sender], "The contract must have a higher balance than what is being withdrawn");
        uint amount = balances[msg.sender];
        decreaseBalance(amount, msg.sender);
        msg.sender.transfer(amount);
    }

    /** @dev Increase the balance of a user account
      * @param _amount The amount to increase the user's balance by
      * @param _user The address to increase balance of
      */
    function increaseBalance(uint _amount, address _user) internal {
        balances[_user] = balances[_user].add(_amount);
    }

    /** @dev Decrease the balance of a user account
      * @param _amount The amount to decrease the user's balance by
      * @param _user The address to decrease balance of
      */
    function decreaseBalance(uint _amount, address _user) internal {
        balances[_user] = balances[_user].sub(_amount);
    }
}
