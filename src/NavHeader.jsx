import React from "react";
import { Box, Heading, Text } from 'grommet';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { drizzleConnect } from 'drizzle-react';

const StyledNavLink = styled(Link)`
  color: #7D4CDB;
  font-weight: bold;
  font-size: 20px;
  text-decoration: none;
`;

const StyledHeading = styled(Heading)`
    margin-left: 1em;
`;


const NavHeader = ({ accounts }) => {
    return (
        <Box
            border={{ color: 'accent-3', side: 'bottom', size: 'medium' }}
            direction="row"
            alignContent="baseline"
            justify="between"
            fill="horizontal"
        >
            <StyledHeading level="2" color="brand">GROW</StyledHeading>
            <Box direction="row" align="center" alignContent="center" gap="large" color="accent-4" flex="grow" justify="center">
                <StyledNavLink to='/pledges'>Pledge</StyledNavLink>
                <StyledNavLink to='/review'>Review</StyledNavLink>
                <StyledNavLink to='/tokens'>Staking</StyledNavLink>
            </Box>
            <Box alignSelf="center" margin={{ right: 'medium' }}>Account: {accounts[0]}</Box>
        </Box>
    );
};

const mapStateToProps = (state) => ({
    accounts: state.accounts,
});

export default drizzleConnect(NavHeader, mapStateToProps);
