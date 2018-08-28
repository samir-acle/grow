import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import 'react-day-picker/lib/style.css';
import moment from 'moment';
import { updatePledge, listenForEvent } from '../actions';
import { drizzleConnect } from 'drizzle-react';
import ipfs from '../../Web3/ipfs';
import { Buffer } from 'buffer';
import { Box, FormField, TextInput, TextArea, Button, RangeInput, Heading, Text } from 'grommet';
import { Redirect } from 'react-router-dom';
import { ipfsHashToBytes32 } from 'Utils/ipfsHelpers';
import { PledgeDetails } from '../Pledge';
import ContractStateRetriever from '../../ContractStateRetriever';
import Expirations, { ProofExpirationList } from './Expirations';
import Details from './Details';
import Collateral from './Collateral';

const PledgeSummary = ({ details, expirations, collateral, proofFee }) => {
    return (
        <Box>
            <PledgeDetails {...details} />
            <Box>
                <ProofExpirationList expirations={expirations} />
            </Box>
            <Box>
                <p>Total Collateral: {collateral}</p>
                <p>Collateral Per Proof: {collateral / expirations.length}</p>
                <p>Total Fees: {expirations.length * proofFee}</p>
                <p>If you successfully complete the pledge, you will get {collateral - (expirations.length * proofFee)} ETH back</p>
            </Box>
        </Box>
    )
}


class NewPledge extends Component {

    constructor(props, context) {
        super(props);

        this.state = {
            details: null,
            expirations: [],
            collateral: 0,
            resetPledge: false,
            completedPledge: false,
        }

        this.contract = context.drizzle.contracts.Grow;
    }

    componentDidMount() {
        this.props.listenForEvent(this.contract, 'NewPledge');
    }

    isStep = (step) => {
        switch (step) {
            case 'DETAILS':
                return !this.state.details;
                break;
            case 'EXPIRATIONS':
                return this.state.details && this.state.expirations.length === 0;
                break;
            case 'COLLATERAL':
                return this.state.details && this.state.expirations.length > 0 && !this.state.collateral;
                break;
            case 'SUMMARY':
                return this.state.details && this.state.expirations.length > 0 && this.state.collateral > 0;
                break;
            default:
                return false;
        }
    }

    createPledge = async () => {
        const { expirations, details, collateral } = this.state;

        const expirationsInSeconds = expirations.map(ex => ex / 1000);
        const ipfsHash = await this.saveIPFSHash(JSON.stringify(details));
        const ipfsHashBytes32 = ipfsHashToBytes32(ipfsHash);
        const collateralInWei = web3.toWei(collateral, 'ether');

        this.contract.methods.initPledge.cacheSend(expirationsInSeconds, ipfsHashBytes32, {
            from: this.props.accounts[0],
            value: this.context.drizzle.web3.utils.toHex(collateralInWei),
        });

        this.setState({ completedPledge: true });
    }

    saveIPFSHash = async (data) => {
        const buffer = Buffer.from(data);
        const files = await ipfs.add(buffer);
        const ipfsHash = files[0].hash;
        return ipfsHash;
    }


    render() {
        if (this.state.resetPledge) {
            return <Redirect to='/pledges/new' />
        }

        if (this.state.completedPledge) {
            return <Redirect to='/pledges' />
        }

        return (
            <ContractStateRetriever contract="Grow" method="proofFee" args={[]} render={({ contractData }) => (
                <Box pad="medium" width="large">
                    {this.isStep('DETAILS') && <Details onSubmit={(data) => this.setState({ details: data })} />}
                    {this.isStep('EXPIRATIONS') && <Expirations onSubmit={(expirations) => this.setState({ expirations })} />}
                    {this.isStep('COLLATERAL') && <Collateral proofFee={parseInt(contractData, 10)} numOfProofs={this.state.expirations.length} onSubmit={(collateral) => this.setState({ collateral })} />}
                    {this.isStep('SUMMARY') && (
                        <Fragment>
                            <PledgeSummary {...this.state} proofFee={web3.fromWei(Number(contractData), 'ether')} />
                            <Box direction="row" gap="medium" justify="between">
                                <Button color="status-error" label='Cancel' onClick={() => this.setState({ resetPledge: true })} />
                                <Button label='Create Pledge' onClick={this.createPledge} />
                            </Box>
                        </ Fragment>
                    )}
                </Box>
            )}/>
        )
    }
}

NewPledge.contextTypes = {
    drizzle: PropTypes.object,
    drizzleStore: PropTypes.object,
};

const mapDispatchToProps = dispatch => {
    return {
        updatePledge: (payload) => dispatch(updatePledge(payload)),
        listenForEvent: (contract, eventName) => dispatch(listenForEvent(contract, eventName)),
    }
};

const mapStateToProps = state => {
    return {
        contract: state.contracts.Grow,
        accounts: state.accounts,
    };
};

export default drizzleConnect(NewPledge, mapStateToProps, mapDispatchToProps);
