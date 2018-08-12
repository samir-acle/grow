// const GrowToken = artifacts.require('GrowToken');
// import assertRevert from "openzeppelin-solidity/test/helpers/assertRevert";

// // THIS TEST is unnecessary because already tested by OpenZepplin

// contract('Grow Token', accounts => {
//     it('should make first account an owner', async () => {
//         const instance = await GrowToken.deployed();
//         const owner = await instance.owner();
//         expect(owner).to.equal(accounts[0]);
//     });

//     it("should allow only owner to mint", async () => {
//         const instance = await GrowToken.deployed();
//         const newOwner = accounts[1];
//         await instance.transferOwnership(newOwner);
      
//         await assertRevert(instance.mint());
//       });
// });
