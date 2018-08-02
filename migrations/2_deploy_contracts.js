const Pressure = artifacts.require('./Pressure.sol');

module.exports = function(deployer) {
    deployer.deploy(Pressure);
};
