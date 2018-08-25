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


Icebox
- events for expires
- Pledge state - set to expired/completed...
- for changing of prooffee, need to make sure there are no active pledges
- when paused - self approve proofs?
- think about delays
    -    maybe delay between calling expire =?
- fail safe that transfers collateral to balances and allows withdrawals...
- limit amount of ether... how?
- time submitted - end of day...

tests to add
    - withdraw balance test
    - grow token tests maybe not done
    - expired logic  // ALMOST, JUST SKIPPED TEST - lot of expired stuff dont work, neeed to fix
    - proofs for assignment

- when expiring, should the person who calls it get something? The proof fee?  but then what incentivizes someone to actually stake and review?  need to make it so they get some of the pot...
- clean up
    - rethink file separation
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

get rid of all 0 index

GAS ISSUES (to fix or at least point out)
    - do not loop through unbounded array
        - either bound or do on client side
    - deposit needs 300k gas... look into it
    - find out gas costs of all methods...
    - submit pledge costs 6000000??

ACTUAL TODOS
  - Fix submitting pledge  ( was an issue with the lastProofPending modifier - untested - write tests, get to work, then try again)
  - Add comments and finish tests for solidity code
  - Add fallback function (if needed) and self destruct (if needed)
  - Style all completed frontend components and clean up code
  - Create user stories for work completed (put on trello and link making public)
      the planned work and bug fixes
  - Improve gas costs - look at crypto zombies about struct uint ordering
    - create a gas cost analysis for top methods for learning
    - Remove proof in order expiration time (should be client responsibility)
    - Add limit to size of proof array


  - Once the above is done, move on to working on the NEXT user story
  
  - Review Screen
  - Withdraw Eth Screen
  - Units of Ether on FrontEnd


FUTURE
- helpers for easy accessing pledge stuff from proof id and vice versa
- explore using built in TokenUris for growtoken
- make staking contract reusable for any ERC721 token
- make library for deleting and adding to array (but maybe more expensive)



TODOOOOO
- expired tests and stuff is commmentd out/skipped because not working
- try subtracting and making sure > 0 
