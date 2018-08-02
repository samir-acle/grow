import React, { Component } from 'react';
import { web3ForEvents } from './providers';

class EventListener extends Component {

    render() {

    }
}

this.wsContract = new web3.eth.Contract(
    this.contract.contractArtifact.abi,
    this.contract.contractArtifact.networks[1532199019661].address,
    {
      from: '0xb72D04C83799E1725b60f258b209EDc2a2f8ffda',
      data: this.contract.contractArtifact.deployedBytecode,
    }
)

this.wsContract.events.NewPledge(undefined, (err, result) => {
    console.log('err', err);
    console.log('result', result);
});
