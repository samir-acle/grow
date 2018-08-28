import React, { Component } from 'react';
import { Box, Button, Text } from 'grommet';

class Collateral extends Component {

    constructor(props) {
        super(props);

        this.state = {
            totalCollateral: 0,
        }
    }

    isValid = () => {
        return this.collateralPerProof() > this.proofFeeInEther();
    }

    collateralPerProof = () => {
        return this.state.totalCollateral / this.props.numOfProofs;
    }

    proofFeeInEther = () => {
        return web3.fromWei(this.props.proofFee, 'ether');
    }

    render() {
        if (!this.props.proofFee) return <div>Loading Proof Fee...</div>;

        return (
            <Box direction="column">
                <label htmlFor="totalCollateral">Choose Total Collateral for the Pledge (ETH) </label>
                <input
                    id="totalCollateral"
                    name="totalCollateral"
                    type="number"
                    min="0"
                    step=".0001"
                    value={this.state.totalCollateral}
                    onChange={(event) => this.setState({ totalCollateral: Number(event.target.value) })}
                />

                <p>Proof Fee: {this.proofFeeInEther()}</p>
                <p>Collateral Per Proof: {this.collateralPerProof()} ETH</p>

                {!this.isValid() && <Text color="status-critical" tag="p">Invalid Amount.  Collateral Per Proof must be higher than the Proof Fee</Text>}

                {this.isValid() && (
                    <Button primary={true} label='Review New Pledge' onClick={() => this.props.onSubmit(this.state.totalCollateral)} />
                )}
            </Box>
        )
    }
}

export default Collateral;
