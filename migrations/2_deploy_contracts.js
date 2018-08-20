const Grow = artifacts.require('./Grow.sol');
const GrowToken = artifacts.require('./GrowToken.sol');
const Staking = artifacts.require('./Staking.sol');

const FINNEY = 10**15;

module.exports = function(deployer) {
    deployer.deploy(GrowToken)
    .then(() => {
        return deployer.deploy(Grow, 10 * FINNEY, GrowToken.address);
    })
    .then(() => {
        return deployer.deploy(Staking, GrowToken.address)
        .then((s) => {
            return s.setController(Grow.address);
        });
    })
    .then(() => {
        return GrowToken.deployed().then(g => {
            return g.setMinter(Grow.address);
        });
    })
    .then(() => {
        return GrowToken.deployed().then(g => {
            return g.setBurner(Staking.address);
        });
    });
};


// TODO - deploy a library and link...
