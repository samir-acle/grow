import assertRevert from "../node_modules/openzeppelin-solidity/test/helpers/assertRevert";

const Staking = artifacts.require('Staking');
const GrowToken = artifacts.require('GrowToken');

contract('Staking', accounts => {
    let instance, growTokenInstance;
    const [deployerAccount, userAccount, controllerAccount] = accounts;

    beforeEach(async () => {
        growTokenInstance = await GrowToken.new();
        await growTokenInstance.setMinter(deployerAccount);
        await growTokenInstance.mint(web3.fromAscii('testing'), userAccount);
        await growTokenInstance.mint(web3.fromAscii('testing'), userAccount);
        await growTokenInstance.mint(web3.fromAscii('testing'), userAccount);
        await growTokenInstance.mint(web3.fromAscii('testing'), userAccount);
        
        instance = await Staking.new(growTokenInstance.address);

        await growTokenInstance.setBurner(instance.address);
        await instance.setController(controllerAccount);
        await growTokenInstance.approve(instance.address, 0, { from: userAccount });
        await growTokenInstance.approve(instance.address, 1, { from: userAccount });
        await growTokenInstance.approve(instance.address, 2, { from: userAccount });
        await growTokenInstance.approve(instance.address, 3, { from: userAccount });
    })

    describe('deposits and withdrawals', () => {
        it('should allow deposits of a token', async () => {
            const initialStakeCount = await instance.getAvailableTokenCount.call();
            expect(initialStakeCount.toNumber()).to.equal(0);

            await instance.deposit(1, { from: userAccount });

            const availableStakeCount = await instance.getAvailableTokenCount.call();
            expect(availableStakeCount.toNumber()).to.equal(1);
        });

        it('should allow withdrawals of a token', async () => {
            const tokenToWithdraw = 1;

            await instance.deposit(0, { from: userAccount });
            await instance.deposit(1, { from: userAccount });
            await instance.deposit(2, { from: userAccount });

            const initialStakeCount = await instance.getAvailableTokenCount.call();
            expect(initialStakeCount.toNumber()).to.equal(3);

            await instance.withdraw(tokenToWithdraw, { from: userAccount });

            const availableStakeCount = await instance.getAvailableTokenCount.call();
            expect(availableStakeCount.toNumber()).to.equal(2);
        });

        it('should not allow withdrawal if not token owner', async () => {
            await instance.deposit(0, { from: userAccount });
            await assertRevert(instance.withdraw(0, { from: deployerAccount }));
        });
    })


    describe('stake', () => {
        let availableTokens;
        let tokenId = 2; 
        let stakeId = web3.fromAscii('stakeid');

        it('should allow tokens to be staked by controller',async () => {
            await instance.deposit(0, { from: userAccount });
            await instance.deposit(tokenId, { from: userAccount });
            await instance.deposit(1, { from: userAccount });
            availableTokens = await instance.getAvailableTokenCount.call();
            expect(availableTokens.toNumber()).to.equal(3);
            const numberOfStakedTokensBefore = await instance.getStakedTokenCount.call();
            expect(numberOfStakedTokensBefore.toNumber()).to.equal(0);
            
            await instance.stake(stakeId, tokenId, userAccount, { from: controllerAccount });
            
            availableTokens = await instance.getAvailableTokenCount.call();
            expect(await availableTokens.toNumber()).to.equal(2);
            const stakedTokenId = await instance.stakeIdToTokenId.call(stakeId);
            expect(stakedTokenId.toNumber()).to.equal(tokenId);
            const numberOfStakedTokens = await instance.getStakedTokenCount.call();
            expect(numberOfStakedTokens.toNumber()).to.equal(1);
        });
    
        it('should not allow staking of a token by a different owner', async () => {
            await instance.deposit(tokenId, { from: userAccount });
            await assertRevert(instance.stake(stakeId, tokenId, deployerAccount, { from: controllerAccount }));
        });

        it('should not allow non-controller to stake', async () => {
            await instance.deposit(tokenId, { from: userAccount });
            await assertRevert(instance.stake(stakeId, tokenId, userAccount, { from: userAccount }));
        });
    
        it('should not allow a non-available token to be staked', async () => {
            await assertRevert(instance.stake(stakeId, 4, userAccount, { from: controllerAccount }));
        });
    
        it.skip('not allow withdrawal if token is staked', async () => {
            await instance.deposit(tokenId, { from: userAccount });
            await instance.stake(stakeId, tokenId, userAccount, { from: controllerAccount });
            await assertRevert(instance.withdraw(tokenId, { from: userAccount }));
        });

        it('should not allow staking for a stakeId that has already been used', async () => {
            await instance.deposit(0, { from: userAccount });
            await instance.deposit(tokenId, { from: userAccount });
            await instance.deposit(1, { from: userAccount });
            availableTokens = await instance.getAvailableTokenCount.call();
            const numberOfStakedTokensBefore = await instance.getStakedTokenCount.call();
            await instance.stake(stakeId, tokenId, userAccount, { from: controllerAccount });

            await assertRevert(instance.stake(stakeId, 1, userAccount, { from: controllerAccount }));
        });
    });

    describe('release stake', () => {
        let stakeId, tokenId, availableTokens, stakedTokens;

        beforeEach(() => {
            stakeId = web3.fromAscii('stakid');
            tokenId = 3;
        })

        it('should allow stake to be released', async () => {
            await instance.deposit(tokenId, { from: userAccount });
            availableTokens = await instance.getAvailableTokenCount.call();
            expect(availableTokens.toNumber()).to.equal(1);
            stakedTokens = await instance.getStakedTokenCount.call();
            expect(stakedTokens.toNumber()).to.equal(0);

            await instance.stake(stakeId, tokenId, userAccount, { from: controllerAccount });

            availableTokens = await instance.getAvailableTokenCount.call();
            expect(availableTokens.toNumber()).to.equal(0);
            stakedTokens = await instance.getStakedTokenCount.call();
            expect(stakedTokens.toNumber()).to.equal(1);

            await instance.releaseStake(stakeId, userAccount, { from: controllerAccount });

            const availableTokensAfterRelease = await instance.getAvailableTokenCount.call();
            expect(availableTokensAfterRelease.toNumber()).to.equal(1);
            stakedTokens = await instance.getStakedTokenCount.call();
            expect(stakedTokens.toNumber()).to.equal(0);
            const stakedTokenId = await instance.stakeIdToTokenId.call(stakeId);
            expect(stakedTokenId.toNumber()).not.to.equal(tokenId);
        })

        it('should not allow non-stake controller', async () => {
            await instance.deposit(tokenId, { from: userAccount });
            await instance.stake(stakeId, tokenId, userAccount, { from: controllerAccount });
            await assertRevert(instance.releaseStake(stakeId, userAccount, { from: userAccount }));
        });

        it('should not allow non-staked tokens to be released', async () => {
            await instance.deposit(tokenId, { from: userAccount });
            await assertRevert(instance.releaseStake(stakeId, userAccount, { from: controllerAccount }));
        });

        it('should not allow tokens to be released to a different owner', async () => {
            await instance.deposit(tokenId, { from: userAccount });
            await assertRevert(instance.releaseStake(stakeId, deployerAccount, { from: controllerAccount }));
        });
    });

    describe('burn stake', () => {
        let stakeId, tokenId, availableTokens;

        beforeEach(() => {
            stakeId = web3.fromAscii('stakid');
            tokenId = 2;
        })

        it('should allow stake to burn', async () => {
            await instance.deposit(tokenId, { from: userAccount });
            availableTokens = await instance.getAvailableTokenCount.call();
            expect(availableTokens.toNumber()).to.equal(1);
            await instance.stake(stakeId, tokenId, userAccount, { from: controllerAccount });

            await instance.burnStake(stakeId, userAccount, { from: controllerAccount });

            const availableTokensAfterRelease = await instance.getAvailableTokenCount.call();
            expect(availableTokensAfterRelease.toNumber()).to.equal(0);

            const stakedTokenId = await instance.stakeIdToTokenId.call(stakeId);
            expect(stakedTokenId.toNumber()).not.to.equal(tokenId);
        })

        it('should not allow non-stake controller', async () => {
            await instance.deposit(tokenId, { from: userAccount });
            await instance.stake(stakeId, tokenId, userAccount, { from: controllerAccount });
            await assertRevert(instance.burnStake(stakeId, userAccount, { from: userAccount }));
        });

        it('should not allow non-staked tokens to be burned', async () => {
            await instance.deposit(tokenId, { from: userAccount });
            await assertRevert(instance.burnStake(stakeId, userAccount, { from: controllerAccount }));
        });

        it('should not allow tokens from the wrong owner to be burned', async () => {
            await instance.deposit(tokenId, { from: userAccount });
            await instance.stake(stakeId, tokenId, userAccount, { from: controllerAccount });
            await assertRevert(instance.burnStake(stakeId, deployerAccount, { from: controllerAccount }));
        });
    });

    describe('get staker', () => {
        let stakeId, tokenId, availableTokens;

        beforeEach(() => {
            stakeId = web3.fromAscii('stakid');
            tokenId = 2;
        })

        it('should return address of the staker of the token', async () => {
            await instance.deposit(tokenId, { from: userAccount });
            availableTokens = await instance.getAvailableTokenCount.call();
            expect(availableTokens.toNumber()).to.equal(1);
            await instance.stake(stakeId, tokenId, userAccount, { from: controllerAccount });

            const staker = await instance.getStaker.call(stakeId);
            expect(staker).to.equal(userAccount);
        })

        it('should fail if no token matches stakeId', async () => {
            await instance.deposit(tokenId, { from: userAccount });
            await assertRevert(instance.getStaker.call(web3.fromAscii('notastakid')));
        })
    });
});
