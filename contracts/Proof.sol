pragma solidity ^0.4.23;
import "./IpfsStorage.sol";

// constants for expires etc

contract Proof is IpfsStorage {

    // ============
    // EVENTS:
    // ============
    event NewProof(
        address indexed userAddress, 
        bytes32 indexed pledgeId,
        uint index, 
        uint collateral
    );

    event ProofSubmitted(
        address indexed userAddress,
        bytes32 indexed pledgeId,
        bytes32 proofId,
        bytes32 metadata
    );

    event ProofExpired(
        address indexed userAddress,
        bytes32 indexed pledgeId,
        bytes32 proofId
    );

    // ============
    // DATA STRUCTURES:
    // ============
    enum ProofState { Pending, Submitted, Accepted, Rejected, Expired }
    
    struct ProofStruct {
        MultiHash metadata;
        bytes32 pledgeId;
        uint index;
        uint expiresAt;
        uint collateral;
        address reviewer;
        ProofState state;

    }

    // ============
    // STATE VARIABLES:
    // ============

    uint public proofFee;
    mapping(bytes32 => ProofStruct) public proofIdToProof;
    bytes32[] private proofs;

    // uint private pot;

    // ============
    // MODIFIERS:
    // ============
    // TODO - double check where these go

    function createEmptyProof(
        bytes32 _pledgeId, 
        uint _expiresAt,
        uint _collateral
    ) 
        internal 
        returns (bytes32 proofId) 
    {
        // change this id
        proofId = keccak256(abi.encodePacked(msg.sender, proofs.length + 1));

        require(!isProof(proofId), "Proof must not exist");

        proofIdToProof[proofId].pledgeId = _pledgeId;
        proofIdToProof[proofId].expiresAt = _expiresAt;
        proofIdToProof[proofId].index = proofs.push(proofId) - 1;
        proofIdToProof[proofId].state = ProofState.Pending;
        proofIdToProof[proofId].collateral = _collateral;

        emit NewProof(
            msg.sender, 
            proofIdToProof[proofId].pledgeId,
            proofIdToProof[proofId].index, 
            proofIdToProof[proofId].collateral
        );

        return proofId;
    }

    function submitProofDetails(
        bytes32 _metadata,
        bytes32 _proofId
    )
        internal
        returns(bool wasSubmitted)
    {
        require(isProof(_proofId), "Must be an existing proof");
        require(hasProofState(_proofId, ProofState.Pending), "Proof must be pending");

        // what to use instead of now?
        if (now <= proofIdToProof[_proofId].expiresAt) {
            proofIdToProof[_proofId].metadata = createIpfsMultiHash(_metadata);
            proofIdToProof[_proofId].state = ProofState.Submitted;
            wasSubmitted = true;

            // call staking contract to get size of stakers
            // get random number from oracle
            // lock stake for address at random number
            // assign review to proof
            // set new expiration date

            emit ProofSubmitted(
                msg.sender, 
                proofIdToProof[_proofId].pledgeId,
                _proofId,
                proofIdToProof[_proofId].metadata.hashDigest
            );
        } else {
            proofIdToProof[_proofId].state = ProofState.Expired;
            wasSubmitted = false;

            emit ProofExpired(
                msg.sender, 
                proofIdToProof[_proofId].pledgeId,
                _proofId
            );
        }
    }


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

    function hasProofState(bytes32 _proofId, ProofState _requiredState) internal view returns (bool isValidState) {
        require(proofIdToProof[_proofId].state == _requiredState);
    }
    // mapping(address => uint[]) private reviewerToPendingProofs;
    // mapping(address => uint[]) private reviewerToReviewedProofs;

    //  TODO - check address has user account before assigning as reviwer
    // maybe reviewer is in array instead?  
    // TODO - verify checking that not 0x0 for all address checks?
    modifier onlyReviewer(bytes32 _proofId) {
        require(msg.sender == proofIdToProof[_proofId].reviewer);
        _;
    }

    function getProof(
        bytes32 _proofId
    )
        public
        view
        returns(
            bytes32 metadata,
            bytes32 pledgeId,
            uint index,
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
            proofIdToProof[_proofId].index,
            proofIdToProof[_proofId].expiresAt,
            proofIdToProof[_proofId].collateral,
            proofIdToProof[_proofId].reviewer,
            proofIdToProof[_proofId].state
        );
    }

    // function getTotalProofCount()
    //     public
    //     view
    //     returns(uint count)
    // {
    //     return proofs.length;
    // }

    // function getProofAtIndex(
    //     uint _proofIndex
    // )
    //     public
    //     view
    //     returns(bytes32 proofId)
    // {
    //     return proofs[_proofIndex];
    // }
}
