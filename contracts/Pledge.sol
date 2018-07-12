pragma solidity ^0.4.23;
import "./Proof.sol";

contract Pledge is Proof {

    struct PledgeStruct {
        uint expiresAt;  //timestamp 
        uint expectedNumberOfActions; // make certain number of bytes
        bytes32 title;  // lookup bytes vs string and how it compares
        string metadata;
        uint collateral; 
        uint index;
        uint cadence;
    }

    mapping(bytes32 => PledgeStruct) private pledgeIdToPledge;
    mapping(address => uint) private userAddressToNumberOfPledges;
    address[] private pledges;

    event NewPledge(address indexed userAddress, uint index, bytes32 title);

     modifier onlyPledgeOwner(uint pledgeIndex) 
    {
        require(
            msg.sender == pledges[pledgeIndex],
            "Sender not authorized."
        );
        _;
    }

// maybe have different modifiers for each condition?
    modifier onlyValidPledges(uint expiresAt, uint numberOfActions)
    {
        _;
    }

    function createPledge(
        uint _expiresAt,
        uint _expectedNumberOfActions,
        bytes32 _title,
        string _metadata
    ) 
        public 
        payable
        onlyValidPledges(_expiresAt, _expectedNumberOfActions) 
        returns(uint index)
    {
        // TODO - rethink pledge id stuff and do I need pledges array - will grwo indefinitely?
        // maybe id should be hash of title and expiresat, and sender?
        bytes32 pledgeId = keccak256(msg.sender, "pledge", _title, _expiresAt);

        // check if already exists

        pledgeIdToPledge[pledgeId].expiresAt = _expiresAt;
        pledgeIdToPledge[pledgeId].expectedNumberOfActions = _expectedNumberOfActions;
        pledgeIdToPledge[pledgeId].title = _title;
        pledgeIdToPledge[pledgeId].metadata = _metadata;
        pledgeIdToPledge[pledgeId].collateral = msg.value;
        pledgeIdToPledge[pledgeId].index = pledges.push(msg.sender) - 1;

        emit NewPledge(msg.sender, pledgeIdToPledge[pledgeId].index, _title);
        return pledges.length - 1;
    }

    function submitProof(
        string _metadata,
        bytes32 _proofId
    ) 
        public
        onlyPledgeOwner(_pledgeId)
        returns(uint index)
    {
        Pledge memory pledge = plegeIdToNumberOfProofs[keccak256(msg.sender, "pledge", )]
        bytes32 proofId = keccak256(msg.sender, "proof", _pledgeId, )
    }
}



// As pledge owner, I am going to need to be able to see my active pledges
// choose one and submit a proof (assume know proofId)

// if ordered double linked list then what does that buy? 
