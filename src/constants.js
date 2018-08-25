export const PENDING = 'Pending';
export const SUBMITTED = 'Submitted';
export const ASSIGNED = 'Assigned';
export const ACCEPTED = 'Accepted';
export const REJECTED = 'Rejected';
export const EXPIRED = 'Expired';

export const ProofState = {
    '0': {
        display: PENDING,
        status: 'unknown',
    },
    0: {
        display: PENDING,
        status: 'unknown',
    },
    '1': {
        display: SUBMITTED,
        status: 'warning'
    },
    '2': {
        display: ASSIGNED,
        status: 'warning'
    },
    '3': {
        display: ACCEPTED,
        status: 'ok',
    },
    '4': {
        display: REJECTED,
        status: 'error'
    },
    '5': {
        display: EXPIRED,
        status: 'critical'
    },
};

// TODO - make this match above
export const PledgeState = {
    '0': 'Active',
    '1': "Completed",
    '2': 'Expired',
};

export const activeProofStates = ['0', '1', '2'];

