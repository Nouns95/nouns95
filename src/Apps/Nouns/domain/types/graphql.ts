// GraphQL Scalar Types
export type BigInt = string;
export type ID = string;
export type Bytes = string;

// Enum Types
export enum OrderDirection {
  asc = 'asc',
  desc = 'desc'
}

export enum Bid_orderBy {
  id = 'id',
  amount = 'amount',
  blockNumber = 'blockNumber',
  blockTimestamp = 'blockTimestamp',
  txIndex = 'txIndex',
  bidder = 'bidder'
}

export enum ProposalStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  VETOED = 'VETOED',
  EXECUTED = 'EXECUTED',
  QUEUED = 'QUEUED',
  DEFEATED = 'DEFEATED'
}

export enum Delegate_orderBy {
  id = 'id',
  delegatedVotes = 'delegatedVotes',
  tokenHoldersRepresentedAmount = 'tokenHoldersRepresentedAmount'
}

export enum Vote_orderBy {
  id = 'id',
  support = 'support',
  votes = 'votes',
  blockNumber = 'blockNumber'
}

export enum ProposalFeedback_orderBy {
  id = 'id',
  createdTimestamp = 'createdTimestamp',
  supportType = 'supportType'
}

export enum Account_orderBy {
  id = 'id',
  tokenBalance = 'tokenBalance',
  nouns = 'nouns'
}

export enum Noun_orderBy {
  id = 'id',
  seed = 'seed',
  owner = 'owner'
}

export enum Proposal_orderBy {
  id = 'id',
  proposer = 'proposer',
  status = 'status',
  createdTimestamp = 'createdTimestamp',
  createdBlock = 'createdBlock'
}

export enum ProposalCandidateVersion_orderBy {
  id = 'id',
  createdTimestamp = 'createdTimestamp',
  createdBlock = 'createdBlock',
  content = 'content',
  title = 'title'
}

export enum CandidateFeedback_orderBy {
  id = 'id',
  createdTimestamp = 'createdTimestamp',
  createdBlock = 'createdBlock',
  supportDetailed = 'supportDetailed',
  votes = 'votes'
}

// Common Types
export interface NounSeed {
  background: number;
  body: number;
  accessory: number;
  head: number;
  glasses: number;
}

export interface Account {
  id: string;
}

export interface Noun extends BaseResponse {
  seed: NounSeed;
  owner: Account;
  votes: {
    skip?: number;
    first?: number;
    orderBy?: Vote_orderBy;
    orderDirection?: OrderDirection;
    where?: Vote_filter;
  };
}

// Base Response Types
export interface BaseResponse {
  id: string;
}

// Pagination Input Types
export interface PaginationInput {
  first?: number;
  skip?: number;
}

// Filter Types
export interface Bid_filter {
  id?: ID | null;
  id_not?: ID | null;
  id_gt?: ID | null;
  id_lt?: ID | null;
  id_gte?: ID | null;
  id_lte?: ID | null;
  id_in?: ID[] | null;
  id_not_in?: ID[] | null;
  amount?: BigInt | null;
  amount_not?: BigInt | null;
  amount_gt?: BigInt | null;
  amount_lt?: BigInt | null;
  amount_gte?: BigInt | null;
  amount_lte?: BigInt | null;
  amount_in?: BigInt[] | null;
  amount_not_in?: BigInt[] | null;
}

export interface Delegate_filter {
  id?: ID | null;
  id_not?: ID | null;
  id_gt?: ID | null;
  id_lt?: ID | null;
  id_gte?: ID | null;
  id_lte?: ID | null;
  id_in?: ID[] | null;
  id_not_in?: ID[] | null;
}

export interface Vote_filter {
  id?: ID | null;
  proposal?: string | null;
  support?: boolean | null;
  voter?: string | null;
}

export interface ProposalFeedback_filter {
  id?: ID | null;
  proposal?: string | null;
  supportType?: string | null;
}

export interface Account_filter {
  id?: ID | null;
  tokenBalance_gt?: number | null;
}

export interface Noun_filter {
  id?: ID | null;
  owner?: string | null;
}

export interface Proposal_filter {
  id?: ID | null;
  status?: ProposalStatus | null;
  status_in?: ProposalStatus[] | null;
}

export interface ProposalCandidateVersion_filter {
  id?: ID | null;
  createdTimestamp_gt?: BigInt | null;
  createdBlock_gt?: BigInt | null;
}

// Entity Types
export interface Bid extends BaseResponse {
  amount: BigInt;
  blockNumber: BigInt;
  blockTimestamp: BigInt;
  txIndex: number;
  bidder: Account;
}

