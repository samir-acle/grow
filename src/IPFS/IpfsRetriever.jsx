import React, { Component } from 'react';
import ipfs from '../Web3/ipfs';
import { Box } from 'grommet';
import { bytes32ToIpfsHash } from '../Utils/ipfsHelpers';

class IpfsRetriever extends Component {

    constructor(props) {
        super(props);

        this.state = {
            data: null,
        }
    }

    componentDidMount = async() => {
        console.log('getting data from ipfs:', this.props.hash);
        const data = await this.getFromIpfs(this.props.hash);
        console.log('data:', data);
        this.setState({ data });
    }

    // should I have IPFS service?  yes probs

    getFromIpfs = async (hash) => {
        const ipfsHash = bytes32ToIpfsHash(hash);
        console.log('ipfs hash');
        const files = await ipfs.get(ipfsHash);
        console.log('ipfs files');
        return JSON.parse(files[0].content.toString('utf8'));
    }

    render() {
        if (!this.state.data) return <div>We can't stop here, this is bat country.</div>;

        return this.props.render(this.state);
    }
}

export default IpfsRetriever;
