# Grow
### *Building Habits through Social Pressure*

## Description
Grow is a decentralized application designed to incentivize forming habits and achieving goals through social and financial pressure. 

## Backlog
https://trello.com/b/oZtkMc2n/grow-dapp

****__This repo contains unfinished work. See the completed stories above for a better idea of what you are currently able to do with the dApp__****

The Withdrawal Functionality, Stake Functionality, and Review functionality are not complete but are partly visible in the UI.

### Glossary
* **Goal/Habit** - used interchangeably in this document to refer to the item that the user wants to achieve.
* **Pledge** - The user creates a pledge containing all of the details (who, what, when, why, where) of a goal. Pledges will require a certain number of proofs to be completed as certain times to be considered successful. This is customized by the user at creation time
* **Proof** - A required piece of evidence that a reviewer can use to verify the completion of a pledge.
* **Reviewer** - A user that stakes a GROW token in order to verify that a proof proves the completion of a goal.

## How to Use
> Users will create pledges, which consists of a number of proofs, each of which will have collateral (in ETH) associated.  The collateral will be returned to the user (minus fees) on succesful completion of each proof of the pledge. A user will submit photographic evidence that they completed the goal for each proof of the pledge. A reviewer will either approve or reject the proof. A fee will be charged for each proof in the pledge that will go to the reviewer for verifying the proof.  Reviewers must stake a GROW token on each verification, which will be slashed if the verification is not submitted in time. GROW tokens are earned by submitting proofs that are accepted by reviewers. Dispute resolution will be implemented in the future to ensure all parties act in the best interest of the network.  Each user will get a single, free(ish) GROW token after the creationg of their first pledge.

## Example Lifecycle of a Pledge
> Bob opens the GROW dApp with MetaMask enabled and logged in.  He creates a pledge that he wants to wake up before 5AM every Monday for the next ten weeks (10 proofs) starting next Monday.  He decides to deposit 1 ETH as collateral (0.1 ETH per proof). On Monday morning, Bob wakes up at 4:30 AM and takes a picture of the current date and time on his computer.  He logs into GROW and submits the picture as proof.

> Alice has been forming good habits since GROW was released, succesfully completing 3 Pledges with 5 Proofs each. She has already deposited her GROW tokens for future staking opportunities. Alice logs onto GROW dApp Monday evening and heads to the Staking page. She sees there is a recent Proof that needs approval so she clicks to stake one of her tokens. She is notified that she was successfully added as a reviewer so she heads to the Review page.  Here she sees the details of the proof she needs to verify, including the submitted picture and all of the pledge details. She determines that Bob did indeed wake up before 5AM on Monday and she approves the proof. Alice is rewarded with the 10 finney proof fee. Bob's collateral minus the fee (0.99 ETH) is sent to his grow user account. Both users go to their account page and withdraw their ether. Bob is rewarded with a newly minted GROW token and Alice's staked token is released.

> 10 days later, Bob realizes he did not wake up in time the previous Monday.  He tries to sneakily submit a proof anyways, but is unable to as the current time is past the proof expiration.  He cannot submit another proof for that pledge until that active proof has been expired, so he clicks the expire button. The proof fee is transferred to his grow account since he marked the proof as expired. The remaining collateral for that proof (0.99 ETH) is transferred to the grow pot, where it will be used as further incentivization for good behavior (future feature).


## Installation Instructions

* Install dependencies after cloning repo and cd'ing into cloned directory

   ```
   npm install
   ```

   or if you prefer

   ```
   yarn install
   ```

* [install ipfs](https://ipfs.io/docs/install/)
* install ganache-cli

   ```npm install -g ganache-cli```


## Startup Instructions
1.   open terminal of choice
1. ```
   ipfs daemon
   ```
1.   new terminal tab
1. ```
   ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin "[\"http://localhost:1234\"]"
   ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods "[\"PUT\", \"POST\", \"GET\"]"
   ```

1. ```
   ganache-cli
   ```
1. open new terminal tab
1. ```
   ipfs add FirstPledgeTokenDetails.json
   ```
1. ```
   truffle migrate
   ```
1. ```
   parcel index.html --no-cache
   ```
1. Open browser and go to http://localhost:1234.  Log into private network localhost:8545 on MetaMask and seed phrase from ganache-cli.

## Testing Instructions
```
truffle test
```
```
npm test
```

## Solidity Libraries
Used OpenZeppelins SafeMath library to prevent integer under/overflows.
