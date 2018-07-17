pragma solidity ^0.4.23;

// constants for expires etc

contract Proof {

    event NewProof(
        address indexed userAddress, 
        uint index, 
        string imageHash,
        bool approved,
        uint submitTime,
        ProofState state,
        bytes32 indexed pledgeId
        // address indexed reviewer
    );

    enum ProofState { Pending, Accepted, Rejected }
    
    struct ProofStruct {
        string imageHash;
        bool approved;
        uint index;
        uint submitTime;
        bytes32 pledgeId;
        ProofState state;
        address reviewer;
    }

    mapping(bytes32 => ProofStruct) private proofIdToProof;
    bytes32[] private proofs;

    mapping(bytes32 => uint) private pledgeIdToNumberOfSubmittedProofs;

    // mapping(address => uint[]) private reviewerToPendingProofs;
    // mapping(address => uint[]) private reviewerToReviewedProofs;

    //  TODO - check address has user account before assigning as reviwer
    // maybe reviewer is in array instead?  
    // TODO - verify checking that not 0x0 for all address checks?
    modifier onlyReviewer(bytes32 _proofId) {
        require(msg.sender == proofIdToProof[_proofId].reviewer);
        _;
    }

    modifier onlyProofState(ProofState _requiredState, bytes32 _proofId) {
        require(proofIdToProof[_proofId].state == _requiredState);
        _;
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

    function createProof(
        string _imageHash,
        bytes32 _pledgeId
    )
        internal
        returns(uint index)
    {
        bytes32 proofId = keccak256(msg.sender, pledgeIdToNumberOfSubmittedProofs[_pledgeId] + 1);

        require(!isProof(proofId));

        proofIdToProof[proofId].imageHash = _imageHash;
        proofIdToProof[proofId].submitTime = now;
        proofIdToProof[proofId].pledgeId = _pledgeId;
        proofIdToProof[proofId].state = ProofState.Pending;
        proofIdToProof[proofId].index = proofs.push(proofId) - 1;

        pledgeIdToNumberOfSubmittedProofs[_pledgeId]++;

        emit NewProof(
            msg.sender, 
            proofIdToProof[proofId].index, 
            proofIdToProof[proofId].imageHash,
            proofIdToProof[proofId].approved,
            proofIdToProof[proofId].submitTime,
            proofIdToProof[proofId].state,
            proofIdToProof[proofId].pledgeId
        );

        return proofIdToProof[proofId].index;
    }

    function getProof(
        bytes32 _proofId
    )
        public
        view
        returns(
            string imageHash,
            bool approved,
            uint index,
            uint submitTime,
            bytes32 pledgeId,
            ProofState state
        ) 
    {
        require(isProof(_proofId));
        return (
            proofIdToProof[_proofId].imageHash,
            proofIdToProof[_proofId].approved,
            proofIdToProof[_proofId].index,
            proofIdToProof[_proofId].submitTime,
            proofIdToProof[_proofId].pledgeId,
            proofIdToProof[_proofId].state
        );
    }

    function getTotalProofCount()
        public
        view
        returns(uint count)
    {
        return proofs.length;
    }

    function getProofAtIndex(
        uint _proofIndex
    )
        public
        view
        returns(bytes32 proofId)
    {
        return proofs[_proofIndex];
    }
}
