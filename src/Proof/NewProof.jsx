import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Box, Button } from 'grommet';
import ipfs from '../Web3/ipfs';
import { Buffer } from 'buffer';
import { drizzleConnect } from 'drizzle-react';
import { ipfsHashToBytes32 } from '../Utils/ipfsHelpers';
import { Redirect } from 'react-router-dom';

class NewProof extends Component {

    constructor(props, context) {
        super(props);

        this.state = {
            completedProof: false,
            files: [],
            ipfsHash: null,
        };

        this.contract = context.drizzle.contracts.Grow;
    }

    submitProof = () => {
        const ipfsHashBytes32 = ipfsHashToBytes32(this.state.ipfsHash);
        
        console.log('sending these params:', ipfsHashBytes32, this.props.pledgeId, this.props.proofId);

        this.contract.methods.submitProof.cacheSend(
            ipfsHashBytes32,
            this.props.pledgeId,
            this.props.proofId,
        );

        this.setState({ completedProof: true });
    }

    // TODO - break ipfs stuff out into helper or service
    uploadFiles = () => {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const ipfsHash = await this.saveIPFSHash(reader.result);
            this.setState({ ipfsHash });
        };
        reader.readAsArrayBuffer(this.state.files[0]);
    };

    saveIPFSHash = async (data) => {
        const buffer = Buffer.from(data);
        const files = await ipfs.add(buffer);
        const ipfsHash = files[0].hash;
        return ipfsHash;
    }

    handleFileSelect = (event) => {
        const files = event.target.files;
        this.setState({ files });
    };

    render() {
        if(this.state.completedProof) return <Redirect to={`pledges/${this.props.pledgeId}`} />

        return (
            <Box>
                {!this.state.ipfsHash && (
                    <Fragment>
                        <input id="myfiles" type="file" onChange={this.handleFileSelect} />
                        <Button label="upload" onClick={this.uploadFiles} />
                    </Fragment>
                )}
                {this.state.ipfsHash && (
                    <Fragment>
                        {/* TODO make IPFS image retriever */}
                        <Button label="submit" onClick={this.submitProof} />
                    </Fragment>
                )}
            </Box>
        )
    }
}

NewProof.contextTypes = {
    drizzle: PropTypes.object,
    drizzleStore: PropTypes.object,
};

const mapDispatchToProps = dispatch => {
    return {
        
    }
};

const mapStateToProps = state => {
    return {
        contract: state.contracts.Grow,
        accounts: state.accounts,
    };
};

export default drizzleConnect(NewProof, mapStateToProps, mapDispatchToProps);

// to submit proof need ipfs hash, pledgeId, proofId
