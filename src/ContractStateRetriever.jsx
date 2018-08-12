import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { drizzleConnect } from 'drizzle-react';

class ContractStateRetriever extends Component {
    constructor(props, context) {
        super(props);
        this.contract = context.drizzle.contracts[this.props.contract];
        this.dataKey = this.contract.methods[this.props.method].cacheCall(...this.props.args);
    }

    render() {
        const data = this.props.contracts[this.props.contract][this.props.method][this.dataKey];

        // make this a loading component
        if (!data || !data.value) return null;

        return this.props.render({ contractData: data.value });
    }
}

ContractStateRetriever.contextTypes = {
    drizzle: PropTypes.object,
    drizzleStore: PropTypes.object,
};

ContractStateRetriever.propTypes = {
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



export default drizzleConnect(ContractStateRetriever, mapStateToProps, mapDispatchToProps);