export interface Auction extends BaseResponse {
  noun: Noun;
  amount: BigInt;
  startTime: BigInt;
  endTime: BigInt;
  bidder: Account | null;
  settled: boolean;
  clientId: number;
  bids: {
    skip?: number;
    first?: number;
    orderBy?: Bid_orderBy;
    orderDirection?: OrderDirection;
    where?: Bid_filter;
  };
}

export interface Delegate extends BaseResponse {
  delegatedVotesRaw: BigInt;
  delegatedVotes: BigInt;
  tokenHoldersRepresentedAmount: number;
  tokenHoldersRepresented: {
    skip?: number;
    first?: number;
    orderBy?: Account_orderBy;
    orderDirection?: OrderDirection;
    where?: Account_filter;
  };
  nounsRepresented: {
    skip?: number;
    first?: number;
    orderBy?: Noun_orderBy;
    orderDirection?: OrderDirection;
    where?: Noun_filter;
  };
  votes: {
    skip?: number;
    first?: number;
    orderBy?: Vote_orderBy;
    orderDirection?: OrderDirection;
    where?: Vote_filter;
  };
  proposals: {
    skip?: number;
    first?: number;
    orderBy?: Proposal_orderBy;
    orderDirection?: OrderDirection;
    where?: Proposal_filter;
  };
}

export interface Vote extends BaseResponse {
  proposal: Proposal;
  support: boolean;
  votes: BigInt;
  voter: Account;
  blockNumber: BigInt;
}

export interface ProposalFeedback extends BaseResponse {
  proposal: Proposal;
  supportType: string;
  createdTimestamp: BigInt;
}

export interface Proposal extends BaseResponse {
  proposer: Delegate;
  signers: {
    skip?: number;
    first?: number;
    orderBy?: Delegate_orderBy;
    orderDirection?: OrderDirection;
    where?: Delegate_filter;
  };
  targets: Bytes[];
  values: BigInt[];
  signatures: string[];
  calldatas: Bytes[];
  createdTimestamp: BigInt;
  createdBlock: BigInt;
  lastUpdatedTimestamp: BigInt;
  lastUpdatedBlock: BigInt;
  createdTransactionHash: Bytes;
  lastUpdatedTransactionHash: Bytes;
  startBlock: BigInt;
  endBlock: BigInt;
  proposalThreshold: BigInt | null;
  quorumVotes: BigInt | null;
  forVotes: BigInt;
  againstVotes: BigInt;
  abstainVotes: BigInt;
  title: string;
  description: string;
  status: ProposalStatus | null;
  executionETA: BigInt | null;
  votes: {
    skip?: number;
    first?: number;
    orderBy?: Vote_orderBy;
    orderDirection?: OrderDirection;
    where?: Vote_filter;
  };
  totalSupply: BigInt;
  adjustedTotalSupply: BigInt;
  minQuorumVotesBPS: number;
  maxQuorumVotesBPS: number;
  quorumCoefficient: BigInt;
  objectionPeriodEndBlock: BigInt;
  updatePeriodEndBlock: BigInt | null;
  feedbackPosts: {
    skip?: number;
    first?: number;
    orderBy?: ProposalFeedback_orderBy;
    orderDirection?: OrderDirection;
    where?: ProposalFeedback_filter;
  };
  onTimelockV1: boolean | null;
  voteSnapshotBlock: BigInt;
  canceledBlock: BigInt | null;
  canceledTimestamp: BigInt | null;
  canceledTransactionHash: Bytes | null;
  executedBlock: BigInt | null;
  executedTimestamp: BigInt | null;
  executedTransactionHash: Bytes | null;
  vetoedBlock: BigInt | null;
  vetoedTimestamp: BigInt | null;
  vetoedTransactionHash: Bytes | null;
  queuedBlock: BigInt | null;
  queuedTimestamp: BigInt | null;
  queuedTransactionHash: Bytes | null;
  clientId: number;
}

export interface TransferEvent extends BaseResponse {
  noun: Noun;
  previousHolder: Account;
  newHolder: Account;
  blockNumber: BigInt;
  blockTimestamp: BigInt;
}

export interface DelegationEvent extends BaseResponse {
  noun: Noun;
  delegator: Account;
  previousDelegate: Delegate;
  newDelegate: Delegate;
  blockNumber: BigInt;
  blockTimestamp: BigInt;
}

export interface ProposalCandidateVersion extends BaseResponse {
  createdTimestamp: BigInt;
  createdBlock: BigInt;
  content: string;
  title: string;
  description: string;
  targets: Bytes[];
  values: BigInt[];
  signatures: string[];
  calldatas: Bytes[];
}

