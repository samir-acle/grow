const Grow = artifacts.require('Grow');
const GrowToken = artifacts.require('GrowToken');
const Staking = artifacts.require('Staking');
import assertRevert from 'openzeppelin-solidity/test/helpers/assertRevert';
import increaseTime from 'openzeppelin-solidity/test/helpers/increaseTime';
import Web3Utils from 'web3-utils';
import { 
    getPledgeAndProofId, 
    convertMsToSec, 
    daysInPast, 
    daysInFuture, 
    hoursInFuture, 
    hoursInSeconds, 
    setupWithStakedTokens, 
    PROOF_FEE,
    daysInSeconds
} from './helpers';

 /* 
    These are tests for the public entry to the smart contract. These cover functionality
    found in the Proof and Pledge contracts.
    */
contract('Grow', accounts => {
    let instance, growTokenInstance, stakingInstance;
    const [contractOwner, pledgeOwner, otherAccount] = accounts;
    const BYTES32_ZERO = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

    beforeEach(async () => {
        instance = await Grow.deployed();
        growTokenInstance = await GrowToken.deployed();
    });

    /* 
    These tests check that the proofFee is set and can only be updated by
    the contract owner.  Although the Ownable contract is tested by OpenZeppelin,
    I wanted to ensure that the modifier was used in this specific case, as 
    an accidental or malicious change of the proofFee would have a huge impact
    on users.
    */
    describe('proof Fee setting', () => {

        it('should set proofFee when Grow contract is created', async () => {
            // Arrange
            growTokenInstance = await GrowToken.deployed();
            instance = await Grow.new(10, growTokenInstance.address);
            // Act
            const proofFee = await instance.proofFee();
            // Assert
            expect(proofFee.toNumber()).to.equal(10);
        });

        it('owner should be able to update the proofFee', async () => {
            // Arrange
            const expectedProofFee = 1000;
            const oldProofFee = await instance.proofFee();
            expect(oldProofFee.toNumber()).not.to.equal(expectedProofFee);
            // Act
            await instance.setProofFee(expectedProofFee);
            // Assert
            const newProofFee = await instance.proofFee();
            expect(newProofFee.toNumber()).to.equal(expectedProofFee);
        });

        it('non-owner should not be able to update the proofFee', async () => {
            // Arrange
            const newOwner = pledgeOwner;
            // Act
            await instance.transferOwnership(newOwner);
            // Assert
            await assertRevert(instance.setProofFee(1));
        });
    })

    /* 
    These tests check the happy path functionality of initializing a pledge which includes creating 
    corresponding proofs, the pledge itself, and minting a Grow token.
    */
    describe('initializing a pledge happy path', async () => {
        let proofExpirations, hashDigest, pledgeId, createdPledge;

        // QmPkEJbH4rhSRtupCosegxQjf29vwATpFHzcU9qUnK3K4b

        before(async () => {
            // Arrange
            instance = await Grow.deployed();
            growTokenInstance = await GrowToken.deployed();
            proofExpirations = [1533779, 1534779, 1535779];
            hashDigest = web3.fromAscii('fakeIpfsHash');
            pledgeId = Web3Utils.soliditySha3(pledgeOwner, 1);
            // Act
            await instance.initPledge(proofExpirations, hashDigest, { from: pledgeOwner, value: web3.toWei(30, 'finney') });
            expect(await instance.getPledgeAtIndex(0)).to.equal(pledgeId);
            createdPledge = await instance.getPledge.call(pledgeId);
        });

        it('update userAddressToNumberOfPledges', async () => {
            // Assert
            const numOfPledges = await instance.userAddressToNumberOfPledges(pledgeOwner);
            expect(numOfPledges.toNumber()).to.equal(1);
        });

        it('should create a Pledge', async () => {
            // Assert
            expect(createdPledge[0]).to.contain(hashDigest);
            expect(createdPledge[1].toNumber()).to.equal(0);
            expect(createdPledge[2]).to.equal(pledgeOwner);
            expect(createdPledge[3].toNumber()).to.equal(0);
            expect(createdPledge[5].toNumber()).to.equal(3);
        })

        it('should create corresponding Proofs', async () => {
            // Assert
            const actualProofs = createdPledge[4];
            expect(actualProofs).to.have.lengthOf(3);

            actualProofs.forEach(async (p, i) => {
                const proofId = Web3Utils.soliditySha3(pledgeId, i + 1)
                expect(p).to.equal(proofId);
                const [metadata, actualPledgeId, index, expiresAt, collateral, reviewer, status] = await instance.getProof.call(proofId);
                expect(actualPledgeId).to.equal(pledgeId);
                expect(index.toNumber()).to.equal(i);
                expect(expiresAt.toNumber()).to.equal(proofExpirations[i]);
                expect(collateral.toNumber()).to.equal(parseInt(web3.toWei(10, 'finney'), 10));
                expect(status.toNumber()).to.equal(0);
                expect(metadata).to.equal(BYTES32_ZERO);
                expect(reviewer).to.equal(ADDRESS_ZERO);
            });
        });

        it('should send token to pledge owner if it was the first pledge created', async () => {
            // Assert
            const balance = await growTokenInstance.balanceOf.call(pledgeOwner);
            expect(balance.toNumber()).to.equal(1);
        });

        it('should not send another token to pledge owner if it was not the first pledge created', async () => {
            // Act
            await instance.initPledge(proofExpirations, hashDigest, { from: pledgeOwner, value: web3.toWei(10, 'finney') });
            // Assert
            const balance = await growTokenInstance.balanceOf.call(pledgeOwner);
            expect(balance.toNumber()).to.equal(1);
        });
    });

    /* 
    These tests check validation on inputs that occur prior to creating a pledge. This should help prevent
    against malicious use.
    */
    describe('initializing a pledge failures', () => {
        let hashDigest;

        before(async () => {
            hashDigest = web3.fromAscii('ipfshash');
            instance = await Grow.deployed();
        })

        it.skip('should fail if the proofExpirations are not in ascending order', async () => {
            // Arrange
            const proofExpirations = [153, 154, 151];
            // Act and Assert
            await assertRevert(instance.initPledge(proofExpirations, hashDigest, { from: pledgeOwner, value: web3.toWei(10, 'finney') }));
        });

        it('will fail if collateral per proof is not greater than the pledge fee', async () => {
            // Arrange
            const proofExpirations = [153];
            instance = await Grow.new(5, growTokenInstance.address);
            // Act and Assert
            await assertRevert(instance.initPledge(proofExpirations, hashDigest, { from: pledgeOwner, value: 1 }));
        });
    });

    /* 
    These tests check both the happy path functionality of submitting a proof, which includes updating the status, metadata,
    and index tracking state variables, as well as testing against malicious use by checking for reverts when inputs are
    not valid.
    */
    describe('submit proof', async () => {
        const now = Date.now();
        const hoursInFuture = now + 10000000;
        const daysInFuture = now + 1000000000;
        const daysInPast = now - 1000000000;

        before(async () => {
            instance = await Grow.deployed();
        })

        it('should fail if not pledge owner', async () => {
            // Arrange
            const proofExpirations = [1533779, 1534779, 1535779];
            const { pledgeId, proofId } = await getPledgeAndProofId(instance, { proofExpirations, pledgeOwner });
            // Act and Assert
            await assertRevert(instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: otherAccount }));
        });

        it('should fail if pledge and proof do not match', async () => {
            // Arrange
            const proofExpirations = [1533779];
            const { proofId } = await getPledgeAndProofId(instance, { proofExpirations, pledgeOwner });

            await instance.initPledge(proofExpirations, web3.fromAscii('ipfshash'), { from: pledgeOwner, value: web3.toWei(10, 'finney') });
            const pledgeId2 = Web3Utils.soliditySha3(pledgeOwner, 2);
            // Act and Assert
            await assertRevert(instance.submitProof(web3.fromAscii('growth'), pledgeId2, proofId, { from: otherAccount }));
        });

        it('should fail if is already submitted', async () => {
            // Arrange
            const proofExpirations = [hoursInFuture, daysInFuture];
            const { pledgeId, proofId } = await getPledgeAndProofId(instance, { proofExpirations, pledgeOwner });

            await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner });
            // Act and Assert
            await assertRevert(instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner }));
        });

        it('should update proof status if before expiration', async () => {
            const proofExpirations = [hoursInFuture];
            const hash = web3.fromAscii('images for proof');
            // Arrange
            const { pledgeId, proofId } = await getPledgeAndProofId(instance, { proofExpirations, pledgeOwner, hash });
            // Act
            await instance.submitProof(hash, pledgeId, proofId, { from: pledgeOwner });
            // Assert
            const [metadata, , , expiresAt, , , status] = await instance.getProof.call(proofId);
            expect(status.toNumber()).to.equal(1);
            expect(metadata).to.contain(hash);
            expect(expiresAt.toNumber()).to.be.above(proofExpirations.map(convertMsToSec)[0]);
        });

        it.skip('should revert if after expiration', async () => {
            const proofExpirations = [daysInPast];
            // Arrange
            const { pledgeId, proofId } = await getPledgeAndProofId(instance, { proofExpirations, pledgeOwner });
            // Act and Assert
            await assertRevert(instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner }));
        });

        it('should track the last submitted index', async () => {
            const proofExpirations = [hoursInFuture, daysInFuture];
            const { pledgeId, proofId } = await getPledgeAndProofId(instance, { proofExpirations, pledgeOwner });
            
            let lastSubmittedIndex = await instance.pledgeIdToNextProofIndex.call(pledgeId);
            expect(lastSubmittedIndex.toNumber()).to.equal(0);

            await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner });

            lastSubmittedIndex = await instance.pledgeIdToNextProofIndex.call(pledgeId);
            expect(lastSubmittedIndex.toNumber()).to.equal(1);

            const proof2Id = Web3Utils.soliditySha3(pledgeId, 2);
            await instance.submitProof(web3.fromAscii('growth'), pledgeId, proof2Id, { from: pledgeOwner });
            
            lastSubmittedIndex = await instance.pledgeIdToNextProofIndex.call(pledgeId);
            expect(lastSubmittedIndex.toNumber()).to.equal(2);
        });

        it('should revert if the proof is not the next proof in line', async () => {
            // Arrange
            const proofExpirations = [hoursInFuture, daysInFuture, daysInFuture + 10000];
            const { proofId, pledgeId } = await getPledgeAndProofId(instance, { proofExpirations, pledgeOwner });
            await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner });
            const wrongProofId = Web3Utils.soliditySha3(pledgeId, 3);

            // Act and Assert
            await assertRevert(instance.submitProof(web3.fromAscii('growth'), pledgeId, wrongProofId, { from: pledgeOwner }));
        });
    });

    /* 
    These tests test handling calling the expire proof function. There are three different outcomes based on the current state of 
    the proof. Validation of the inputs and whether or not the proof can be expired is tested to prevent
    misuse. Also verifies the tracking of the next proof (for submittions purposes) is tested.
    */
    describe('expire proof', async () => {
        const now = Date.now();
        const tokenId = 1;

        beforeEach(async () => {
            const setupOptions = { tokenId, reviewer: otherAccount, thirdParty: contractOwner };
            const contractInstances = await setupWithStakedTokens(GrowToken, Staking, Grow, setupOptions);
            instance = contractInstances.instance;
            growTokenInstance = contractInstances.growTokenInstance;
            stakingInstance = contractInstances.stakingInstance;
        });

        it('should fail if is already expired', async () => {
            // Arrange
            const proofExpirations = [daysInPast(now)];
            const { pledgeId, proofId } = await getPledgeAndProofId(instance, { proofExpirations, pledgeOwner });
            await instance.expireProof(proofId);

            // Act and Assert
            await assertRevert(instance.expireProof(proofId, { from: contractOwner }));
        });
        
        it.skip('should revert if not past expiration time', async () => {
            const proofExpirations = [daysInFuture(now)];
            // Arrange
            const { proofId } = await getPledgeAndProofId(instance, { proofExpirations, pledgeOwner });
            // Act and Assert
            await assertRevert(instance.expireProof(proofId, { from: contractOwner }));
        });

        it('can only expire a proof that is next in line or earlier', async () => {
            // Arrange
            const proofExpirations = [hoursInFuture(now), hoursInFuture(now), hoursInFuture(now), hoursInFuture(now), hoursInFuture(now)];
            const { pledgeId, proofId } = await getPledgeAndProofId(instance, { proofExpirations, pledgeOwner });

            await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner });
            increaseTime(hoursInSeconds * 2);
            // Act and Assert
            const proofId2 = Web3Utils.soliditySha3(pledgeId, 2);
            const proofId3 = Web3Utils.soliditySha3(pledgeId, 3);
            const proofId4 = Web3Utils.soliditySha3(pledgeId, 4);
            const proofId5 = Web3Utils.soliditySha3(pledgeId, 5);

            await assertRevert(instance.expireProof(proofId3, { from: otherAccount }));
            await assertRevert(instance.expireProof(proofId4, { from: otherAccount }));
            await assertRevert(instance.expireProof(proofId5, { from: otherAccount }));

            await instance.expireProof(proofId2);
            const eightDaysInSeconds = 691200;
            increaseTime(eightDaysInSeconds);
            await instance.expireProof(proofId);
        });

        describe('proof is pending', () => {
            it('should update proof status to expired', async () => {
                // Arrange
                const proofExpirations = [daysInPast(now)];
                const { proofId } = await getPledgeAndProofId(instance, { proofExpirations, pledgeOwner });
                // Act
                await instance.expireProof(proofId);
                // Assert
                const [, , , , , , status] = await instance.getProof.call(proofId);
                expect(status.toNumber()).to.equal(5);
            });

            it('should update balances correctly', async () => {
                 // Arrange
                 const proofExpirations = [daysInPast(now)];
                 const { proofId } = await getPledgeAndProofId(instance, { proofExpirations, pledgeOwner, totalCollateral: 11 });
                 // Act
                 await instance.expireProof(proofId, { from: otherAccount });
                 // Assert
                 const proofOwnerBalance = await instance.getBalance.call({ from: pledgeOwner });
                 const otherAccountBalance = await instance.getBalance.call({ from: otherAccount });
                 expect(proofOwnerBalance.toNumber()).to.equal(0);
                 expect(otherAccountBalance.toNumber()).to.equal(parseInt(PROOF_FEE));
                 const potBalance = await instance.getPotAmount({ from: contractOwner });
                 expect(potBalance.toNumber()).to.equal(parseInt(web3.toWei(1, 'finney'), 10));
            });

            it('should track the last submitted index', async () => {
                const proofExpirations = [daysInPast(now), daysInPast(now)];
                const { proofId, pledgeId } = await getPledgeAndProofId(instance, { proofExpirations, pledgeOwner });
                
                let lastSubmittedIndex = await instance.pledgeIdToNextProofIndex.call(pledgeId);
                expect(lastSubmittedIndex.toNumber()).to.equal(0);
    
                await instance.expireProof(proofId, { from: pledgeOwner });
    
                lastSubmittedIndex = await instance.pledgeIdToNextProofIndex.call(pledgeId);
                expect(lastSubmittedIndex.toNumber()).to.equal(1);
    
                const proof2Id = Web3Utils.soliditySha3(pledgeId, 2);
                await instance.expireProof(proof2Id, { from: pledgeOwner });
                
                lastSubmittedIndex = await instance.pledgeIdToNextProofIndex.call(pledgeId);
                expect(lastSubmittedIndex.toNumber()).to.equal(2);
            });
        });
        

        describe('proof is submitted', () => {
            it('should update proof status to accepted', async () => {
                // Arrange
                const proofExpirations = [daysInFuture(now)];
                const { pledgeId, proofId } = await getPledgeAndProofId(instance, { proofExpirations, pledgeOwner });
                await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner });
                increaseTime(daysInSeconds * 2);
                // Act
                await instance.expireProof(proofId);
                // Assert
                const [, , , , , , status] = await instance.getProof.call(proofId);
                expect(status.toNumber()).to.equal(3);
            });

            it('should update balances correctly', async () => {
                 // Arrange
                 const proofExpirations = [daysInPast(now)];
                 const { proofId } = await getPledgeAndProofId(instance, { proofExpirations, pledgeOwner, totalCollateral: 11 });
                 // Act
                 await instance.expireProof(proofId, { from: otherAccount });
                 // Assert
                 const proofOwnerBalance = await instance.getBalance.call({ from: pledgeOwner });
                 const otherAccountBalance = await instance.getBalance.call({ from: otherAccount });
                 expect(proofOwnerBalance.toNumber()).to.equal(0);
                 expect(otherAccountBalance.toNumber()).to.equal(parseInt(PROOF_FEE, 10));
                 const potBalance = await instance.getPotAmount({ from: contractOwner });
                 expect(potBalance.toNumber()).to.equal(parseInt(web3.toWei(1, 'finney'), 10));
            });
        });

        describe('proof is assigned', () => {
            it('should update proof status to accepted', async () => {
                // Arrange
                const proofExpirations = [daysInFuture(now)];
                const { pledgeId, proofId } = await getPledgeAndProofId(instance, { proofExpirations, pledgeOwner });
                await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner });
                console.log('before assign reviewer');
                await instance.assignReviewer(pledgeId, proofId, tokenId, { from: otherAccount });
                console.log('after assign reviewer');
                increaseTime(daysInFuture * 2);

                const tokenIsStaked = await stakingInstance.isTokenStaked.call(tokenId);
                console.log('token', tokenId, tokenId ? 'is staked' : 'is not staked');
                const staker = await stakingInstance.getStaker.call(proofId);
                console.log('staker', staker);
                console.log('reviewer', otherAccount);
                // Act
                console.log('before expire');
                await instance.expireProof(proofId, { from: contractOwner });
                console.log('after expire');
                // Assert
                const [, , , , , , status] = await instance.getProof.call(proofId);
                expect(status.toNumber()).to.equal(3);
            });

            it('should burn the staked token', async () => {
                const proofExpirations = [daysInFuture(now)];
                const { pledgeId, proofId } = await getPledgeAndProofId(instance, { proofExpirations, pledgeOwner });
                await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner });
                await instance.assignReviewer(pledgeId, proofId, tokenId, { from: otherAccount });
                increaseTime(daysInFuture * 2);
                const tokenCountBeforeExpiration = await growTokenInstance.getOwnedTokenCount.call({ from: stakingInstance.address });
                expect(tokenCountBeforeExpiration.toNumber()).to.equal(1);
                // Act
                console.log('before expire');
                await instance.expireProof(proofId, { from: contractOwner });
                console.log('after expire');
                // Assert
                const tokenCountAfterExpiration = await growTokenInstance.getOwnedTokenCount.call({ from: stakingInstance.address });
                expect(tokenCountAfterExpiration.toNumber()).to.equal(0);
            });

            it('should update balances', async () => {
                const proofExpirations = [daysInFuture(now)];
                const { pledgeId, proofId } = await getPledgeAndProofId(instance, { proofExpirations, pledgeOwner, totalCollateral: 11 });
                await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: pledgeOwner });
                await instance.assignReviewer(pledgeId, proofId, tokenId, { from: otherAccount });
                increaseTime(daysInFuture * 2);
                // Act
                console.log('before expire');
                await instance.expireProof(proofId, { from: contractOwner });
                console.log('after expire');
                // Assert
                const proofOwnerBalance = await instance.getBalance.call({ from: pledgeOwner });
                const otherAccountBalance = await instance.getBalance.call({ from: contractOwner });
                expect(proofOwnerBalance.toNumber()).to.equal(parseInt(web3.toWei(1, 'finney'), 10));
                expect(otherAccountBalance.toNumber()).to.equal(parseInt(PROOF_FEE, 10));
            });            
        });
    });
});
