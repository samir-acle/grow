pragma solidity ^0.4.23;
import "./Proof.sol";
import "./Pledge.sol";
import "./UserAccount.sol";

contract Pressure is UserAccount, Pledge, Proof {

    //  TODO -  should this be percentage of collateral?  Probs because reviewer is risking more and putting more away and losing potential gains
    uint proofFee;

    function createToken(uint _proofFee)
       public
    {
        proofFee = _proofFee;
    }

//  should this be a modifier or private function or just require at beginning?
// or should it be calculared off chain
    function verifyAvailableFunds(address _userAddress, uint _amount)
        private
        view
        returns (bool hasFunds)
    {
        // TODO -safe math 
        return addressToUserAccount[_userAddress].availableDeposits >= _amount;
    }

    function verifyLockedFunds(address _userAddress, uint amount)
        private
        view
        returns (bool hasFunds)
    {
        return addressToUserAccount[_userAddress].lockedDeposits >= amount;
    }

    modifier verifyProofCount(bytes32 _pledgeId) {
        require(pledgeIdToNumberOfSubmittedProofs[_pledgeId] < pledgeIdToPledge[_pledgeId].numberOfProofs);
        _;
    }

    modifier verifyPot(uint amount) {
        require(this.balance >= amount);
        _;
    }
    
    function initPledge(
        uint _expiresAt,
        uint _numberOfProofs,
        bytes32 _title,
        string _detailsHash
    )
        public
        payable
        existingUserOrCreate()
        returns(uint pledgeIndex)
    {
        // make sure  payable msg.value works how I think it does...
        // should pot not be contract address so is more clearly locked??
        // should payable be separate?

        // TODO - this should come from available if possible maybe?
        // TODO - safemath, verify division, or maybe calculate offchain and just verify?
        uint proofFees = _numberOfProofs * proofFee;
        uint collateralPerProof = (msg.value - proofFees) / _numberOfProofs;

        pledgeIndex = createPledge(_expiresAt, _numberOfProofs, _title, _detailsHash, collateralPerProof);
        
        addressToUserAccount[msg.sender].lockedDeposits = addressToUserAccount[msg.sender].lockedDeposits + msg.value;
    }

    function submitProof(
        string _imageHash,
        bytes32 _pledgeId
    )
        public
        onlyPledgeOwner(_pledgeId)
        verifyProofCount(_pledgeId)
        returns(uint proofIndex)
    {
        // probs make msg.sender in private function
        require(verifyLockedFunds(msg.sender, pledgeIdToPledge[_pledgeId].collateral + proofFee) == true);
        uint newProofIndex = createProof(_imageHash, _pledgeId);

        // TODO - maybe not needed
        // pledgeIdToPledge[_pledgeId].hasPendingProof = true;

        // if has locked funds use them
        // if has available funds lock them
        // or else throw

        // lockDepositForProof(_pledgeId);
        transferIntoPot(proofFee, msg.sender);
        return newProofIndex;
    }

    function approveProof(
        bytes32 _proofId
    )
        public
        onlyReviewer(_proofId)
        onlyProofState(_proofId, ProofState.Pending)
        // returns()
    {
        require(verifyAvailableFunds(msg.sender, pledgeIdToPledge[proofIdToProof[_proofId].pledgeId].collateral) == true);
        // TODO - move this into CRUD update functionality?
        lockDepositForProof(msg.sender, proofIdToProof[_proofId].pledgeId);
        proofIdToProof[_proofId].state = ProofState.Accepted;

    //     Reviewer gets portion of pot
    //     Reviewer approves - both pledger and reviewer get their deposits back.
    //     Reviewer rejects - pledger's deposit split between pot
    }

    function rejectProof(
        bytes32 _proofId
    )
        public
        onlyReviewer(_proofId)
        onlyProofState(_proofId, ProofState.Pending)
        // returns()
    {
        require(verifyAvailableFunds(msg.sender, pledgeIdToPledge[proofIdToProof[_proofId].pledgeId].collateral) == true);
        // TODO - move this into CRUD update functionality?
        lockDepositForProof(msg.sender, proofIdToProof[_proofId].pledgeId);
        proofIdToProof[_proofId].state = ProofState.Rejected;
    //     Reviewer gets portion of pot
    //     Reviewer approves - both pledger and reviewer get their deposits back.
    //     Reviewer rejects - pledger's deposit split between pot
    }

    function lockDepositForProof(
        address _userAddress,
        bytes32 _pledgeId
    ) 
        private
    {
        uint proofDeposit = pledgeIdToPledge[_pledgeId].collateral;
        addressToUserAccount[_userAddress].availableDeposits = addressToUserAccount[_userAddress].availableDeposits - proofDeposit;
        addressToUserAccount[_userAddress].lockedDeposits = addressToUserAccount[_userAddress].lockedDeposits + proofDeposit;
    }

    // this all maybe should be different contract?  contract per pledge?  that way money is more secure?
    // probs not just contract balance, need to store pot
    function transferFromPot(
        uint _amount,
        address _userAddress
    )
        private
    {
        addressToUserAccount[_userAddress].availableDeposits = addressToUserAccount[_userAddress].availableDeposits + _amount;
    }

    function transferIntoPot(
        uint _amount,
        address _userAddress
    )
        private   
    {
        addressToUserAccount[_userAddress].lockedDeposits = addressToUserAccount[_userAddress].lockedDeposits - _amount;
    }

    // assign reviewer?
    // get random number
    // array of staked? in multiple times if have lots of completed?
    // modulus the length of stake array
    // thats the reviewer

    // could this be different contract???  separate crud from business logic?

}

// maybe bid on the ability to review?
