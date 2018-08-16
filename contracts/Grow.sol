pragma solidity ^0.4.23;
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Proof.sol";
import "./Pledge.sol";
import "./UserAccount.sol";
import "./GrowToken.sol";

/** @title Grow. */
contract Grow is Pausable, UserAccount, Proof, Pledge {

    // ============
    // EVENTS:
    // ============
    event ProofFeeUpdated(address indexed ownerAddress, uint newProofFee);
    event GrowTokenUpdated(address indexed ownerAddress, address growTokenAddress);

    // ============
    // DATA STRUCTURES:
    // ============

    using SafeMath for uint;

    // ============
    // STATE VARIABLES:
    // ============

    uint public proofFee;
    uint private pot;
    GrowToken private growToken;

    // ============
    // MODIFIERS:
    // ============
    // TODO - double check where these go


    //  TODO -  should this be percentage of collateral?  Probs because reviewer is risking more and putting more away and losing potential gains
    // 10 finney for now...
    // definitely should be adjusted based on gas price/cost of approving (rather than price of total collateral)

    constructor (uint _proofFee, address _growTokenAddress) public {
        growToken = GrowToken(_growTokenAddress);
        proofFee = _proofFee;
    }

    /** @dev Sets the growToken contract address. Only owner is authorized.
        * @param _address The address of the grow token contract to use.
        */
    function setGrowToken(address _address) public onlyOwner {
        growToken = GrowToken(_address);
        emit GrowTokenUpdated(msg.sender, _address);
    }

    /** @dev Sets the proofFee. Only owner is authorized.
        * @param _proofFee The new proof fee in wei.
        */
    function setProofFee(uint _proofFee) public onlyOwner {
        proofFee = _proofFee;
        emit ProofFeeUpdated(msg.sender, _proofFee);
    }

    /** @dev Creates a pledge and proofs.
      * @param _proofExpirations The expiration date for each proof. Needs to be sorted in ascending order.
      * @param _hashDigest The ipfs hash minus the function and size.
      * @return pledgeIndex The index in the pledges array` of the created pledge.
      */
    function initPledge(
        uint[] _proofExpirations,
        bytes32 _hashDigest
    )
        public
        payable
        returns(bytes32 pledgeId)
    {
        uint numOfProofs = _proofExpirations.length;
        uint collateralPerProof = msg.value.div(numOfProofs);

        require(
            ableToCoverFees(collateralPerProof), 
            "Must have enought collateral to cover fees"
        );
        require(
            inAscendingOrder(_proofExpirations), 
            "Proof expirations must be sorted with soonest expiration first"
        );

        // should mayeb add total to pledge
        // remainder will be added to the pot? which lives where probably here 

        pledgeId = createPledge(_hashDigest, numOfProofs);
        createEmptyProofs(pledgeId, _proofExpirations, collateralPerProof);
        mintTokenIfFirstPledge(_hashDigest);
        return pledgeId;
    }

    /** @dev Submits proof details for a proof.
      * @param _ipfsHash The hash where pictures for proof are stored in ipfs.
      * @param _pledgeId The pledgeId associated with the proof
      * @param _proofId The id of the proof that is being submitted
      * @return proofIndex The last submitted index for the pledge..
      */
    function submitProof(
        bytes32 _ipfsHash,
        bytes32 _pledgeId,
        bytes32 _proofId
    )
        public
        returns(uint proofIndex)
    {
        // TODO - rethink whether should be modifiers or requires..
        require(isPledgeOwner(_pledgeId), "Must be owner of the pledge");
        require(proofMatchesPledge(_proofId, _pledgeId), "Proof must be associated with the Pledge");
        require(hasPledgeState(_pledgeId, PledgeState.Active));

        submitProofDetails(_ipfsHash, _proofId);
        return ++pledgeIdToLastSubmittedProofIndex[_pledgeId];
    }

// is it better to have one accept that will, based on state, require different things?
// if submitted, requires to be reviewer
// if expired, requires to be owner

    function acceptExpiredProofReview(
        bytes32 _proofId,
        bytes32 _pledgeId
    )
        public
        returns(uint proofIndex)
    {
        require(isPledgeOwner(_pledgeId), "Must be owner of the pledge");
        require(proofMatchesPledge(_proofId, _pledgeId), "Proof must be associated with the Pledge");
        require(hasProofState(_pledgeId, ProofState.Expired));
    }

    function createEmptyProofs(
        bytes32 _pledgeId, 
        uint[] _proofExpirations, 
        uint _collateralPerProof
    ) 
        private 
    {
        bytes32[] storage proofs = pledgeIdToPledge[_pledgeId].proofs;

        for (uint i = 0; i < _proofExpirations.length; i++) {
            bytes32 proofId = createEmptyProof(_pledgeId, _proofExpirations[i], _collateralPerProof, i + 1);
            proofs[i] = proofId;
        }
    }

// this could be in a library?
// is there better way to do this so dont have to loop?
    function inAscendingOrder(uint[] numberArray) private returns (bool isSorted) {
        isSorted = true;

        for (uint i = 1; i < numberArray.length; i++) {
            if (numberArray[i] < numberArray[i - 1]) {
                isSorted = false;
                break;
            }
        }
    }

    function ableToCoverFees(uint _amount) private returns (bool isEnough) {
        return _amount > proofFee;
    }

    function proofMatchesPledge(bytes32 _proofId, bytes32 _pledgeId) private returns (bool isValid) {
        return proofIdToProof[_proofId].pledgeId == _pledgeId;
    }

    function mintTokenIfFirstPledge(bytes32 _hashDigest) private returns (bool tokenWasMinted) {
        if (userAddressToNumberOfPledges[msg.sender] == 1) {
            growToken.mint(_hashDigest, msg.sender);
        }
    }
}
    // ABOVE THIS IS TESTED AND SHOULD FOLLOW STYLE GUIDE!!

