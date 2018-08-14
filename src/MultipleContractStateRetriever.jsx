import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { drizzleConnect } from 'drizzle-react';
import _ from 'lodash';

class MultipleContractStateRetriever extends Component {
    constructor(props, context) {
        super(props);
        this.contract = context.drizzle.contracts[this.props.contract];
        this.dataKeys = this.props.args.map(a => this.contract.methods[this.props.method].cacheCall(a));
    }

    render() {
        const data = _.compact(_.map(this.dataKeys, dk => this.props.contracts[this.props.contract][this.props.method][dk]));
        // make this a loading component
        if (data.length === 0 || _.some(data, d => !Boolean(d.value))) return null;

        return this.props.render({ contractData: data.map(d => d.value), args: this.props.args });
    }
}

MultipleContractStateRetriever.contextTypes = {
    drizzle: PropTypes.object,
    drizzleStore: PropTypes.object,
};

MultipleContractStateRetriever.propTypes = {
    contract: PropTypes.string.isRequired,
    method: PropTypes.string.isRequired,
    render: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => {
    return {

    };
};

const mapStateToProps = state => {
    return {
        contracts: state.contracts,
    };
};



export default drizzleConnect(MultipleContractStateRetriever, mapStateToProps, mapDispatchToProps);
