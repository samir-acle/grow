const Grow = artifacts.require('Grow');
const GrowToken = artifacts.require('GrowToken');
const Staking = artifacts.require('Staking');
import assertRevert from "openzeppelin-solidity/test/helpers/assertRevert";
import increaseTime from 'openzeppelin-solidity/test/helpers/increaseTime';
import { getPledgeAndProofId, daysInPast, daysInFuture, setupWithStakedTokens, daysInSeconds, PROOF_FEE } from './helpers';

contract('Grow review', (accounts) => {
    let instance, growTokenInstance, stakingInstance;
    const [thirdParty, pledgeOwner, reviewer] = accounts;
    const tokenId = 1;

    beforeEach(async () => {
        const contractInstances = await setupWithStakedTokens(GrowToken, Staking, Grow, { tokenId, reviewer, pledgeOwner, thirdParty });
        instance = contractInstances.instance;
        growTokenInstance = contractInstances.growTokenInstance;
        stakingInstance = contractInstances.stakingInstance;
    })

    describe('assignReviewer', () => {
        it('pledge owner cannot be reviewer', async () => {
            // Arrange
            const { proofId, pledgeId } = await getPledgeAndProofId(instance, { pledgeOwner });
            await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner });
            // Act and Assert
            await assertRevert(instance.assignReviewer(pledgeId, proofId, tokenId, { from: pledgeOwner }));            
        });

        it('proof state must be submitted', async () => {
            // Arrange
            const { proofId, pledgeId } = await getPledgeAndProofId(instance, { pledgeOwner });
            // Act and Assert
            await assertRevert(instance.assignReviewer(pledgeId, proofId, tokenId, { from: reviewer })); 
        });

        it('proof cannot be expired', async () => {
            // Arrange
            const { proofId, pledgeId } = await getPledgeAndProofId(instance, { pledgeOwner });
            await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner });
            increaseTime(daysInSeconds);

            // Act and Assert
            await assertRevert(instance.assignReviewer(pledgeId, proofId, tokenId, { from: reviewer })); 
        });

        describe('with valid inputs', async () => {
            let status, actualReviewer, stakeId;
            
            beforeEach(async () => {
                // Arrange
                const { proofId, pledgeId } = await getPledgeAndProofId(instance, { pledgeOwner });
                stakeId = proofId;
                await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner });

                // Act
                await instance.assignReviewer(pledgeId, proofId, tokenId, { from: reviewer })
                const proof = await instance.getProof.call(proofId);
                status = proof[6];
                actualReviewer = proof[5];
            });

            it('assigned the reviewer to the proof', async () => {
                // Assert
                expect(actualReviewer).to.equal(reviewer);
                expect(status.toNumber()).to.equal(2);
            });

            it('it stakes the token', async () => {
                // Assert
                const staker = await stakingInstance.getStaker.call(stakeId);
                expect(staker).to.equal(reviewer);
                const stakedToken = await stakingInstance.stakeIdToTokenId.call(stakeId);
                expect(stakedToken.toNumber()).to.equal(tokenId);
            });
        });
    });

    describe('verify proof', () => {
        it('should revert if proof was not assigned', async () => {
            // Arrange
            const { pledgeId, proofId } = await getPledgeAndProofId(instance, { pledgeOwner });
            await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner });
            // Act and Assert
            await assertRevert(instance.verifyProof(proofId, true, { from: reviewer }));
        });

        it('should revert if not called by the reviewer', async () => {
            // Arrange
            const { pledgeId, proofId } = await getPledgeAndProofId(instance, { pledgeOwner })
            await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner });
            await instance.assignReviewer(pledgeId, proofId, tokenId, { from: reviewer });
            // Act 
            await assertRevert(instance.verifyProof(proofId, true, { from: thirdParty }));
        });

        it('should release the stake of the reviewer', async () => {
            // Arrange            
            const { pledgeId, proofId } = await getPledgeAndProofId(instance, { pledgeOwner, totalCollateral: 30 });
            await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner });
            await instance.assignReviewer(pledgeId, proofId, tokenId, { from: reviewer });
            const beforeReleaseStakeCount = await stakingInstance.getAvailableTokenCount.call();
            // Act
            await instance.verifyProof(proofId, true, { from: reviewer });
            // Assert
            const notAToken = await stakingInstance.stakeIdToTokenId.call(proofId);
            expect(notAToken.toNumber()).to.equal(0);
            const afterReleaseStakeCount = await stakingInstance.getAvailableTokenCount.call();
            expect(afterReleaseStakeCount.toNumber()).to.equal(beforeReleaseStakeCount.toNumber() + 1);
        });
        
        it('should approve the proof is approved is true', async () => {
            // Arrange
            const { pledgeId, proofId } = await getPledgeAndProofId(instance, { pledgeOwner })
            await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner });
            await instance.assignReviewer(pledgeId, proofId, tokenId, { from: reviewer });
            // Act
            await instance.verifyProof(proofId, true, { from: reviewer });
            // Assert
            const [, , , , collateral, proofReviewer, status] = await instance.getProof.call(proofId);
            expect(collateral.toNumber()).to.equal(0);
            expect(status.toNumber()).to.equal(3);
            expect(proofReviewer).to.equal(reviewer);
        });

        it('should update reviewer and pledge owners balances if approved', async () => {
            // Arrange
            const { pledgeId, proofId } = await getPledgeAndProofId(instance, { pledgeOwner, totalCollateral: 30 });
            await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner });
            await instance.assignReviewer(pledgeId, proofId, tokenId, { from: reviewer });
            // Act
            await instance.verifyProof(proofId, true, { from: reviewer });
            // Assert
            const balanceOfReviewer = await instance.getBalance.call({ from: reviewer });
            const balanceOfPledgeOwner = await instance.getBalance.call({ from: pledgeOwner });
            
            expect(balanceOfReviewer.toNumber()).to.equal(web3.toBigNumber(PROOF_FEE).toNumber());
            expect(balanceOfPledgeOwner.toNumber()).to.equal(web3.toBigNumber(web3.toWei(20, 'finney')).toNumber());
        });

        it('should mint new token if approved', async () => {
            // Arrange
            const { pledgeId, proofId } = await getPledgeAndProofId(instance, { pledgeOwner, totalCollateral: 30 });
            await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner });
            await instance.assignReviewer(pledgeId, proofId, tokenId, { from: reviewer });
            const initialTokenBalance = await growTokenInstance.balanceOf.call(pledgeOwner);
            console.log('reviewer', reviewer);
            console.log('intial token balance', initialTokenBalance.toNumber());
            // Act
            await instance.verifyProof(proofId, true, { from: reviewer });
            // Assert
            const tokenBalanceAfterApproval = await growTokenInstance.balanceOf.call(pledgeOwner);
            expect(tokenBalanceAfterApproval.toNumber()).to.equal(initialTokenBalance.toNumber() + 1);
        });

        it('should reject the proof if approved is false', async () => {
            // Arrange
            const { pledgeId, proofId } = await getPledgeAndProofId(instance, { pledgeOwner })
            await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner });
            await instance.assignReviewer(pledgeId, proofId, tokenId, { from: reviewer });
            // Act
            await instance.verifyProof(proofId, false, { from: reviewer });
            // Assert
            const [, , , , collateral, proofReviewer, status] = await instance.getProof.call(proofId);
            expect(collateral.toNumber()).to.equal(0);
            expect(status.toNumber()).to.equal(4);
            expect(proofReviewer).to.equal(reviewer);
        });

        it('should not mint a new token if approved is false', async () => {
            // Arrange
            const { pledgeId, proofId } = await getPledgeAndProofId(instance, { pledgeOwner })
            await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner });
            await instance.assignReviewer(pledgeId, proofId, tokenId, { from: reviewer });
            const initialTokenBalance = await growTokenInstance.balanceOf.call(pledgeOwner);
            // Act
            await instance.verifyProof(proofId, false, { from: reviewer });
            // Assert
            const tokenBalanceAfterApproval = await growTokenInstance.balanceOf.call(pledgeOwner);
            expect(tokenBalanceAfterApproval.toNumber()).to.equal(initialTokenBalance.toNumber());
        });
    
        it('should update balances if rejected', async () => {
            // Arrange
            const { pledgeId, proofId } = await getPledgeAndProofId(instance, { pledgeOwner, totalCollateral: 30 });
            await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner });
            await instance.assignReviewer(pledgeId, proofId, tokenId, { from: reviewer });
            const initialBalanceOfPledgeOwner = await instance.getBalance.call({ from: pledgeOwner });
            const initialPot = await instance.getPotAmount.call();
            // Act and Assert 
            await instance.verifyProof(proofId, false, { from: reviewer });
            // Assert
            const balanceOfReviewer = await instance.getBalance.call({ from: reviewer });
            const balanceOfPledgeOwner = await instance.getBalance.call({ from: pledgeOwner });
            const pot = await instance.getPotAmount.call();
    
            expect(balanceOfReviewer.toNumber()).to.equal(web3.toBigNumber(PROOF_FEE).toNumber());
            expect(balanceOfPledgeOwner.toNumber()).to.equal(initialBalanceOfPledgeOwner.toNumber());
            expect(pot.toNumber()).to.equal(initialPot.toNumber() + web3.toBigNumber(web3.toWei(20, 'finney')).toNumber());
        });
    });
});
