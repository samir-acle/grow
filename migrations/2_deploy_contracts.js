const Grow = artifacts.require('./Grow.sol');
const GrowToken = artifacts.require('./GrowToken.sol');

const FINNEY = 10**15;

module.exports = function(deployer) {
    deployer.deploy(Grow, 10 * FINNEY);
    deployer.deploy(GrowToken, "GrowToken", "GROW");
};
