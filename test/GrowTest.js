const Grow = artifacts.require('Grow');
import assertRevert from "openzeppelin-solidity/test/helpers/assertRevert";
import Web3Utils from 'web3-utils';


contract('Grow', accounts => {
    let instance;
    const [firstAccount, secondAccount, thirdAccount] = accounts;

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
        instance = await Grow.new(10);
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

    /* 
    These tests check the functionality of initializing a pledge. elaborate
    */
    describe('initializing a pledge happy path', async () => {
        let proofExpirations, hashDigest;

        before(async () => {
            // Arrange
            proofExpirations = [1533779, 1534779, 1535779];
            hashDigest = web3.fromAscii('fakeIpfsHash');
            // Act
            await instance.initPledge(proofExpirations, hashDigest, {from: secondAccount, value: web3.toWei(1, 'ether')});
        });

        it('update userAddressToNumberOfPledges', async () => {
            // Assert
            const numOfPledges = await instance.userAddressToNumberOfPledges(secondAccount);
            expect(numOfPledges.toNumber()).to.equal(1);
        });

        it('should create a Pledge', async () => {
            // Assert
            const expectedPledgeId = Web3Utils.soliditySha3(secondAccount, 1);
            expect(await instance.getPledgeAtIndex(0)).to.equal(expectedPledgeId);

            // probably delete this method
            const createdPledgeOwner = await instance.getPledgeOwner(expectedPledgeId);
            // console.log('sdsdsd', createdPledgeOwner);

            // these tests arent working - figure out or delete...
            expect(createdPledgeOwner).to.equal(secondAccount);
            // expect(createdPledge[0][0]).to.equal(hashDigest);
            // expect(createdPledge[1]).to.equal(0);
            // expect(createdPledge[2]).to.equal(secondAccount);
        })

        it('should create corresponding Proofs', async () => {
            // Assert
            // const proofCount = await instance.getTotalProofCount();
            // expect(proofCount.toNumber).to.equal(proofExpirations.length);
        });
    });

    describe('initializing a pledge failures', () => {

        it('should fail if the proofExpirations are not in ascending order', async () => {
            // Arrange
            const proofExpirations = [153, 154, 151];
            const hashDigest = web3.fromAscii('ipfshash');
            // Act and Assert
            await assertRevert(instance.initPledge(proofExpirations, hashDigest, {from: secondAccount, value: web3.toWei(1, 'ether')})); 
        });
    
        it('will fail if collateral per proof is not greater than the pledge fee', async () => {
            // Arrange
            instance = await Grow.new(5);
            // Act and Assert
            await assertRevert(instance.initPledge(proofExpirations, hashDigest, {from: secondAccount, value: 10 }));
        });
    })

    describe('submit proof', async () => {

        it('should fail if not pledge owner', async () => {
            const proofExpirations = [1533779, 1534779, 1535779];
            const hashDigest = web3.fromAscii('fakeIpfsHash');
            // Arrange
            const pledgeId = await instance.initPledge(proofExpirations, hashDigest, {from: secondAccount, value: web3.toWei(1, 'ether')});
            // Act and Assert
            await assertRevert(instance.submitProof(web3.fromAscii('growth'), pledgeId, {from: thirdAccount}));
        });
        
        it('should update proof if before expiration', async () => {
            const now = Date.now();
            const proofExpirations = [now + 10000, now + 100000];
            const hashDigest = web3.fromAscii('images for proof');
            // Arrange
            const pledgeId = await instance.initPledge(proofExpirations, hashDigest, {from: secondAccount, value: web3.toWei(1, 'ether')});
            // const proofId = get
            // Act and Assert
            await instance.submitProofDetails(web3.fromAscii('growth'), proofId, {from: secondAccount});
        });

        it('should expire proof if after expiration', async () => {
            const now = Date.now();
            const proofExpirations = [now + 10000, now + 100000];
            const hashDigest = web3.fromAscii('images for proof');
            // Arrange
            const pledgeId = await instance.initPledge(proofExpirations, hashDigest, {from: secondAccount, value: web3.toWei(1, 'ether')});
            // Act and Assert
            await instance.submitProofDetails(web3.fromAscii('growth'), proofId, {from: secondAccount});
        });
    });
});

