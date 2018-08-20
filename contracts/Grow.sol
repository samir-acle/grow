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
        require(staking != address(0));
        require(!staking.paused());
        _;
    }

    modifier stakingNotEnabled() {
        require(staking != address(0));
        require(staking.paused());
        _;
    }

    modifier onlyReviewer(bytes32 _proofId) {
        require(msg.sender == proofIdToProof[_proofId].reviewer);
        _;
    }

    //  TODO -  should this be percentage of collateral?  Probs because reviewer is risking more and putting more away and losing potential gains
    // 10 finney for now...
    // definitely should be adjusted based on gas price/cost of approving (rather than price of total collateral)

    constructor (uint _proofFee, address _growTokenAddress) public {
        growToken = GrowToken(_growTokenAddress);
        proofFee = _proofFee;
    }

    /** @dev Sets the growToken contract address. Only owner is authorized.
        * @param _address The address of the grow token contract to use.
        */
    function setGrowToken(address _address) public onlyOwner {
        growToken = GrowToken(_address);
        emit GrowTokenContractUpdated(msg.sender, _address);
    }

    /** @dev Sets the staking contract address. Only owner is authorized.
        * @param _address The address of the staking contract to use.
        */
    function setStaking(address _address) public onlyOwner {
        staking = Staking(_address);
        emit StakingContractUpdated(msg.sender, _address);
    }

    /** @dev Sets the proofFee. Only owner is authorized.
        * @param _proofFee The new proof fee in wei.
        */
    function setProofFee(uint _proofFee) public onlyOwner {
        proofFee = _proofFee;
        emit ProofFeeUpdated(msg.sender, _proofFee);
    }

    /** @dev Creates a pledge and proofs.
      * @param _proofExpirations The expiration date for each proof. Needs to be sorted in ascending order.
      * @param _hashDigest The ipfs hash minus the function and size.
      * @return pledgeIndex The index in the pledges array` of the created pledge.
      */
    function initPledge(
        uint[] _proofExpirations,
        bytes32 _hashDigest
    )
        public
        payable
        whenNotPaused
        returns(bytes32 pledgeId)
    {
        uint numOfProofs = _proofExpirations.length;
        uint collateralPerProof = msg.value.div(numOfProofs);

        require(
            ableToCoverFees(collateralPerProof), 
            "Must have enought collateral to cover fees"
        );
        require(
            inAscendingOrder(_proofExpirations), 
            "Proof expirations must be sorted with soonest expiration first"
        );

        // should mayeb add total to pledge
        // remainder will be added to the pot? which lives where probably here 

        pledgeId = createPledge(_hashDigest, numOfProofs);
        createEmptyProofs(pledgeId, _proofExpirations, collateralPerProof);
        mintTokenIfFirstPledge(_hashDigest);
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
        public
        whenNotPaused
        onlyPledgeOwner(_pledgeId)
        onlyIsProof(_proofId)
        onlyIfPreviousProofComplete(_pledgeId)
        onlyNextProofInOrder(_proofId, _pledgeId)
        onlyPledgeState(_proofId, PledgeState.Active)
        onlyProofState(_proofId, ProofState.Pending)
        onlyNotExpired(_proofId)
    {
        submitProofDetails(_ipfsHash, _proofId);
    }

    /** @dev Expire a proof.
      * @param _proofId The id of the proof that is being expired
      */
    function expireProof(
        bytes32 _proofId
    )
        public
        whenNotPaused
        onlyIsProof(_proofId)
        onlyActiveProof(_proofId)
        onlyExpired(_proofId)
    {
        uint collateral = proofIdToProof[_proofId].collateral;
        require(address(this).balance >= collateral);
        clearCollateral(_proofId);
        uint remainingCollateral = rewardSenderWithProofFee(collateral);

        if (proofIdToProof[_proofId].state == ProofState.Pending) {
            addToPot(remainingCollateral);
            pledgeIdToNextProofIndex[proofIdToProof[_proofId].pledgeId]++;
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
        public
        whenNotPaused
        onlyProofState(_proofId, ProofState.Assigned)
        onlyReviewer(_proofId)
        onlyNotExpired(_proofId)
    {
        uint collateral = proofIdToProof[_proofId].collateral;
        require(address(this).balance >= collateral);
        clearCollateral(_proofId);
        uint remainingCollateral = rewardSenderWithProofFee(collateral);

        if (_approved) {
            updateProofState(_proofId, ProofState.Accepted);
            refundProofOwner(_proofId, remainingCollateral);
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
        proofIdToProof[_proofId].expiresAt = now + 7 days;
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
        bytes32[] storage proofs = pledgeIdToPledge[_pledgeId].proofs;

        for (uint i = 0; i < _proofExpirations.length; i++) {
            bytes32 proofId = createEmptyProof(_pledgeId, _proofExpirations[i], _collateralPerProof, i + 1);
            proofs[i] = proofId;
        }
    }

    function getPotAmount() public view onlyOwner returns(uint) {
        return pot;
    }

// this could be in a library?
// is there better way to do this so dont have to loop?
// validate length is below certain size?
    function inAscendingOrder(uint[] numberArray) private returns (bool isSorted) {        
        isSorted = true;

        for (uint i = 1; i < numberArray.length; i++) {
            if (numberArray[i] < numberArray[i - 1]) {
                isSorted = false;
                break;
            }
        }
    }

    function mintTokenIfFirstPledge(bytes32 _hashDigest) private returns (bool tokenWasMinted) {
        if (userAddressToNumberOfPledges[msg.sender] == 1) {
            growToken.mint(_hashDigest, msg.sender);
        }
    }

    function ableToCoverFees(uint _amountPerProof) private returns (bool isEnough) {
        return _amountPerProof >= proofFee;
    }

    function autoApproveProof(bytes32 _proofId, uint _amount) private {
        updateProofState(_proofId, ProofState.Accepted);
        refundProofOwner(_proofId, _amount);
        emit ProofAutoApproved(
            pledgeIdToPledge[proofIdToProof[_proofId].pledgeId].owner,
            _proofId,
            _amount
        );
    }

    function refundProofOwner(bytes32 _proofId, uint _amount) private {
        address pledgeOwner = pledgeIdToPledge[proofIdToProof[_proofId].pledgeId].owner;
        increaseBalance(_amount, pledgeOwner);
    }

    function addToPot(uint _amount) private {
        pot = pot.add(_amount);
        emit PotIncrease(_amount);
    }

    function clearCollateral(bytes32 _proofId) private {
        proofIdToProof[_proofId].collateral = 0;
    }

    function rewardSenderWithProofFee(uint collateral) private returns (uint) {
        increaseBalance(proofFee, msg.sender);
        return collateral.sub(proofFee);
    }
}
