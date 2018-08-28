# Avoiding Common Attacks

### Reentrancy and other Race Conditions
> Re-entrancy and race conditions can occur when the method calls to another contract which takes control and can call back into the contract.  This can lead to unexpected and malicious results. To mitigate, I implemented a Checks-Effects-Interactions pattern making sure that interaction with other contracts occurs at the end of each method to prevent race conditions.

### DoS with Unexpected Revert
> A DoS with unexpected revert can occur when control is given to another contract which then unexpectedly causes a revert. Common case is when sending ETH to anotehr contract which has a payable fallback that reverts. This was mitigated by implementing a Pull Withdrawal pattern.

### Integer Overflow and Underflow
> Used the SafeMath library from OpenZeppelin to protect against over and underflows.  These flows occur when adding to a uint creates a number that is larger (or smaller) than the data type can hold.  For an overflow, this causes the number to go back to smallest number.  For an underflow, this causes the number to go back to the maximum number. 

### Timestamp Manipulation
> The block timestamp was used in this application to determine when a proof was expired. It does not need to be 100% accurate and the potential for a 30-second drift of a malicious node is not a concern for this dApp. Therefore, I decided to use the block.timestamp because an attack would not hurt the security or functionality of the dApp.
