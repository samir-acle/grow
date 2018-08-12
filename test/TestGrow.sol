pragma solidity ^0.4.24;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Grow.sol";

contract TestGrow {

    uint public initialBalance = 10 ether;

    // use this to test private and internal functions? I guess not...
    function testSettingAndOwnershipDuringCreation() public {
        Grow grow = Grow(DeployedAddresses.Grow());
        Assert.equal(grow.owner(), msg.sender, "An owner is different than a deployer");
    }

    // function testInitPledgeShouldNotIncreasePot() public {
    //     Grow grow = Grow(DeployedAddresses.Grow());
    //     grow.initPledge.value(1 ether)([now + 1000], keccak256("test"));
    //     Assert.equal(grow.pot(), 0, "Pot has increased when it should not have");
    // }
}
