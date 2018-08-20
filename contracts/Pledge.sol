pragma solidity ^0.4.23;
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "./IpfsStorage.sol";
import "./Proof.sol";

contract Pledge is Pausable, IpfsStorage, Proof {
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
        MultiHash metadata;
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

    modifier onlyIfPreviousProofComplete(bytes32 _pledgeId) {
        if (pledgeIdToNextProofIndex[_pledgeId] > 0) {
            uint lastProofIndex = pledgeIdToNextProofIndex[_pledgeId].sub(1);
            bytes32 lastProofId = pledgeIdToPledge[_pledgeId].proofs[lastProofIndex];
            ProofState lastProofState = proofIdToProof[lastProofId].state;
            require(lastProofState == ProofState.Accepted ||
                lastProofState == ProofState.Rejected ||
                lastProofState == ProofState.Expired);
        }
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
            bytes32 metadataHash,
            uint index,
            address owner,
            PledgeState pledgeState,
            bytes32[] proofs,
            uint numOfProofs
        )
    {
        uint size = pledgeIdToPledge[_pledgeId].proofs.length;

        return (
            pledgeIdToPledge[_pledgeId].metadata.hashDigest,
            pledgeIdToPledge[_pledgeId].index,
            pledgeIdToPledge[_pledgeId].owner,
            pledgeIdToPledge[_pledgeId].state,
            pledgeIdToPledge[_pledgeId].proofs,
            size        
        );
    }

    function createPledge(
        bytes32 _ipfsHash,
        uint _numOfProofs
    ) 
        internal 
        returns(bytes32 pledgeId)
    {
        pledgeId = keccak256(abi.encodePacked(msg.sender, userAddressToNumberOfPledges[msg.sender] + 1));

        require(!isPledge(pledgeId), "Pledge must not already exist");

        pledgeIdToPledge[pledgeId].metadata = createIpfsMultiHash(_ipfsHash);
        pledgeIdToPledge[pledgeId].index = pledges.push(pledgeId) - 1;
        pledgeIdToPledge[pledgeId].owner = msg.sender;
        pledgeIdToPledge[pledgeId].state = PledgeState.Active;
        pledgeIdToPledge[pledgeId].proofs = new bytes32[](_numOfProofs);

        userAddressToNumberOfPledges[msg.sender]++;
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
}



// As pledge owner, I need see my active pledges
// As pledge owner, I need submit proof for each pledge
// As a pledge owner, I need to dispute rejected? proofs
// As 

// As a pledge owner, I need to stake my tokens?
// choose one and submit a proof (assume know proofId)

// if ordered double linked list then what does that buy? 
