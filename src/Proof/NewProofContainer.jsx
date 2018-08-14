import React from 'react';
import ContractStateRetriever from '../ContractStateRetriever';
import NewProof from './NewProof';

const NewProofContainer = ({ proofId }) => {
    return (
        <ContractStateRetriever contract="Grow" method="getProof" args={[proofId]} render={({ contractData }) => (
            <NewProof proofId={proofId} {...contractData} />
        )}/>
    )
};

export default NewProofContainer;
