const Grow = artifacts.require('Grow');
const GrowToken = artifacts.require('GrowToken');
import assertRevert from "openzeppelin-solidity/test/helpers/assertRevert";
import Web3Utils from 'web3-utils';

contract('Grow', accounts => {
    let instance, growTokenInstance;
    const [firstAccount, secondAccount, thirdAccount] = accounts;

    describe('proof Fee setting', () => {

        beforeEach(async () => {
            instance = await Grow.deployed();
        });

        /* 
        These tests check that the proofFee is set and can only be updated by
        the contract owner.  Although the Ownable contract is tested by OpenZeppelin,
        I wanted to ensure that the modifier was used in this specific case, as 
        an accidental or malicious change of the proofFee would have a huge impact
        on users.
        */
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
            const newOwner = secondAccount;
            // Act
            await instance.transferOwnership(newOwner);
            // Assert
            await assertRevert(instance.setProofFee(1));
        });
    })

    /* 
    These tests check the happy path functionality of initializing a pledge and the corresponding
    proofs. 
    */
    describe('initializing a pledge happy path', async () => {
        let proofExpirations, hashDigest, pledgeId, createdPledge;

        // QmPkEJbH4rhSRtupCosegxQjf29vwATpFHzcU9qUnK3K4b

        before(async () => {
            instance = await Grow.deployed();
            growTokenInstance = await GrowToken.deployed();

            // should I actually initialize these first?  requires 2 times looping
            // Arrange
            proofExpirations = [1533779, 1534779, 1535779];
            hashDigest = web3.fromAscii('fakeIpfsHash');
            pledgeId = Web3Utils.soliditySha3(secondAccount, 1);
            // Act
            await instance.initPledge(proofExpirations, hashDigest, { from: secondAccount, value: web3.toWei(3, 'ether') });
            expect(await instance.getPledgeAtIndex(0)).to.equal(pledgeId);
            createdPledge = await instance.getPledge.call(pledgeId);
        });

        it('update userAddressToNumberOfPledges', async () => {
            // Assert
            const numOfPledges = await instance.userAddressToNumberOfPledges(secondAccount);
            expect(numOfPledges.toNumber()).to.equal(1);
        });

        it('should create a Pledge', async () => {
            // Assert
            // expect(createdPledge[0]).to.equal(hashDigest);
            expect(createdPledge[1].toNumber()).to.equal(0);
            expect(createdPledge[2]).to.equal(secondAccount);
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
                expect(collateral.toNumber()).to.equal(parseInt(web3.toWei(1, 'ether'), 10));
                expect(status.toNumber()).to.equal(0);
                // figure out how to test the hash is emty?
                // check reviwer is 0x0
            });
        });

        it('should send token to pledge owner if it was the first pledge created', async () => {
            // Assert
            const balance = await growTokenInstance.balanceOf.call(secondAccount);
            expect(balance.toNumber()).to.equal(1);
        });

        it('should not send another token to pledge owner if it was not the first pledge created', async () => {
            // Act
            await instance.initPledge(proofExpirations, hashDigest, { from: secondAccount, value: web3.toWei(3, 'ether') });
            // Assert
            const balance = await growTokenInstance.balanceOf.call(secondAccount);
            expect(balance.toNumber()).to.equal(1);
        });
    });

    // break out the submit edge and proof into private method and destructure response

    describe('initializing a pledge failures', () => {
        let hashDigest;

        before(async () => {
            hashDigest = web3.fromAscii('ipfshash');
            instance = await Grow.deployed();
        })

        it('should fail if the proofExpirations are not in ascending order', async () => {
            // Arrange
            const proofExpirations = [153, 154, 151];
            // Act and Assert
            await assertRevert(instance.initPledge(proofExpirations, hashDigest, { from: secondAccount, value: web3.toWei(1, 'ether') }));
        });

        it('will fail if collateral per proof is not greater than the pledge fee', async () => {
            // Arrange
            const proofExpirations = [153];
            instance = await Grow.new(5, growTokenInstance.address);
            // Act and Assert
            await assertRevert(instance.initPledge(proofExpirations, hashDigest, { from: secondAccount, value: 1 }));
        });
    });

    describe('submit proof', async () => {

        it('should fail if not pledge owner', async () => {
            // Arrange
            const proofExpirations = [1533779, 1534779, 1535779];
            const { pledgeId, proofId } = await getPledgeAndProofId(proofExpirations);
            // Act and Assert
            await assertRevert(instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: thirdAccount }));
        });

        it('should fail if pledge and proof do not match', async () => {
            // Arrange
            const proofExpirations = [1533779];
            const { proofId } = await getPledgeAndProofId(proofExpirations);

            await instance.initPledge(proofExpirations, web3.fromAscii('ipfshash'), { from: secondAccount, value: web3.toWei(1, 'ether') });
            const pledgeId2 = Web3Utils.soliditySha3(secondAccount, 2);
            // Act and Assert
            await assertRevert(instance.submitProof(web3.fromAscii('growth'), pledgeId2, proofId, { from: thirdAccount }));
        });

        it('should fail if is already completed', async () => {
            // Arrange
            const now = Date.now();
            const proofExpirations = [now + 10000, now + 100000];
            const { pledgeId, proofId } = await getPledgeAndProofId(proofExpirations);

            await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: secondAccount });
            // Act and Assert
            await assertRevert(instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: thirdAccount }));
        });

        it('should update proof status if before expiration', async () => {
            const now = Date.now();
            const proofExpirations = [(now + 10000) / 1000];
            const hashDigest = web3.fromAscii('images for proof');
            // Arrange
            const { pledgeId, proofId } = await getPledgeAndProofId(proofExpirations);
            // Act
            await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: secondAccount });
            // Assert
            const [, , , , , , status] = await instance.getProof.call(proofId);
            expect(status.toNumber()).to.equal(1);
            // expect(metadata).to.equal(5);
            // expect(expiresAt.toNumber()).to.equal();

        });

        it('should expire proof if after expiration', async () => {
            const now = Date.now();
            const proofExpirations = [now + 10000, now + 100000];
            const hashDigest = web3.fromAscii('images for proof');
            // Arrange
            const { pledgeId, proofId } = await getPledgeAndProofId(proofExpirations);
            // Act
            await instance.submitProof(web3.fromAscii('growth'), pledgeId, proofId, { from: secondAccount });
            // Assert
            const [, , , , , , status] = await instance.getProof.call(proofId);
            expect(status.toNumber()).to.equal(5);
        });
    })

    const getPledgeAndProofId = async (proofExpirations) => {
        await instance.initPledge(proofExpirations, web3.fromAscii('ipfshash'), { from: secondAccount, value: web3.toWei(1, 'ether') });
        const pledgeId = Web3Utils.soliditySha3(secondAccount, 1);
        const proofId = Web3Utils.soliditySha3(pledgeId, 1);
        return {
            pledgeId,
            proofId,
        }
    };
});
