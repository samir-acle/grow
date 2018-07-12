pragma solidity ^0.4.23;

contract Proof {

    event NewProof(address indexed userAddress, uint index, string metadata);

    enum ProofState { Pending, Accepted, Rejected, Disputed }
    
    struct ProofStruct {
        string metadata;
        bool approved;
        uint index;
        uint expiresAt;
    }

    mapping(bytes32 => uint) private plegeIdToNumberOfProofs;
    mapping(bytes32 => ProofStruct) private proofIdToProof;

    mapping(address => uint[]) private reviewerToPendingProofs;
    mapping(address => uint[]) private reviewerToReviewedProofs;

    bytes32[] private proofs;
}
