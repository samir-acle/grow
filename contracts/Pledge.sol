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
        require(msg.sender == pledgeIdToPledge[_pledgeId].owner, "Sender must be the owner of the pledge");
        _;
    }

    modifier onlyNotPledgeOwner(bytes32 _pledgeId) {
        require(msg.sender != pledgeIdToPledge[_pledgeId].owner, "Sender must not be the owner of the pledge");
        _;
    }

    modifier onlyAssociatedProofsAndPledge(bytes32 _proofId, bytes32 _pledgeId) {
        require(proofMatchesPledge(_proofId, _pledgeId), "Proof must be associated with the Pledge");
        _;
    }

    modifier onlyPledgeState(bytes32 _pledgeId, PledgeState state) {
        require(hasPledgeState(_pledgeId, state), "The pledge is in the wrong state to complete this action");
        _;
    }

    modifier onlyIfPreviousProofNotPending(bytes32 _pledgeId) {
        require(previousProofIsNotPending(_pledgeId), "The previous proof must be submitted or expired first");
        _;
    }

    modifier onlyCurrentProofOrBefore(bytes32 _proofId) {
        uint currentProofIndex = pledgeIdToNextProofIndex[proofIdToProof[_proofId].pledgeId];
        require(proofIdToProof[_proofId].indexInPledge <= currentProofIndex, "Proofs must be submitted in order");
        _;
    }

    /** @dev Get details for a pledge.
      * @param _pledgeId The pledgeId to return details for
      */
    function getPledge(bytes32 _pledgeId)
        external 
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


    /** @dev Get the total number of pledges
      */
    function getPledgeCount() 
        external
        view
        returns(uint count)
    {
        return pledges.length;
    }

    /** @dev Get the pledgeId that is at the index in the pledges array
      * @param _index Index of the pledge in the pledges array
      */
    function getPledgeAtIndex(uint _index)
        external
        view
        returns(bytes32 pledgeId)
    {
        return pledges[_index];
    }

    /** @dev Create a pledge and initialize proofs array.
      * @param _ipfsHash The ipfsHash for the pledge details
      * @param _numOfProofs The number of proofs in the pledge
      */
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

        emit NewPledge(msg.sender, pledgeIdToPledge[pledgeId].index, _ipfsHash);
        return pledgeId;
    }

    /** @dev Return true if the previous proof for the pledge has not beed submitted or expired
      * @param _pledgeId The pledge id
      */
    function previousProofIsNotPending(bytes32 _pledgeId) internal view returns (bool wasCompleted) {
        if (pledgeIdToNextProofIndex[_pledgeId] > 0) {
            uint lastProofIndex = pledgeIdToNextProofIndex[_pledgeId].sub(1);
            bytes32 lastProofId = pledgeIdToPledge[_pledgeId].proofs[lastProofIndex];
            return proofIdToProof[lastProofId].state != ProofState.Pending;
        } else {
            return true;
        }
    }

    /** @dev Check if sender is pledgeOwner
      * @param _pledgeId The pledge id
      */
    function isPledgeOwner(bytes32 _pledgeId) internal view returns (bool isOwner) {
        return msg.sender == pledgeIdToPledge[_pledgeId].owner;
    }

    /** @dev Return true if pledge is in the state provided
      * @param _requiredState The PledgeState
      * @param _pledgeId The pledge id
      */
    function hasPledgeState(bytes32 _pledgeId, PledgeState _requiredState) internal view returns (bool isValidState) {
        return pledgeIdToPledge[_pledgeId].state == _requiredState;
    }

    /** @dev Check if plegde already exists with the id
      * @param _pledgeId The pledge id
      */
    function isPledge(bytes32 _pledgeId)
        private 
        view
        returns(bool isIndeed) 
    {
        if (pledges.length == 0) return false;
        return (pledges[pledgeIdToPledge[_pledgeId].index] == _pledgeId);
    }

    /** @dev Check if proof is a part of the pledge
      * @param _proofId The proof id
      * @param _pledgeId The pledge id
      */
    function proofMatchesPledge(bytes32 _proofId, bytes32 _pledgeId) private view returns (bool isValid) {
        return proofIdToProof[_proofId].pledgeId == _pledgeId;
    }
}
