const NounsProxyABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'timelock_',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'nouns_',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'vetoer_',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'admin_',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'implementation_',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'votingPeriod_',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'votingDelay_',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'proposalThresholdBPS_',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'quorumVotesBPS_',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'oldAdmin',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'newAdmin',
        type: 'address',
      },
    ],
    name: 'NewAdmin',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'oldImplementation',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'newImplementation',
        type: 'address',
      },
    ],
    name: 'NewImplementation',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'oldPendingAdmin',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'newPendingAdmin',
        type: 'address',
      },
    ],
    name: 'NewPendingAdmin',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'oldVetoer',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'newVetoer',
        type: 'address',
      },
    ],
    name: 'NewVetoer',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'ProposalCanceled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'proposer',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address[]',
        name: 'targets',
        type: 'address[]',
      },
      {
        indexed: false,
        internalType: 'uint256[]',
        name: 'values',
        type: 'uint256[]',
      },
      {
        indexed: false,
        internalType: 'string[]',
        name: 'signatures',
        type: 'string[]',
      },
      {
        indexed: false,
        internalType: 'bytes[]',
        name: 'calldatas',
        type: 'bytes[]',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'startBlock',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'endBlock',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'description',
        type: 'string',
      },
    ],
    name: 'ProposalCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'proposer',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address[]',
        name: 'targets',
        type: 'address[]',
      },
      {
        indexed: false,
        internalType: 'uint256[]',
        name: 'values',
        type: 'uint256[]',
      },
      {
        indexed: false,
        internalType: 'string[]',
        name: 'signatures',
        type: 'string[]',
      },
      {
        indexed: false,
        internalType: 'bytes[]',
        name: 'calldatas',
        type: 'bytes[]',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'startBlock',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'endBlock',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'proposalThreshold',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'quorumVotes',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'description',
        type: 'string',
      },
    ],
    name: 'ProposalCreatedWithRequirements',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'ProposalExecuted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'eta',
        type: 'uint256',
      },
    ],
    name: 'ProposalQueued',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oldProposalThresholdBPS',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newProposalThresholdBPS',
        type: 'uint256',
      },
    ],
    name: 'ProposalThresholdBPSSet',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'ProposalVetoed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oldQuorumVotesBPS',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newQuorumVotesBPS',
        type: 'uint256',
      },
    ],
    name: 'QuorumVotesBPSSet',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'voter',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint8',
        name: 'support',
        type: 'uint8',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'votes',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'reason',
        type: 'string',
      },
    ],
    name: 'VoteCast',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oldVotingDelay',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newVotingDelay',
        type: 'uint256',
      },
    ],
    name: 'VotingDelaySet',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oldVotingPeriod',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newVotingPeriod',
        type: 'uint256',
      },
    ],
    name: 'VotingPeriodSet',
    type: 'event',
  },
  {
    inputs: [],
    name: 'BALLOT_TYPEHASH',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'DOMAIN_TYPEHASH',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MAX_PROPOSAL_THRESHOLD_BPS',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MAX_QUORUM_VOTES_BPS',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MIN_PROPOSAL_THRESHOLD_BPS',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MIN_QUORUM_VOTES_BPS',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'admin',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'implementation',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nouns',
    outputs: [
      {
        internalType: 'contract NounsTokenLike',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pendingAdmin',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'proposalCount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'proposalMaxOperations',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'proposalThresholdBPS',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'quorumVotesBPS',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'state',
    outputs: [
      {
        internalType: 'enum NounsDAOInterfaces.ProposalState',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'timelock',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'vetoer',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'votingDelay',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'votingPeriod',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

export default NounsProxyABI;