export interface ProposalCandidate extends BaseResponse {
  proposer: Bytes;
  slug: string;
  createdTransactionHash: Bytes;
  createdTimestamp: BigInt;
  createdBlock: BigInt;
  lastUpdatedTimestamp: BigInt;
  lastUpdatedBlock: BigInt;
  canceled: boolean;
  canceledTimestamp: BigInt | null;
  canceledBlock: BigInt | null;
  canceledTransactionHash: Bytes | null;
  latestVersion: ProposalCandidateVersion;
  versions: {
    skip?: number;
    first?: number;
    orderBy?: ProposalCandidateVersion_orderBy;
    orderDirection?: OrderDirection;
    where?: ProposalCandidateVersion_filter;
  };
  number: BigInt;
}

export interface CandidateFeedback extends BaseResponse {
  createdTimestamp: BigInt;
  createdBlock: BigInt;
  candidate: ProposalCandidate;
  voter: Delegate;
  supportDetailed: number; // 0: against, 1: for, 2: abstain
  votes: BigInt;
  reason: string | null;
}

export interface CandidateFeedback_filter {
  id?: ID | null;
  candidate?: string | null;
  voter?: string | null;
  supportDetailed?: number | null;
  supportDetailed_in?: number[] | null;
  votes_gt?: BigInt | null;
}

// Query Response Types
export interface AuctionQueryResponse {
  auction: Auction;
}

export interface AuctionsQueryResponse {
  auctions: Auction[];
}

export interface ProposalQueryResponse {
  proposal: Proposal;
}

export interface ProposalsQueryResponse {
  proposals: Proposal[];
}

export interface DelegateQueryResponse {
  delegate: Delegate;
}

export interface DelegatesQueryResponse {
  delegates: Delegate[];
}

export interface TransferEventQueryResponse {
  transfer: TransferEvent;
}

export interface TransferEventsQueryResponse {
  transfers: TransferEvent[];
}

export interface DelegationEventQueryResponse {
  delegation: DelegationEvent;
}

export interface DelegationEventsQueryResponse {
  delegations: DelegationEvent[];
}

export interface ProposalCandidateQueryResponse {
  proposalCandidate: ProposalCandidate;
}

export interface ProposalCandidatesQueryResponse {
  proposalCandidates: ProposalCandidate[];
}

export interface CandidateFeedbackQueryResponse {
  candidateFeedback: CandidateFeedback;
}

export interface CandidateFeedbacksQueryResponse {
  candidateFeedbacks: CandidateFeedback[];
}

// Query Variables
export interface AuctionQueryVariables {
  id: string;
}

export interface AuctionsQueryVariables extends PaginationInput {
  orderBy?: string;
  orderDirection?: OrderDirection;
  where?: {
    settled?: boolean;
  };
}

export interface ProposalQueryVariables {
  id: string;
}

export interface ProposalsQueryVariables extends PaginationInput {
  orderBy?: string;
  orderDirection?: OrderDirection;
  where?: {
    status_in?: ProposalStatus[];
  };
}

export interface DelegateQueryVariables {
  id: string;
}

export interface DelegatesQueryVariables extends PaginationInput {
  orderBy?: string;
  orderDirection?: OrderDirection;
  where?: {
    id?: string;
    delegatedVotes_gt?: string;
  };
}

export interface TransferEventQueryVariables {
  id: string;
}

export interface TransferEventsQueryVariables extends PaginationInput {
  orderBy?: string;
  orderDirection?: OrderDirection;
  where?: {
    noun?: string;
    previousHolder?: string;
    newHolder?: string;
  };
}

export interface DelegationEventQueryVariables {
  id: string;
}

export interface DelegationEventsQueryVariables extends PaginationInput {
  orderBy?: string;
  orderDirection?: OrderDirection;
  where?: {
    noun?: string;
    delegator?: string;
    previousDelegate?: string;
    newDelegate?: string;
  };
}

export interface ProposalCandidateQueryVariables {
  id: string;
}

export interface ProposalCandidatesQueryVariables extends PaginationInput {
  orderBy?: string;
  orderDirection?: OrderDirection;
  where?: {
    proposer?: string;
    canceled?: boolean;
    slug?: string;
  };
}

export interface CandidateFeedbackQueryVariables {
  id: string;
}

export interface CandidateFeedbacksQueryVariables extends PaginationInput {
  orderBy?: string;
  orderDirection?: OrderDirection;
  where?: {
    candidate?: string;
    voter?: string;
    supportDetailed?: number;
    supportDetailed_in?: number[];
  };
}

// Query Response Types for Nouns
export interface NounQueryResponse {
  noun: Noun;
}

export interface NounsQueryResponse {
  nouns: Noun[];
}

export interface NounQueryVariables {
  id: string;
}

export interface NounsQueryVariables extends PaginationInput {
  orderBy?: string;
  orderDirection?: OrderDirection;
  where?: {
    owner?: string;
  };
} 