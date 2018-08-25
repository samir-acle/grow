import React from 'react';
import { Grid, Box, Heading, Button } from 'grommet';

export const TokenBadge = ({ tokenId }) => {
    return (
        <Grid>
            <Box background='accent-1' animation="slideLeft" elevation="large" round="full" align-content="center" pad="small">
                {tokenId}
            </Box>
        </Grid>
    )
}

export const TokensDisplay = ({ tokensForDeposit, stakedTokens, depositedTokens, depositToken, stakeToken }) => {
    return (
        <Box>
            <ListOfTokens title="Owned Tokens" tokens={tokensForDeposit} buttonLabel="deposit" onClick={depositToken} />
            <ListOfTokens title="Ready To Stake" tokens={depositedTokens} buttonLabel="Stake" onClick={stakeToken} />
            <ListOfTokens title="Staked Tokens" tokens={stakedTokens} />
        </Box>

    )
};

export const ListOfTokens = ({ title, tokens, buttonLabel, onClick }) => {
    return (
        <Box>
            <Heading level="4">{title}</Heading>
            <ul>
                {tokens.map(t => (
                    <li key={t}>
                        <TokenBadge tokenId={t} />
                        <Button label={buttonLabel} onClick={() => onClick(t)} />
                    </li>))}
            </ul>
        </Box>
    )
};
