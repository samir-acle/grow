const SocialPressure = artifacts.require('./SocialPressure.sol');

module.exports = function(deployer) {
    deployer.deploy(SocialPressure);
};
