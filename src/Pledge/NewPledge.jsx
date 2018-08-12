import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import DayPicker from 'react-day-picker';
import 'react-day-picker/lib/style.css';
import moment from 'moment';
import { updatePledge, listenForEvent } from './actions';
import { drizzleConnect } from 'drizzle-react';
import Web3 from 'web3';
import ipfs from '../Web3/ipfs';
import { Buffer } from 'buffer';
import { Box, FormField, TextInput, TextArea, Button, RangeInput } from 'grommet';
import { Redirect } from 'react-router-dom';
import { ipfsHashToBytes32 } from '../Utils/ipfsHelpers';
import { PledgeDetails } from './Pledge';
import ContractStateRetriever from '../ContractStateRetriever';

class Details extends Component {

    constructor(props) {
        super(props);
    }

    submitDetails = (event) => {
        event.preventDefault();

        const data = {
            title: event.target[0].value,
            what: event.target[1].value,
            where: event.target[2].value,
            when: event.target[3].value,
            why: event.target[4].value,
        }

        this.props.onSubmit(data);
    };

    render() {
        return (
            <div>
                <h4>The details will be used to verify that the pledge was completed. The more details the better. Leave fields blank if not applicable</h4>
                <form onSubmit={this.submitDetails}>
                    <Box>
                        <FormField label="Title">
                            <TextInput />
                        </FormField>
                        <FormField label="What" help="Description of what habit, action, task you will accomplish">
                            <TextArea />
                        </FormField>
                        <FormField label="Where" help="Where will this take place? Ex. At my local gym">
                            <TextArea />
                        </FormField>
                        <FormField label="When" help="When will this take place? Ex. Once a week, Every Friday, etc.">
                            <TextArea />
                        </FormField>
                        <FormField label="Why" help="What is the goal of this pledge? What growth are you looking for?">
                            <TextArea />
                        </FormField>
                        <Button type="submit" label="Submit" primary={true} />
                    </Box>
                </form>
            </div>
        )
    }
}

class Expirations extends Component {

    constructor(props) {
        super(props);

        this.state = {
            numOfProofs: 1,
            proofIndex: 0,
            expirations: [],
        }
    }

    changeNumberOfProofs = (event) => {
        const numOfProofs = parseInt(event.target.value, 10);
        const expirations = this.state.expirations.slice(0, numOfProofs);

        this.setState({
            numOfProofs,
            proofIndex: 0,
            expirations,
        });
    }

    handleDayClick = (proofIndex) => (day, { selected }) => {
        const selectedDay = selected ? undefined : day;
        const expirations = [...this.state.expirations];
        expirations[proofIndex] = selectedDay.valueOf();
        this.setState({ expirations });
    }

    render() {
        return (
            <div>
                <p>Number of Proofs: {this.state.numOfProofs}</p>
                <RangeInput
                    value={this.state.numOfProofs}
                    min={1}
                    max={10}
                    step={1}
                    onChange={this.changeNumberOfProofs}
                />

                <ProofExpirationList expirations={this.state.expirations} />

                {this.state.numOfProofs > 0 && (
                    <ProofExpirationSelection
                        {...this.state}
                        setProofIndex={(proofIndex) => this.setState({ proofIndex })}
                        handleDayClick={this.handleDayClick(this.state.proofIndex)}
                    />)}

                {this.state.expirations.filter(d => Boolean(d)).length === this.state.numOfProofs && (
                    <Button label='Choose Collateral' onClick={() => this.props.onSubmit([...this.state.expirations])} />
                )}
            </div>
        )
    }
}

