pragma solidity ^0.4.23;
import "./IpfsStorage.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

// constants for expires etc

contract Proof is IpfsStorage {

    // ============
    // EVENTS:
    // ============
    event NewProof(
        address indexed userAddress, 
        bytes32 indexed pledgeId,
        uint index, 
        uint indexInPledge, 
        uint collateral
    );

    event ProofSubmitted(
        address indexed userAddress,
        bytes32 pledgeId,
        bytes32 proofId,
        bytes32 metadata,
        uint indexInPledge
    );

    event ProofStateUpdated(
        address indexed userAddress,
        bytes32 indexed pledgeId,
        bytes32 proofId,
        uint indexInPledge,
        ProofState indexed updatedState
    );

    // ============
    // DATA STRUCTURES:
    // ============
    using SafeMath for uint;
    enum ProofState { Pending, Submitted, Assigned, Accepted, Rejected, Expired }
    // maybe add assigned, maybe optional?
    
    struct ProofStruct {
        MultiHash metadata;
        bytes32 pledgeId;
        uint index;
        uint indexInPledge;
        uint expiresAt;
        uint collateral;
        address reviewer;
        ProofState state;
    }

    // ============
    // STATE VARIABLES:
    // ============
    mapping(bytes32 => ProofStruct) public proofIdToProof;
    // TODO - if this is just for verifying that the proof is real, can use the pledegindex....
    bytes32[] private proofs;  
    mapping(bytes32 => uint) public pledgeIdToNextProofIndex;

    // ============
    // MODIFIERS:
    // ============
    modifier onlyNextProofInOrder(bytes32 _proofId, bytes32 _pledgeId) {
        require(proofIdToProof[_proofId].indexInPledge == pledgeIdToNextProofIndex[_pledgeId]);
        _;
    }

    modifier onlyNotExpired(bytes32 _proofId) {
        require(proofIdToProof[_proofId].expiresAt >= now);
        _;
    }

    modifier onlyExpired(bytes32 _proofId) {
        require(proofIdToProof[_proofId].expiresAt < now);
        _;
    }

    modifier onlyIsProof(bytes32 _proofId) {
        require(isProof(_proofId), "Must be an existing proof");
        _;
    }

    modifier onlyProofState(bytes32 _proofId, ProofState _requiredState) {
        require(proofIdToProof[_proofId].state == _requiredState);
        _;
    }

    modifier onlyReviewer(bytes32 _proofId) {
        require(msg.sender == proofIdToProof[_proofId].reviewer);
        _;
    }

    modifier onlyActiveProof(bytes32 _proofId) {
        require(proofIdToProof[_proofId].state == ProofState.Pending ||
            proofIdToProof[_proofId].state == ProofState.Submitted ||
            proofIdToProof[_proofId].state == ProofState.Assigned
        );
        _;
    }

    /** @dev Creates proof without a metadata hash.
      * @param _pledgeId The id or the pledge the proof is for
      * @param _expiresAt The time of proof expiration
      * @param _collateral The amount in wei that will be forfeit if proof is not completed
      * @param _proofNumberInPledge The index of the pledge in the proof
      * @return proofId The id of the newly created proof
      */
    function createEmptyProof(
        bytes32 _pledgeId, 
        uint _expiresAt,
        uint _collateral,
        uint _proofNumberInPledge
    ) 
        internal 
        returns (bytes32 proofId) 
    {
        proofId = keccak256(abi.encodePacked(_pledgeId, _proofNumberInPledge));

        require(!isProof(proofId), "Proof must not exist");

        proofIdToProof[proofId].pledgeId = _pledgeId;
        proofIdToProof[proofId].expiresAt = _expiresAt;
        proofIdToProof[proofId].index = proofs.push(proofId) - 1;
        proofIdToProof[proofId].indexInPledge = _proofNumberInPledge - 1;
        proofIdToProof[proofId].state = ProofState.Pending;
        proofIdToProof[proofId].collateral = _collateral;

        emit NewProof(
            msg.sender, 
            proofIdToProof[proofId].pledgeId,
            proofIdToProof[proofId].index,
            proofIdToProof[proofId].indexInPledge, 
            proofIdToProof[proofId].collateral
        );

        return proofId;
    }

    /** @dev Submit the metadata for the proof
      * @param _metadata The hash digest of the ipfsHash of the proof photos
      * @param _proofId The id of the proof
      */
    function submitProofDetails(
        bytes32 _metadata,
        bytes32 _proofId
    )
        internal
    {
        bytes32 pledgeId = proofIdToProof[_proofId].pledgeId;

        proofIdToProof[_proofId].metadata = createIpfsMultiHash(_metadata);
        updateProofState(_proofId, ProofState.Submitted);
        proofIdToProof[_proofId].expiresAt = now + 7 days;

        pledgeIdToNextProofIndex[pledgeId]++;

        emit ProofSubmitted(
            msg.sender, 
            pledgeId,
            _proofId,
            proofIdToProof[_proofId].metadata.hashDigest,
            proofIdToProof[_proofId].indexInPledge
        );
    }

    /** @dev Update the ProofState for a proof
      * @param _proofId The id of the proof
      * @param _newState The new ProofState for the proof
      */
    function updateProofState(bytes32 _proofId, ProofState _newState) internal {
        proofIdToProof[_proofId].state = _newState;

        emit ProofStateUpdated(
                 msg.sender, 
                proofIdToProof[_proofId].pledgeId,
                _proofId,
                proofIdToProof[_proofId].indexInPledge,
                _newState          
        );
    }

// make sure need these
    function getProof(
        bytes32 _proofId
    )
        public
        view
        returns(
            bytes32 metadata,
            bytes32 pledgeId,
            uint indexInPledge,
            uint expiresAt,
            uint collateral,
            address reviewer,
            ProofState state
        ) 
    {
        require(isProof(_proofId));

        return (
            proofIdToProof[_proofId].metadata.hashDigest,
            proofIdToProof[_proofId].pledgeId,
            proofIdToProof[_proofId].indexInPledge,
            proofIdToProof[_proofId].expiresAt,
            proofIdToProof[_proofId].collateral,
            proofIdToProof[_proofId].reviewer,
            proofIdToProof[_proofId].state
        );
    }

    function getPledgeIdToLastSubmittedProofIndex(bytes32 _pledgeId) public returns(uint index) {
        return pledgeIdToNextProofIndex[_pledgeId];
    }
// 

    /** @dev Verify that the proofId matches an existing proof
      * @param _proofId The id of the proof
      * @return isIndeed bool for if it is valid
      */
    function isProof(
        bytes32 _proofId
    ) 
        private
        view
        returns(bool isIndeed) 
    {
        if(proofs.length == 0) return false;
        return (proofs[proofIdToProof[_proofId].index] == _proofId);
    }

    /** @dev Verify the state of a proof
      * @param _proofId The id of the proof
      * @param _requiredState The state the proof needs to be in to be valid
      * @return isValidState bool for if is in the correct state
      */
    function hasProofState(bytes32 _proofId, ProofState _requiredState) internal view returns (bool isValidState) {
        return proofIdToProof[_proofId].state == _requiredState;
    }
}
