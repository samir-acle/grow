import React, { Component, Fragment } from 'react';
import { Box, Heading, Text, Button, RangeInput } from 'grommet';
import DayPicker from 'react-day-picker';
import moment from 'moment';

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
            <Box direction="row" pad="small" gap="small" justify="start">
                {proofIndex > 0 && <Button label='Previous Proof' onClick={() => selectAnotherProof(proofIndex - 1)} />}
                {proofIndex < (numOfProofs - 1) && <Button label='Next Proof' onClick={() => selectAnotherProof(proofIndex + 1)} />}
            </Box>
        </div>
    )
}

export const ProofExpirationList = ({ expirations }) => {
    return (
        <Box direction="row" align="center">
            <Text tag="p" weight="bold">Chosen Dates: </Text>
            <Box direction="row" gap="xsmall" justify="start" margin={{ left: 'small' }}>
                {expirations.map(p => <i key={p}>{moment(p).format('YYYY-MM-DD')}, </i>)}
            </Box>
        </Box>
    )
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
        // TODO make it end of day
        // expirations.map(d => moment(d).endOfDay().value())
        this.setState({ expirations });
    }

    render() {
        return (
            <Box>
                <ProofExpirationList expirations={this.state.expirations} />
                <Text tag="p">Number of Proofs: {this.state.numOfProofs}</Text>
                <RangeInput
                    value={this.state.numOfProofs}
                    min={1}
                    max={10}
                    step={1}
                    onChange={this.changeNumberOfProofs}
                />

                <Box>

                    {this.state.numOfProofs > 0 && (
                        <ProofExpirationSelection
                            {...this.state}
                            setProofIndex={(proofIndex) => this.setState({ proofIndex })}
                            handleDayClick={this.handleDayClick(this.state.proofIndex)}
                        />)}
                </Box>
                <Box pad="medium">
                    {this.state.expirations.filter(d => Boolean(d)).length === this.state.numOfProofs && (
                        <Button label='Choose Collateral' primary={true} onClick={() => this.props.onSubmit([...this.state.expirations])} />
                    )}
                </Box>
            </Box>
        )
    }
}

export default Expirations;
