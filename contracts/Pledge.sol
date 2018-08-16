pragma solidity ^0.4.23;
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "./IpfsStorage.sol";
import "./Proof.sol";

contract Pledge is Pausable, IpfsStorage, Proof {

// TODO - figure out uints and placement in structs
// not done yet
    enum PledgeState { Active, Completed, Expired }

    // enum ProofState { Pending, Accepted, Rejected }
    
// TODO - compare gas costs of using Multihash vs saving bytes32 without begining

    // struct ProofStruct {
    //     MultiHash ipfsHash;
    //     bool approved;
    //     uint index;
    //     uint submitTime;
    //     bytes32 pledgeId;
    //     ProofState state;
    //     address reviewer;
    // }

    struct PledgeStruct {
        // uint startTime;  this doesnt really matter?
        // uint expiresAt;  this is last proof expiration time
        MultiHash metadata;
        uint index;
        // check if this should start at 0 or 1
        address owner;
        PledgeState state;
        bytes32[] proofs;
    }

    // should proofs be more intertwined with pledges?
    // create proof structs when create pledge?  or is that extra gas cost that is uneeded?  - in the case pledge is canceld
    // or maybe just ids

    // separate contract for the whole approving thing

    // TODO - mapping to mapping for pledges you need to proof?

    mapping(bytes32 => PledgeStruct) public pledgeIdToPledge;
    bytes32[] private pledges;

    mapping(address => uint) public userAddressToNumberOfPledges;

    // toDO - might not need this
    mapping(bytes32 => uint) internal pledgeIdToLastSubmittedProofIndex;

    event NewPledge(address indexed userAddress, uint index, bytes32 ipfsHash);
    // event PldegeStateChange(address indexed userAddress, )

    // modifier onlyPledgeOwner(bytes32 _pledgeId) 
    // {
    //     require(
    //         msg.sender == pledgeIdToPledge[_pledgeId].owner,
    //         "Sender not authorized."
    //     );
    //     _;
    // }

    function isPledgeOwner(bytes32 _pledgeId) internal returns (bool isOwner) {
        return msg.sender == pledgeIdToPledge[_pledgeId].owner;
    }

// maybe have different modifiers for each condition?
// if using parameters is it better as function?
    modifier onlyValidPledges(uint _expiresAt, uint _numberOfProofs)
    {
        _;
    }

    modifier checkExpiry(bytes32 _pledgeId) {
        // don't expire if have pending proofs

        // if(pledgeIdToPledge[_pledgeId].expiresAt <= now) {
        //     pledgeIdToPledge[_pledgeId].state = PledgeState.Expired;
        // }
        _;
    }

    // modifier hasState(PledgeState _requiredState, bytes32 _pledgeId) {
    //     require(
    //         pledgeIdToPledge[_pledgeId].state == _requiredState,
    //         "Pledge is not in the correct state"
    //     );
    //     _;
    // }

    function hasPledgeState(bytes32 _pledgeId, PledgeState _requiredState) internal returns (bool isValidState) {
        return pledgeIdToPledge[_pledgeId].state == _requiredState;
    }


// came back with 3   but 2 are empty...
    function getPledge(bytes32 _pledgeId)
        public 
        view
        returns(
            bytes32 metadataHash,
            uint index,
            address owner,
            PledgeState pledgeState,
            bytes32[] proofs,
            uint numOfProofs
        )
    {
        require(isPledge(_pledgeId), "Pledge must exist");

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
