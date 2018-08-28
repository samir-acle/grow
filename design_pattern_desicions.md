# Design Patterns Used

### Checks-Effects-Interactions
> All methods follow a similar approach - check that inputs are valid, update state variables, and lastly, interact with other contracts. I chose this pattern to help mitigate security risks with race conditions such as Reentrancy Attacks and DoS with Gas Limit. It also provides a clear and easy to read implementation that will make it more maintainable and extensible while the contracts are still in the local development stage.

### Pull Withdrawal
> User balances of ether are stored in the contract until a user has initiated a withdrawal, rather than sending ether directly to other accounts. This helps prevent reentrancy attacks among others.

### Emergency Stop
> Each deployed contract has an emergency stop that can be triggered by the contract owner. I implemented this pattern as a fail-safe in case major bugs or unexpected behavior is introduced into the contracts. This could allow for safely upgrading the contract (once upgradability has been implemented).

### Solidity CRUD
> I implemented the CRUD design pattern that includes storing of ids in a dynamic array that maps to structs that in turn store the index in that array. This allows for 'deleting' the struct.


