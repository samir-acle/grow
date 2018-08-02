import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DayPicker from 'react-day-picker';
import 'react-day-picker/lib/style.css';
import moment from 'moment';
import { updatePledge, listenForEvent } from './actions';
import { drizzleConnect } from 'drizzle-react';
import Web3 from 'web3';

class NewPledge extends Component {

    constructor(props, context) {
        super(props);
        this.contract = context.drizzle.contracts.Pressure;
    }

    componentDidMount() {
        this.props.listenForEvent(this.contract, 'NewPledge');
    }

    handleDayClick = (day, { selected }) => {
        const value = selected ? undefined : day;
        const payload = {
            key: 'expiresAt',
            value,
        }
        this.props.updatePledge(payload);
    }

    createPledge = () => {
        const { expiresAt, numberOfProofs, title, detailsHash, collateral } = this.props;
        const titleBytes = this.context.drizzle.web3.utils.fromAscii(title);
        this.contract.methods.initPledge.cacheSend(expiresAt.valueOf(), numberOfProofs, titleBytes, detailsHash, { 
            from: this.props.accounts[0],
            value: this.context.drizzle.web3.utils.toHex( web3.toWei(collateral, 'ether') ), 
        });
    }

    render() {
        return (
            <div>
                <DayPicker
                    selectedDays={this.props.expiresAt}
                    onDayClick={this.handleDayClick}
                    todayButton="Go to Current Month" 
                />

                <label htmlFor="numberOfProofs">Number of Proofs</label>
                <input
                    id="numberOfProofs"
                    name="numberOfProofs"
                    type="number"
                    min="1"
                    value={this.props.numberOfProofs}
                    onChange={(event) => {
                        this.props.updatePledge({ key: 'numberOfProofs', value: event.target.value });
                    }}
                />

                <label htmlFor="title">Title of Pledge</label>
                <input
                    id="title"
                    name="title"
                    type="text"
                    value={this.props.title}
                    onChange={(event) => {
                        this.props.updatePledge({ key: 'title', value: event.target.value });
                    }}
                />

                <label htmlFor="detailsHash">DetailsHash</label>
                <input
                    id="detailsHash"
                    name="detailsHash"
                    type="text"
                    min="0"
                    value={this.props.detailsHash}
                    onChange={(event) => {
                        this.props.updatePledge({ key: 'detailsHash', value: event.target.value });
                    }}
                />

{/* // need to check balance and stuff */}
{/* gas prices from ethgasstation api */}

                <label htmlFor="detailsHash">Collateral</label>
                <input
                    id="collateral"
                    name="collateral"
                    type="number"
                    min="0"
                    value={this.props.collateral}
                    onChange={(event) => {
                        this.props.updatePledge({ key: 'collateral', value: event.target.value });
                    }}
                />
                
                <button onClick={this.createPledge} >Create Pledge</button>
            </div>
        )
    }
}

NewPledge.contextTypes = {
    drizzle: PropTypes.object,
    drizzleStore: PropTypes.object,
};

NewPledge.defaultProps = {
    title: '',
    detailsHash: '',
    numberOfProofs: 1,
};

const mapDispatchToProps = dispatch => {
    return {
        updatePledge: (payload) => dispatch(updatePledge(payload)),
        listenForEvent: (contract, eventName) => dispatch(listenForEvent(contract, eventName)),
        // createPledge: (pledge) => dispatch(createPledge(pledge)),
    }
};

const mapStateToProps = state => {
    return {
        expiresAt: state.pledge.expiresAt,
        numberOfProofs: state.pledge.numberOfProofs,
        title: state.pledge.title,
        detailsHash: state.pledge.detailsHash,
        collateral: state.pledge.collateral,
        accounts: state.accounts,
    };
};

export default drizzleConnect(NewPledge, mapStateToProps, mapDispatchToProps);
