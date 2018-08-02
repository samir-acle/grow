pragma solidity ^0.4.23;
import "./Proof.sol";

contract Pledge {

// not done yet
    enum PledgeState { Active, Completed, Expired }

    struct PledgeStruct {
        uint startTime;
        uint expiresAt;  //timestamp 
        uint numberOfProofs; // make certain number of bytes
        bytes32 title;  // lookup bytes vs string and how it compares
        string detailsHash;
        uint collateral;
        uint index;
        address owner;
        PledgeState state;
    }

    // TODO - mapping to mapping for pledges you need to proof?

    mapping(bytes32 => PledgeStruct) internal pledgeIdToPledge;
    bytes32[] private pledges;

    mapping(address => uint) public userAddressToNumberOfPledges;

    event NewPledge(address indexed userAddress, uint index, bytes32 title);
    // event PldegeStateChange(address indexed userAddress, )

    modifier onlyPledgeOwner(bytes32 _pledgeId) 
    {
        require(
            msg.sender == pledgeIdToPledge[_pledgeId].owner,
            "Sender not authorized."
        );
        _;
    }

// maybe have different modifiers for each condition?
// if using parameters is it better as function?
    modifier onlyValidPledges(uint _expiresAt, uint _numberOfProofs)
    {
        _;
    }

    modifier checkExpiry(bytes32 _pledgeId) {
        // don't expire if have pending proofs

        if(pledgeIdToPledge[_pledgeId].expiresAt <= now) {
            pledgeIdToPledge[_pledgeId].state = PledgeState.Expired;
        }
        _;
    }

    modifier hasState(PledgeState _requiredState, PledgeState _actualState) {
        require(
            _actualState == _requiredState,
            "Function cannot be called at this time."
        );
        _;
    }

    function isPledge(bytes32 _pledgeId)
        private 
        view
        returns(bool isIndeed) 
    {
        if(pledges.length == 0) return false;
        return (pledges[pledgeIdToPledge[_pledgeId].index] == _pledgeId);
    }

    function createPledge(
        uint _expiresAt,
        uint _numberOfProofs,
        bytes32 _title,
        string _detailsHash,
        uint _collateral
    ) 
        internal 
        onlyValidPledges(_expiresAt, _numberOfProofs) 
        returns(uint index)
    {
        // TODO - rethink pledge id stuff and do I need pledges array - will grwo indefinitely?
        bytes32 pledgeId = keccak256(abi.encodePacked(msg.sender, userAddressToNumberOfPledges[msg.sender] + 1));

        require(!isPledge(pledgeId));

        pledgeIdToPledge[pledgeId].expiresAt = _expiresAt;
        pledgeIdToPledge[pledgeId].numberOfProofs = _numberOfProofs;
        pledgeIdToPledge[pledgeId].title = _title;
        pledgeIdToPledge[pledgeId].detailsHash = _detailsHash;
        pledgeIdToPledge[pledgeId].collateral = _collateral; 
        pledgeIdToPledge[pledgeId].index = pledges.push(pledgeId) - 1;
        pledgeIdToPledge[pledgeId].owner = msg.sender;

        userAddressToNumberOfPledges[msg.sender]++;

        emit NewPledge(msg.sender, pledgeIdToPledge[pledgeId].index, _title);
        return pledges.length - 1;
    }

    function getPledge(bytes32 _pledgeId)
        public 
        view
        returns( 
            address owner,
            uint startTime,
            uint expiresAt,  
            uint numberOfProofs,
            bytes32 title,
            string detailsHash,
            uint collateral
        )
    {
        require(isPledge(_pledgeId));

        return (
            pledgeIdToPledge[_pledgeId].owner,
            pledgeIdToPledge[_pledgeId].startTime,
            pledgeIdToPledge[_pledgeId].expiresAt,
            pledgeIdToPledge[_pledgeId].numberOfProofs,
            pledgeIdToPledge[_pledgeId].title,
            pledgeIdToPledge[_pledgeId].detailsHash,
            pledgeIdToPledge[_pledgeId].collateral
        );
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
