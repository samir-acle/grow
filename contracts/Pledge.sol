pragma solidity ^0.4.23;
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "./Proof.sol";

contract Pledge is Pausable, Proof {
    // ============
    // EVENTS:
    // ============
    event NewPledge(address indexed userAddress, uint index, bytes32 ipfsHash);

    // ============
    // DATA STRUCTURES:
    // ============
    using SafeMath for uint;
    enum PledgeState { Active, Completed, Expired }

    struct PledgeStruct {
        bytes32 metadata;
        uint index;
        address owner;
        PledgeState state;
        bytes32[] proofs;
    }
    // ============
    // STATE VARIABLES:
    // ============
    mapping(bytes32 => PledgeStruct) public pledgeIdToPledge;
    bytes32[] private pledges;
    mapping(address => uint) public userAddressToNumberOfPledges;

    // ============
    // MODIFIERS:
    // ============
    modifier onlyIsPledge(bytes32 _pledgeId) {
        require(isPledge(_pledgeId), "Pledge must exist");
        _;
    }

    modifier onlyPledgeOwner(bytes32 _pledgeId) {
        require(msg.sender == pledgeIdToPledge[_pledgeId].owner);
        _;
    }

    modifier onlyNotPledgeOwner(bytes32 _pledgeId) {
        require(msg.sender != pledgeIdToPledge[_pledgeId].owner);
        _;
    }

    modifier onlyAssociatedProofsAndPledge(bytes32 _proofId, bytes32 _pledgeId) {
        require(proofMatchesPledge(_proofId, _pledgeId), "Proof must be associated with the Pledge");
        _;
    }

    modifier onlyPledgeState(bytes32 _pledgeId, PledgeState state) {
        require(hasPledgeState(_pledgeId, state));
        _;
    }

    modifier onlyIfPreviousProofNotPending(bytes32 _pledgeId) {
        require(previousProofIsNotPending(_pledgeId));
        _;
    }

    modifier onlyCurrentProofOrBefore(bytes32 _proofId) {
        uint currentProofIndex = pledgeIdToNextProofIndex[proofIdToProof[_proofId].pledgeId];
        require(proofIdToProof[_proofId].indexInPledge <= currentProofIndex);
        _;
    }

    function isPledgeOwner(bytes32 _pledgeId) internal returns (bool isOwner) {
        return msg.sender == pledgeIdToPledge[_pledgeId].owner;
    }

    function proofMatchesPledge(bytes32 _proofId, bytes32 _pledgeId) private returns (bool isValid) {
        return proofIdToProof[_proofId].pledgeId == _pledgeId;
    }

    function hasPledgeState(bytes32 _pledgeId, PledgeState _requiredState) internal returns (bool isValidState) {
        return pledgeIdToPledge[_pledgeId].state == _requiredState;
    }

    function getPledge(bytes32 _pledgeId)
        public 
        view
        onlyIsPledge(_pledgeId)
        returns(
            bytes32 metadata,
            uint index,
            address owner,
            PledgeState pledgeState,
            bytes32[] proofs,
            uint numOfProofs
        )
    {
        return (
            pledgeIdToPledge[_pledgeId].metadata,
            pledgeIdToPledge[_pledgeId].index,
            pledgeIdToPledge[_pledgeId].owner,
            pledgeIdToPledge[_pledgeId].state,
            pledgeIdToPledge[_pledgeId].proofs,
            pledgeIdToPledge[_pledgeId].proofs.length      
        );
    }

    function createPledge(
        bytes32 _ipfsHash,
        uint _numOfProofs
    ) 
        internal 
        returns(bytes32 pledgeId)
    {
        pledgeId = keccak256(abi.encodePacked(msg.sender, userAddressToNumberOfPledges[msg.sender].add(1)));

        require(!isPledge(pledgeId), "Pledge must not already exist");

        pledgeIdToPledge[pledgeId].metadata = _ipfsHash;
        pledgeIdToPledge[pledgeId].index = pledges.push(pledgeId).sub(1);
        pledgeIdToPledge[pledgeId].owner = msg.sender;
        pledgeIdToPledge[pledgeId].state = PledgeState.Active;
        pledgeIdToPledge[pledgeId].proofs = new bytes32[](_numOfProofs);

        userAddressToNumberOfPledges[msg.sender] = userAddressToNumberOfPledges[msg.sender].add(1);
        // can inline this above

        emit NewPledge(msg.sender, pledgeIdToPledge[pledgeId].index, _ipfsHash);
        return pledgeId;
    }

    function isPledge(bytes32 _pledgeId)
        private 
        view
        returns(bool isIndeed) 
    {
        if (pledges.length == 0) return false;
        return (pledges[pledgeIdToPledge[_pledgeId].index] == _pledgeId);
    }

    function getPledgeCount() 
        public
        view
        returns(uint count)
    {
        return pledges.length;
    }

    function getPledgeAtIndex(uint index)
        public
        view
        returns(bytes32 pledgeId)
    {
        return pledges[index];
    }

    function previousProofIsNotPending(bytes32 _pledgeId) internal returns (bool wasCompleted) {
        if (pledgeIdToNextProofIndex[_pledgeId] > 0) {
            uint lastProofIndex = pledgeIdToNextProofIndex[_pledgeId].sub(1);
            bytes32 lastProofId = pledgeIdToPledge[_pledgeId].proofs[lastProofIndex];
            return proofIdToProof[lastProofId].state != ProofState.Pending;
        } else {
            return true;
        }
    }
}



// As pledge owner, I need see my active pledges
// As pledge owner, I need submit proof for each pledge
// As a pledge owner, I need to dispute rejected? proofs
// As 

// As a pledge owner, I need to stake my tokens?
// choose one and submit a proof (assume know proofId)

// if ordered double linked list then what does that buy? 
