# Social Pressure

### Domain Terms
- pledge: 

### Design Patterns
did not use - Factory Pattern (to save on gas costs for deploying a new contract per Pledge)

Solidity CRUD


Commit Reveal


Pull


Upgradability
  - Looked into different options including separate Data and Logic contracts and Proxy contracts. Decided to use the Unstructured Storage Pattern provided by ZeppelinOS due to it's extensive testing and security audits.


Use Well Tested Secure Existing Code


Circuit Breaker / emergency stop


SafeMath

### Common Attacks Prevention



### Security Concerns
Reentrancy - use Reentrancy guard?


TODO - check visibility and modifiers
TODO - replace constants with view?

Auto-approval if not accepted or rejected?

### Front End
TODOs - 
1) Create a Pledge
2) View my existing pledges
3) Submit proof
4) View own proofs and status
5) Stake completed pledges
6) Approve/Reject Proofs

Stretch - 
1) Disputes
2) Can see others pledges (but not proofs)


### Game Theory
This section needs expanding.

Does it need own token?

When create pledge, portion of the amount goes into the pot
    - Per submission review needed
    - is this customizable by the pledge creator?
        - like a transaction fee
    - Higher tx fee will be reviewed sooner?

Must stake something to be a reviewer

For reviewers, they put up same amount that pledger risks per submission with their review. 

If reviewer makes decision and no dispute:
    Reviewer gets portion of pot
    Reviewer approves - both pledger and reviewer get their deposits back.
    Reviewer rejects - pledger's deposit split between pot
        - amount based on any extra put in by reviewer

If proof expires before reviewer submits decision
    Submission is approved, plegers deposit is returned
    Reviewers stake is burned

<!-- Stretch Goal -->
If pledger disputes the reviewer's decision
    Goes to vote (anyone or just stakers?)
    commit and reveal vote (has to be staked or something locking tokens bc of sybil attack)


What happens if no submission is ever rejected?
    
    - Based on number of submissions needed

What happens if reviewers collude with potential disputer resolvers?
What else fills up the pot?
How to make sure pot remains filled?
Slashing based on proof number?


Was going to use oracalize or something similar to generate a random number,
and pick at that index from stake array.  However, decided to go with a simpler 
approach to have stakers see list of proofs and pick one to stake on

Allow others to bet on completion of pledges.  Separate dApp.


#####
KNOWN BUGS - FUTURE improvemtns
  - time select for expiration is not inclusive
  - weak front end validation
  - Currency from WEI to options   (hash to bi fexied)
  - MultiHash is hardcoded for current IPFS for now
  - proofId and pledgeIds are sometimes same...
  - make MultiHash for more flexibility (or maybe make upgradeable contract? or at least settable)
  - refactor interfaces/controllers
  - TDD was very slow, hard to get the quick feedback
  - maybe controller should create these other contracts?
  - game theoretics need to be improved
    - did simplest
    - future implement a random assigning of reviewer
    - reward those who expire with something (at least gas cost coverage?)
  - front-running - what would happen
    - can you delay the approval/rejection, wait till expire, then expire it yourself?  Need to limit expirations to stakers with deposits?  Probably shouldnt give proofFee to person who marks as expired, unless that delays the something.  delays.... on staking?
  - deal with tokenId 0.  Just send to myself and dont do anything to it?
  - if proofFee is changed, what will happen to existing proofs

learnings
- set block time to instant for tests :_(


TODO
- withdraw balance tests in solidity?
- fallback function?
- think about delays
- fail safe that transfers collateral to balances and allows withdrawals...
- when paused - self approve proofs?
- limit amount of ether... how?
- refactor balance addings into method in useraccount that will emit event?
- events for expires
- expiration a constant or configurable
- Pledge state - set to expired/completed...
- for changing of prooffee, need to make sure there are no active pledges

tests to add
    - submit proof only if previous proof complete?
    - grow token tests maybe not done

- when expiring, should the person who calls it get something? The proof fee?  but then what incentivizes someone to actually stake and review?  need to make it so they get some of the pot...
- clean up
    - move most requires to modifiers
    - should modifiers all be on the public method rather than internal?
    - validate inputs
    - check integer overflow, underflows
    - check for reentrancy
    - make sure visibility set on all methods and are correct
    - timestamp can be influenced - make sure use 'now' cannot be maniputlate to someones advanvtage
    - check looping over undetermined length arrays (restrict length) bc can reach gas limits
    -// TODO - figure out uints and placement in structs
    - gas cost testing
    - combine approve and reject into one method since most tests are same

