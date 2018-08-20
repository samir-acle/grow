import Web3Utils from 'web3-utils';

export const getPledgeAndProofId = async (contract, options = {}) => {
    let pledgeOwner = options.pledgeOwner;
    let proofExpirations = options.proofExpirations || [(Date.now() + 1000000000)];
    let proofExpirationsSec = proofExpirations.map(convertMsToSec);
    let totalCollateral = web3.toWei(options.totalCollateral || 10 * proofExpirations.length, 'finney');
    let hash = web3.fromAscii('ipfshash');

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
