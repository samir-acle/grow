import Web3Utils from 'web3-utils';

export const PROOF_FEE = web3.toWei(10, 'finney');

export const getPledgeAndProofId = async (contract, options = {}) => {
    let pledgeOwner = options.pledgeOwner;
    let proofExpirations = options.proofExpirations || [(Date.now() + 1000000000)];
    let proofExpirationsSec = proofExpirations.map(convertMsToSec);
    let totalCollateral = web3.toWei(options.totalCollateral || 20 * proofExpirations.length, 'finney');
    let hash = web3.fromAscii('pledge details hash');

    await contract.initPledge(proofExpirationsSec, hash, { from: pledgeOwner, value: totalCollateral });

    const numOfPledges = await contract.userAddressToNumberOfPledges(pledgeOwner);
    const pledgeId = Web3Utils.soliditySha3(pledgeOwner, numOfPledges.toNumber());
    const proofId = Web3Utils.soliditySha3(pledgeId, 1);
    return {
        pledgeId,
        proofId,
    }
};

export const convertMsToSec = (ms) => Math.floor(ms / 1000);

export const hoursInFuture = now => now + 10000000;
export const daysInFuture = now => now + 1000000000;
export const daysInPast = now => now - 1000000000;

export const hoursInSeconds = 10000000 / 1000;
export const daysInSeconds = 1000000000 / 1000;

export const setupWithStakedTokens = async (GrowToken, Staking, Grow, options) => {
    const tokenId = options.tokenId || 1;
    const reviewer = options.reviewer;
    const thirdParty = options.thirdParty;

    const growTokenInstance = await GrowToken.new();
    const stakingInstance = await Staking.new(growTokenInstance.address);
    const instance = await Grow.new(PROOF_FEE, growTokenInstance.address);

    await growTokenInstance.setBurner(stakingInstance.address);
    await stakingInstance.setController(instance.address);

    await growTokenInstance.setMinter(thirdParty);
    await growTokenInstance.mint(web3.fromAscii('testing'), reviewer);
    await growTokenInstance.mint(web3.fromAscii('testing'), reviewer);

    await growTokenInstance.setMinter(instance.address);
    await instance.setStaking(stakingInstance.address);

    await growTokenInstance.approve(stakingInstance.address, tokenId, { from: reviewer });
    await stakingInstance.deposit(tokenId, { from: reviewer });

    return { growTokenInstance, stakingInstance, instance };
}
