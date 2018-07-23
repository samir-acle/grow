# Social Pressure

### Domain Terms
- pledge: 

### Design Patterns
Solidity CRUD
Commit Reveal
Pull 
Upgradability (can to variables in constructor)


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
