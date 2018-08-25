const Grow = artifacts.require('./Grow.sol');
const GrowToken = artifacts.require('./GrowToken.sol');
const Staking = artifacts.require('./Staking.sol');

const FINNEY = 10**15;

module.exports = function(deployer, network, accounts) {
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
            return g.setMinter(accounts[0]);
        });
    })
    .then(() => {
        return GrowToken.deployed().then(g => {
            return g.mint(0x031a407d08e694c85e1ef4c7cbcfb1a529e05ee4f79a84fcc46f8ff36ca214e2 ,accounts[0]);
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
