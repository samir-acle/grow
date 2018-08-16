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
        uint indexInPledge, 
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

    uint public proofFee;
    mapping(bytes32 => ProofStruct) public proofIdToProof;
    // TODO - if this is just for verifying that the proof is real, can use the pledeg....
    bytes32[] private proofs;  

    // uint private pot;

    // ============
    // MODIFIERS:
    // ============
    // TODO - double check where these go

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

    function submitProofDetails(
        bytes32 _metadata,
        bytes32 _proofId
    )
        internal
        onlyProofState(_proofId, ProofState.Pending)
        returns(bool wasSubmitted)
    {
        require(isProof(_proofId), "Must be an existing proof");
        // require(hasProofState(_proofId, ProofState.Pending), "Proof must be pending");

        // what to use instead of now?
        if (now <= proofIdToProof[_proofId].expiresAt) {
            proofIdToProof[_proofId].metadata = createIpfsMultiHash(_metadata);
            proofIdToProof[_proofId].state = ProofState.Submitted;
            //TODO -  make this customizable?
            proofIdToProof[_proofId].expiresAt = now + 7 days;
            wasSubmitted = true;

            // this should be another method, there could also be a self approve, self reject?
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
        return proofIdToProof[_proofId].state == _requiredState;
    }

    modifier onlyProofState(bytes32 _proofId, ProofState _requiredState) {
        ProofState proofState = proofIdToProof[_proofId].state;
        require(proofState == _requiredState);
        _;
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

    // function getProofState(bytes32 _proofId) public view returns(ProofState state) {
    //     require(isProof(_proofId));
    //     return (
    //         proofIdToProof[_proofId].state
    //     );
    // }

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
