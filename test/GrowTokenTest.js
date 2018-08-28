const GrowToken = artifacts.require('GrowToken');
import assertRevert from "openzeppelin-solidity/test/helpers/assertRevert";


/**
  * These tests are written to ensure the GrowToken is functioning. They cover when inputs are valid, making sure the state is updated correctly and
  * return values are correct (happy path testing). There are also tests that ensure the code reverts
  * when inputs are invalid. This protects against malicious users.
  */
contract('Grow Token', accounts => {
    let instance;
    const [owner, minter, burner, other] = accounts;
    const TEST_HASH = 0x031a407d08e694c85e1ef4c7cbcfb1a529e05ee4f79a84fcc46f8ff36ca214e2;

    beforeEach(async () => {
        instance = await GrowToken.new();
        await instance.setMinter(minter);
        await instance.setBurner(burner);
    });

    it('only the address set as minter should be able to mint tokens', async () => {
        await assertRevert(instance.mint(TEST_HASH, burner, { from: burner }));
    });

    it('only the address set as burner should be able to burn tokens', async () => {
        await instance.mint(TEST_HASH, other, { from: minter });
        await assertRevert(instance.burn(0, other, { from: minter }));
    });

    it('balance should increase when token is minted', async () => {
        const balanceBefore = await instance.getOwnedTokenCount.call({ from: other });
        expect(balanceBefore.toNumber()).to.equal(0);

        await instance.mint(TEST_HASH, other, { from: minter });

        const balanceAfter = await instance.getOwnedTokenCount.call({ from: other });
        expect(balanceAfter.toNumber()).to.equal(1);
    });

    it('balance should decrease when token is burned', async () => {
        await instance.mint(TEST_HASH, other, { from: minter });
        const balanceBefore = await instance.getOwnedTokenCount.call({ from: other });
        expect(balanceBefore.toNumber()).to.equal(1);

        await instance.burn(0, other, { from: burner });

        const balanceAfter = await instance.getOwnedTokenCount.call({ from: other });
        expect(balanceAfter.toNumber()).to.equal(0);
    })

    it('only owner can set minter', async () => {
        await instance.setMinter(burner, { from: owner });
        await assertRevert(instance.setMinter(minter, { from: minter }));
    })

    it('only owner can set burner', async () => {
        await instance.setBurner(minter, { from: owner });
        await assertRevert(instance.setBurner(burner, { from: burner }));
    })    
});