const ProofExpirationSelection = ({ expirations, numOfProofs, proofIndex, setProofIndex, handleDayClick }) => {
    const getDisabledAfterDays = () => {
        if (proofIndex === (numOfProofs - 1)) return null;
        if (!expirations[proofIndex + 1]) return null;

        const lastPossibleDate = moment(expirations[proofIndex + 1]).subtract(1, 'day').valueOf();
        return new Date(lastPossibleDate);
    }

    const getDisabledBeforeDays = () => {
        let firstPossibleDate;

        if (proofIndex > 0) {
            firstPossibleDate = moment(expirations[proofIndex - 1]).add(1, 'day').valueOf();
        } else {
            firstPossibleDate = moment().valueOf();
        }

        return new Date(firstPossibleDate);
    }

    const selectAnotherProof = (index) => {
        if (expirations[proofIndex]) {
            setProofIndex(index);
        }
    }

    return (
        <div>
            <DayPicker
                selectedDays={new Date(expirations[proofIndex]) || null}
                onDayClick={handleDayClick}
                todayButton="Go to Current Month"
                disabledDays={{
                    after: getDisabledAfterDays(),
                    before: getDisabledBeforeDays(),
                }}
            />

            {proofIndex > 0 && <Button label='Previous Proof' onClick={() => selectAnotherProof(proofIndex - 1)} />}
            {proofIndex < (numOfProofs - 1) && <Button label='Next Proof' onClick={() => selectAnotherProof(proofIndex + 1)} />}
        </div>
    )
}

class Collateral extends Component {

    constructor(props) {
        super(props);

        this.state = {
            totalCollateral: 0,
        }
    }

    isValid = () => {
        return this.collateralPerProof() > this.props.proofFee;
    }

    collateralPerProof = () => {
        return this.state.totalCollateral / this.props.numOfProofs;
    }

    render() {
        if (!this.props.proofFee) return <div>Loading Proof Fee...</div>;

        return (
            <div>
                <label htmlFor="totalCollateral">Collateral in WEI</label>
                <input
                    id="totalCollateral"
                    name="totalCollateral"
                    type="number"
                    min="0"
                    value={this.state.totalCollateral}
                    onChange={(event) => this.setState({ totalCollateral: parseInt(event.target.value, 10) })}
                />

                <p>Proof Fee: {this.props.proofFee}</p>
                <p>Collateral Per Proof: {this.collateralPerProof()} WEI</p>

                {!this.isValid() && <p>Invalid Amount.  Collateral Per Proof must be higher than the Proof Fee</p>}

                {this.isValid() && (
                    <Button label='Review New Pledge' onClick={() => this.props.onSubmit(this.state.totalCollateral)} />
                )}
            </div>
        )
    }
}

const ProofExpirationList = ({ expirations }) => {
    return (
        <Fragment>
            {expirations.map(p => <p>Dates: {moment(p).format('YYYY-MM-DD')}</p>)}
        </Fragment>
    )
}

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
                <p>If you successfully complete the pledge, you will get {collateral - (expirations.length * proofFee)} WEI back</p>
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
        // const collateralInWei = web3.toWei(totalCollateral, 'ether');

        this.contract.methods.initPledge.cacheSend(expirationsInSeconds, ipfsHashBytes32, {
            from: this.props.accounts[0],
            value: this.context.drizzle.web3.utils.toHex(collateral),
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
            return <Redirect to='/' />
        }

        return (
            <ContractStateRetriever contract="Grow" method="proofFee" args={[]} render={({ contractData }) => (
                <div>
                    {this.isStep('DETAILS') && <Details onSubmit={(data) => this.setState({ details: data })} />}
                    {this.isStep('EXPIRATIONS') && <Expirations onSubmit={(expirations) => this.setState({ expirations })} />}
                    {this.isStep('COLLATERAL') && <Collateral proofFee={parseInt(contractData, 10)} numOfProofs={this.state.expirations.length} onSubmit={(collateral) => this.setState({ collateral })} />}
                    {this.isStep('SUMMARY') && (
                        <Fragment>
                            <PledgeSummary {...this.state} proofFee={parseInt(contractData, 10)} />
                            <Button label='Cancel' onClick={() => this.setState({ resetPledge: true })} />
                            <Button label='Create Pledge' onClick={this.createPledge} />
                        </ Fragment>
                    )}
                </div>
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