//     function createToken(uint _proofFee)
//        public
//     {
//         proofFee = _proofFee;
//     }

// //  should this be a modifier or private function or just require at beginning?
// // or should it be calculared off chain
//     function verifyAvailableFunds(address _userAddress, uint _amount)
//         private
//         view
//         returns (bool hasFunds)
//     {
//         // TODO -safe math 
//         return addressToUserAccount[_userAddress].availableDeposits >= _amount;
//     }

//     function verifyLockedFunds(address _userAddress, uint amount)
//         private
//         view
//         returns (bool hasFunds)
//     {
//         return addressToUserAccount[_userAddress].lockedDeposits >= amount;
//     }


//     modifier verifyPot(uint amount) {
//         // require(this.balance >= amount);
//         _;
//     }


//     function submitProof(
//         string _imageHash,
//         bytes32 _pledgeId
//     )
//         public
//         onlyPledgeOwner(_pledgeId)
//         // verifyProofCount(_pledgeId)
//         returns(uint proofIndex)
//     {
//         // probs make msg.sender in private function
//         // require(verifyLockedFunds(msg.sender, pledgeIdToPledge[_pledgeId].collateral + proofFee) == true);
//         uint newProofIndex = createProof(_imageHash, _pledgeId);

//         // TODO - maybe not needed
//         // pledgeIdToPledge[_pledgeId].hasPendingProof = true;

//         // if has locked funds use them
//         // if has available funds lock them
//         // or else throw

//         // lockDepositForProof(_pledgeId);
//         transferIntoPot(proofFee, msg.sender);
//         return newProofIndex;
//     }

//     function approveProof(
//         bytes32 _proofId
//     )
//         public
//         onlyReviewer(_proofId)
//         onlyProofState(_proofId, ProofState.Pending)
//         // returns()
//     {
//         // require(verifyAvailableFunds(msg.sender, pledgeIdToPledge[proofIdToProof[_proofId].pledgeId].collateral) == true);
//         // TODO - move this into CRUD update functionality?
//         lockDepositForProof(msg.sender, proofIdToProof[_proofId].pledgeId);
//         proofIdToProof[_proofId].state = ProofState.Accepted;

//     //     Reviewer gets portion of pot
//     //     Reviewer approves - both pledger and reviewer get their deposits back.
//     //     Reviewer rejects - pledger's deposit split between pot
//     }

//     function rejectProof(
//         bytes32 _proofId
//     )
//         public
//         onlyReviewer(_proofId)
//         onlyProofState(_proofId, ProofState.Pending)
//         // returns()
//     {
//         // require(verifyAvailableFunds(msg.sender, pledgeIdToPledge[proofIdToProof[_proofId].pledgeId].collateral) == true);
//         // TODO - move this into CRUD update functionality?
//         lockDepositForProof(msg.sender, proofIdToProof[_proofId].pledgeId);
//         proofIdToProof[_proofId].state = ProofState.Rejected;
//     //     Reviewer gets portion of pot
//     //     Reviewer approves - both pledger and reviewer get their deposits back.
//     //     Reviewer rejects - pledger's deposit split between pot
//     }

//     function lockDepositForProof(
//         address _userAddress,
//         bytes32 _pledgeId
//     ) 
//         private
//     {
//         uint proofDeposit = pledgeIdToPledge[_pledgeId].collateral;
//         addressToUserAccount[_userAddress].availableDeposits = addressToUserAccount[_userAddress].availableDeposits - proofDeposit;
//         addressToUserAccount[_userAddress].lockedDeposits = addressToUserAccount[_userAddress].lockedDeposits + proofDeposit;
//     }

//     // this all maybe should be different contract?  contract per pledge?  that way money is more secure?
//     // probs not just contract balance, need to store pot
//     function transferFromPot(
//         uint _amount,
//         address _userAddress
//     )
//         private
//     {
//         addressToUserAccount[_userAddress].availableDeposits = addressToUserAccount[_userAddress].availableDeposits + _amount;
//     }

//     function transferIntoPot(
//         uint _amount,
//         address _userAddress
//     )
//         private   
//     {
//         addressToUserAccount[_userAddress].lockedDeposits = addressToUserAccount[_userAddress].lockedDeposits - _amount;
//     }

//     // assign reviewer?
//     // get random number
//     // array of staked? in multiple times if have lots of completed?
//     // modulus the length of stake array
//     // thats the reviewer

//     // could this be different contract???  separate crud from business logic?

// }

// // maybe bid on the ability to review?
