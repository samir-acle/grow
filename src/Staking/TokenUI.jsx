import React from 'react';
import { Grid, Box, Heading, Button, Text } from 'grommet';

export const TokenBadge = ({ tokenId }) => {
    return (
        <Box background='accent-1' animation="slideLeft" elevation="large" round="full" alignContent="center" align="center" pad="small">
            #{tokenId}
        </Box>
    )
}

export const TokensDisplay = ({ tokensForDeposit, stakedTokens, depositedTokens, depositToken, stakeToken }) => {
    return (
        <Box direction="column" margin={{ bottom: 'small' }}>
            <ListOfTokens title="Owned Tokens" tokens={tokensForDeposit} buttonLabel="Deposit" onClick={depositToken} />
            <ListOfTokens title="Ready To Stake" tokens={depositedTokens} buttonLabel="Stake" onClick={stakeToken} />
            <ListOfTokens title="Staked Tokens" tokens={stakedTokens} />
        </Box>

    )
};

export const ListOfTokens = ({ title, tokens, buttonLabel, onClick }) => {
    return (
        <Box direction="column" width="medium">
            <Heading level="4">{title}</Heading>
                {tokens.length > 0 && tokens.map(t => (
                    <Box key={t} direction="row" margin={{ bottom: 'small' }} gap="small">
                        <TokenBadge tokenId={t} />
                        {buttonLabel && <Button label={buttonLabel} onClick={() => onClick(t)} />}
                    </Box>))}
                {tokens.length == 0 && <Text color="accent-4">There are no tokens in this category</Text>}
        </Box>
    )
};
