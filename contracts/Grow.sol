pragma solidity ^0.4.23;
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "./Proof.sol";
import "./Pledge.sol";
import "./UserAccount.sol";
import "./GrowToken.sol";
import "./Staking.sol";

/** @title Grow. */
contract Grow is Pausable, UserAccount, Proof, Pledge {

    // ============
    // EVENTS:
    // ============
    event ProofFeeUpdated(address indexed ownerAddress, uint newProofFee);
    event GrowTokenContractUpdated(address indexed ownerAddress, address growTokenAddress);
    event StakingContractUpdated(address indexed ownerAddress, address stakingAddress);
    event ReviewerVerified(address indexed ownerAddress, bytes32 proofId, address indexed reviewerAddress, bool wasApproved);
    event ReviewerAssigned(address indexed ownerAddress, bytes32 proofId, address indexed reviewerAddress);
    event PotIncrease(uint amount);
    event ProofAutoApproved(address indexed ownerAddress, bytes32 proofId, uint amountRefunded);

    // ============
    // DATA STRUCTURES:
    // ============
    using SafeMath for uint;
    uint constant EXPIRATION_WINDOW = 7 days;
    bytes32 constant FIRST_PLEDGE_HASH = 0x031a407d08e694c85e1ef4c7cbcfb1a529e05ee4f79a84fcc46f8ff36ca214e2;

    // ============
    // STATE VARIABLES:
    // ============
    uint public proofFee;
    uint private pot;
    GrowToken private growToken;
    Staking private staking;

    // ============
    // MODIFIERS:
    // ============
    // TODO - double check where these go
    modifier stakingIsEnabled() {
        require(staking != address(0) && !staking.paused(), "The staking address must be a real address and not paused");
        _;
    }

    modifier stakingNotEnabled() {
        require(staking == address(0) || staking.paused(), "The staking address must not be set or must be paused");
        _;
    }

    constructor (uint _proofFee, address _growTokenAddress) public {
        growToken = GrowToken(_growTokenAddress);
        proofFee = _proofFee;
    }

    /** @dev Sets the growToken contract address. Only owner is authorized.
      * @param _address The address of the grow token contract to use.
      */
    function setGrowToken(address _address) external onlyOwner {
        growToken = GrowToken(_address);
        emit GrowTokenContractUpdated(msg.sender, _address);
    }

    /** @dev Sets the staking contract address. Only owner is authorized.
      * @param _address The address of the staking contract to use.
      */
    function setStaking(address _address) external onlyOwner {
        staking = Staking(_address);
        emit StakingContractUpdated(msg.sender, _address);
    }

    /** @dev Sets the proofFee. Only owner is authorized.
      * @param _proofFee The new proof fee in wei.
      */
    function setProofFee(uint _proofFee) external onlyOwner {
        proofFee = _proofFee;
        emit ProofFeeUpdated(msg.sender, _proofFee);
    }

    /** @dev Creates a pledge and proofs.
      * @dev Proof expirations should be in ascending order
      * @param _proofExpirations The expiration date for each proof. Needs to be sorted in ascending order.
      * @param _hashDigest The ipfs hash minus the function and size.
      * @return pledgeIndex The index in the pledges array` of the created pledge.
      */
    function initPledge(
        uint[] _proofExpirations,
        bytes32 _hashDigest
    )
        external
        payable
        whenNotPaused
        returns(bytes32 pledgeId)
    {
        uint numOfProofs = _proofExpirations.length;  // Will restrict this length as part of future story
        uint collateralPerProof = msg.value.div(numOfProofs);

        require(
            ableToCoverFees(collateralPerProof), 
            "Must have enought collateral to cover fees"
        );

        pledgeId = createPledge(_hashDigest, numOfProofs);
        createEmptyProofs(pledgeId, _proofExpirations, collateralPerProof);
        mintTokenIfFirstPledge();
        return pledgeId;
    }

    /** @dev Submits proof details for a proof.
      * @param _ipfsHash The hash where pictures for proof are stored in ipfs.
      * @param _pledgeId The pledgeId associated with the proof
      * @param _proofId The id of the proof that is being submitted
      */
    function submitProof(
        bytes32 _ipfsHash,
        bytes32 _pledgeId,
        bytes32 _proofId
    )
        external
        whenNotPaused
        onlyPledgeOwner(_pledgeId)
        onlyIsProof(_proofId)
        onlyNextProofInOrder(_proofId, _pledgeId)
        onlyProofState(_proofId, ProofState.Pending)
        // onlyNotExpired(_proofId)
    {
        submitProofDetails(_ipfsHash, _proofId);
    }

    /** @dev Expire a proof.
      * @param _proofId The id of the proof that is being expired
      */
    function expireProof(
        bytes32 _proofId
    )
        external
        whenNotPaused
        onlyIsProof(_proofId)
        onlyActiveProof(_proofId)
        onlyCurrentProofOrBefore(_proofId)
        // onlyExpired(_proofId)
    {
        uint collateral = proofIdToProof[_proofId].collateral;
        require(address(this).balance >= collateral, "There must be enough balance in the contract to repay the collateral");
        clearCollateral(_proofId);
        uint remainingCollateral = rewardSenderWithProofFee(collateral);

        if (proofIdToProof[_proofId].state == ProofState.Pending) {
            addToPot(remainingCollateral);

            uint nextProofIndex = pledgeIdToNextProofIndex[proofIdToProof[_proofId].pledgeId];
            uint expiredIndexInPledge = proofIdToProof[_proofId].indexInPledge;
            if (expiredIndexInPledge >= nextProofIndex) {
                pledgeIdToNextProofIndex[proofIdToProof[_proofId].pledgeId] = expiredIndexInPledge.add(1);
            }
            updateProofState(_proofId, ProofState.Expired);
        } else if (proofIdToProof[_proofId].state == ProofState.Submitted) {
            autoApproveProof(_proofId, remainingCollateral);
        } else if (proofIdToProof[_proofId].state == ProofState.Assigned) {
            autoApproveProof(_proofId, remainingCollateral);
            staking.burnStake(_proofId, proofIdToProof[_proofId].reviewer);
        }
    }

    /** @dev Approve or Reject the verification of a proof.
      * @param _proofId The id of the proof
      * @param _approved True if the proof is approved, false if rejected
      */
    function verifyProof(
        bytes32 _proofId,
        bool _approved
    )
        external
        whenNotPaused
        onlyProofState(_proofId, ProofState.Assigned)
        onlyReviewer(_proofId)
        onlyNotExpired(_proofId)
    {
        uint collateral = proofIdToProof[_proofId].collateral;
        require(address(this).balance >= collateral, "There must be enough balance in the contract to repay the collateral");
        clearCollateral(_proofId);
        uint remainingCollateral = rewardSenderWithProofFee(collateral);

        if (_approved) {
            updateProofState(_proofId, ProofState.Accepted);
            refundProofOwner(_proofId, remainingCollateral);
            address pledgeOwner = pledgeIdToPledge[proofIdToProof[_proofId].pledgeId].owner;
            growToken.mint(proofIdToProof[_proofId].metadata, pledgeOwner);
        } else {
            updateProofState(_proofId, ProofState.Rejected);
            addToPot(remainingCollateral);
        }

        staking.releaseStake(_proofId, msg.sender);

        emit ReviewerVerified(
            pledgeIdToPledge[proofIdToProof[_proofId].pledgeId].owner, 
            _proofId, 
            msg.sender,
            _approved
        );
    }

    /** @dev Assign the reviewer for a proof.
      * @param _proofId The id of the proof that is being assigned
      * @param _tokenId The id of the token to stake
      */
    function assignReviewer(
        bytes32 _pledgeId,
        bytes32 _proofId,
        uint _tokenId
    )
        public
        whenNotPaused
        stakingIsEnabled
        onlyNotPledgeOwner(_pledgeId)
        onlyIsProof(_proofId)
        onlyProofState(_proofId, ProofState.Submitted)
        onlyNotExpired(_proofId)
    {
        updateProofState(_proofId, ProofState.Assigned);
        proofIdToProof[_proofId].reviewer = msg.sender;
        proofIdToProof[_proofId].expiresAt = now.add(EXPIRATION_WINDOW);
        staking.stake(_proofId, _tokenId, msg.sender);

        emit ReviewerAssigned(
            pledgeIdToPledge[_pledgeId].owner, 
            _proofId, 
            msg.sender
        );
    }    

    /** @dev Creates empty proofs with collateral and expiration.
      * @param _pledgeId the pledgeId to set on the proofs
      * @param _proofExpirations The list of expirations that will be mapped into Pledges
      * @param _collateralPerProof The collateral for each proof
      */
    function createEmptyProofs(
        bytes32 _pledgeId, 
        uint[] _proofExpirations, 
        uint _collateralPerProof
    ) 
        private 
    {
        bytes32[] memory proofs = pledgeIdToPledge[_pledgeId].proofs;

        for (uint i = 0; i < _proofExpirations.length; i++) {
            bytes32 proofId = createEmptyProof(_pledgeId, _proofExpirations[i], _collateralPerProof, i + 1);
            proofs[i] = proofId;
        }

        pledgeIdToPledge[_pledgeId].proofs = proofs;
    }

    /** @dev Get the pot balance in wei.
      */
    function getPotAmount() public view onlyOwner returns(uint) {
        return pot;
    }

    /** @dev Mint a new token for users after creating their first pledge.
      */
    function mintTokenIfFirstPledge() private returns (bool tokenWasMinted) {
        if (userAddressToNumberOfPledges[msg.sender] == 1) {
            growToken.mint(FIRST_PLEDGE_HASH, msg.sender);
            return true;
        }
    }

    /** @dev Determine whether the eth sent is enough to cover the fees.
      */
    function ableToCoverFees(uint _amountPerProof) private view returns (bool isEnough) {
        return _amountPerProof >= proofFee;
    }

    /** @dev Treat the proof as if it was approved.
      * @param _proofId the proofId to be approved
      * @param _amount the collateral to be refunded
      */
    function autoApproveProof(bytes32 _proofId, uint _amount) private {
        updateProofState(_proofId, ProofState.Accepted);
        refundProofOwner(_proofId, _amount);
        emit ProofAutoApproved(
            pledgeIdToPledge[proofIdToProof[_proofId].pledgeId].owner,
            _proofId,
            _amount
        );
    }

    /** @dev Update the proof owners account balance
      * @param _proofId the proofId to be approved
      * @param _amount the collateral to be refunded
      */
    function refundProofOwner(bytes32 _proofId, uint _amount) private {
        address pledgeOwner = pledgeIdToPledge[proofIdToProof[_proofId].pledgeId].owner;
        increaseBalance(_amount, pledgeOwner);
    }

    /** @dev Increase the balance of the pot
      * @param _amount the amount to add to the pot
      */
    function addToPot(uint _amount) private {
        pot = pot.add(_amount);
        emit PotIncrease(_amount);
    }

    /** @dev Remove collateral from a proof
      * @param _proofId the proof to clear collateral for
      */
    function clearCollateral(bytes32 _proofId) private {
        proofIdToProof[_proofId].collateral = 0;
    }

    /** @dev Update senders balance with the proofFee
      * @param _collateral the total collateral to take the proofFee from
      */
    function rewardSenderWithProofFee(uint _collateral) private returns (uint) {
        increaseBalance(proofFee, msg.sender);
        return _collateral.sub(proofFee);
    }
}
