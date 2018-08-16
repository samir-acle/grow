import assertRevert from "../node_modules/openzeppelin-solidity/test/helpers/assertRevert";
import { cloneableGenerator } from "../node_modules/redux-saga/utils";

const Staking = artifacts.require('Staking');
const GrowToken = artifacts.require('GrowToken');

contract('Staking', accounts => {
    let instance, growTokenInstance;
    const [firstAccount, secondAccount, controllerAccount] = accounts;

    beforeEach(async () => {
        growTokenInstance = await GrowToken.new();
        await growTokenInstance.setMinter(firstAccount);
        await growTokenInstance.mint(web3.fromAscii('testing'), secondAccount);
        await growTokenInstance.mint(web3.fromAscii('testing'), secondAccount);
        await growTokenInstance.mint(web3.fromAscii('testing'), secondAccount);
        await growTokenInstance.mint(web3.fromAscii('testing'), secondAccount);
        
        instance = await Staking.new(growTokenInstance.address);

        await growTokenInstance.setBurner(instance.address);
        await instance.setController(controllerAccount);
        await growTokenInstance.approve(instance.address, 0, { from: secondAccount });
        await growTokenInstance.approve(instance.address, 1, { from: secondAccount });
        await growTokenInstance.approve(instance.address, 2, { from: secondAccount });
        await growTokenInstance.approve(instance.address, 3, { from: secondAccount });
    })

    describe('deposits and withdrawals', () => {
        it('should allow deposits of a token', async () => {
            const initialStakeCount = await instance.getAvailableStakeCount.call();
            expect(initialStakeCount.toNumber()).to.equal(0);

            await instance.deposit(1, { from: secondAccount });

            const availableStakeCount = await instance.getAvailableStakeCount.call();
            expect(availableStakeCount.toNumber()).to.equal(1);
        });

        it('should allow withdrawals of a token', async () => {
            const tokenToWithdraw = 1;

            await instance.deposit(0, { from: secondAccount });
            await instance.deposit(1, { from: secondAccount });
            await instance.deposit(2, { from: secondAccount });

            const initialStakeCount = await instance.getAvailableStakeCount.call();
            expect(initialStakeCount.toNumber()).to.equal(3);

            await instance.withdraw(tokenToWithdraw, { from: secondAccount });

            const availableStakeCount = await instance.getAvailableStakeCount.call();
            expect(availableStakeCount.toNumber()).to.equal(2);
            // these are private methods below.. how to test?
            // expect(tokenIdToOwner[tokenToWithdraw]).to.equal(address(0));
            // expect(availableTokens[tokenIdToAvailableIndex[tokenToWithdraw]]).not.to.equal(tokenToWithdraw);
        });

        it('should not allow withdrawal if not token owner', async () => {
            await instance.deposit(0, { from: secondAccount });
            await assertRevert(instance.withdraw(0, { from: firstAccount }));
        });
    })


    describe('stake', () => {
        let availableTokens, stakeId = web3.fromAscii('stakeid');

        it('should allow tokens to be staked',async () => {
            const tokenId = 2;
            const availableIndex = 1;
    
            await instance.deposit(0, { from: secondAccount });
            await instance.deposit(tokenId, { from: secondAccount });
            await instance.deposit(1, { from: secondAccount });
            availableTokens = await instance.getAvailableStakeCount.call();
            expect(availableTokens.toNumber()).to.equal(3);
            
            await instance.stake(stakeId, availableIndex, { from: controllerAccount });
            
            availableTokens = await instance.getAvailableStakeCount.call();
            expect(await availableTokens.toNumber()).to.equal(2);
            const stakedTokenId = await instance.stakeIdToTokenId.call(stakeId);
            expect(stakedTokenId.toNumber()).to.equal(tokenId);
        });
    
        it('should not allow non-stake controller', async () => {
            await instance.deposit(0, { from: secondAccount });
            await assertRevert(instance.stake(stakeId, 0, { from: secondAccount }));
        });
    
        it('should not allow a non-available token to be staked', async () => {
            await assertRevert(instance.stake(stakeId, 4, { from: secondAccount }));
        });
    
        it('not allow withdrawal if token is staked', async () => {
            await instance.deposit(0, { from: secondAccount });
            await instance.stake(stakeId, 0, { from: controllerAccount });
            await assertRevert(instance.withdraw(0));

        });
    });

    describe('release stake', () => {
        let stakeId, tokenId, availableTokens;

        beforeEach(() => {
            stakeId = web3.fromAscii('stakid');
            tokenId = 3;
        })

        it('should allow stake to be released', async () => {
            await instance.deposit(tokenId, { from: secondAccount });
            availableTokens = await instance.getAvailableStakeCount.call();
            expect(availableTokens.toNumber()).to.equal(1);

            await instance.stake(stakeId, 0, { from: controllerAccount });
            availableTokens = await instance.getAvailableStakeCount.call();
            expect(availableTokens.toNumber()).to.equal(0);

            await instance.releaseStake(stakeId, secondAccount, { from: controllerAccount });

            const availableTokensAfterRelease = await instance.getAvailableStakeCount.call();
            expect(availableTokensAfterRelease.toNumber()).to.equal(1);
            const stakedTokenId = await instance.stakeIdToTokenId.call(stakeId);
            expect(stakedTokenId.toNumber()).not.to.equal(tokenId);
        })

        it('should not allow non-stake controller', async () => {
            await instance.deposit(0, { from: secondAccount });
            await instance.stake(stakeId, 0, { from: controllerAccount });
            await assertRevert(instance.releaseStake(stakeId, secondAccount, { from: secondAccount }));
        });

        it('should not allow non-staked tokens to be released', async () => {
            await instance.deposit(0, { from: secondAccount });
            await assertRevert(instance.releaseStake(stakeId, secondAccount, { from: controllerAccount }));
        });

        it('should not allow tokens to be released to a different owner', async () => {
            await instance.deposit(0, { from: secondAccount });
            await assertRevert(instance.releaseStake(stakeId, firstAccount, { from: controllerAccount }));
        });
    });

    describe('burn stake', () => {
        let stakeId, tokenId, availableTokens;

        beforeEach(() => {
            stakeId = web3.fromAscii('stakid');
            tokenId = 2;
        })

        it('should allow stake to burn', async () => {
            await instance.deposit(tokenId, { from: secondAccount });
            availableTokens = await instance.getAvailableStakeCount.call();
            expect(availableTokens.toNumber()).to.equal(1);
            await instance.stake(stakeId, 0, { from: controllerAccount });

            await instance.burnStake(stakeId, secondAccount, { from: controllerAccount });

            const availableTokensAfterRelease = await instance.getAvailableStakeCount.call();
            expect(availableTokensAfterRelease.toNumber()).to.equal(0);

            const stakedTokenId = await instance.stakeIdToTokenId.call(stakeId);
            expect(stakedTokenId.toNumber()).not.to.equal(tokenId);
        })

        it('should not allow non-stake controller', async () => {
            await instance.deposit(0, { from: secondAccount });
            await instance.stake(stakeId, 0, { from: controllerAccount });
            await assertRevert(instance.burnStake(stakeId, secondAccount, { from: secondAccount }));
        });

        it('should not allow non-staked tokens to be burned', async () => {
            await instance.deposit(0, { from: secondAccount });
            await assertRevert(instance.burnStake(stakeId, secondAccount, { from: controllerAccount }));
        });

        it('should not allow tokens from the wrong owner to be burned', async () => {
            await instance.deposit(0, { from: secondAccount });
            await assertRevert(instance.burnStake(stakeId, firstAccount, { from: controllerAccount }));
        });
    });
});
