import { gql } from '@apollo/client';
import type { AuctionsQueryResponse } from '../../types/graphql';

export const CURRENT_AUCTION_QUERY = gql`
  query CurrentAuction {
    auctions(first: 1, orderBy: startTime, orderDirection: desc) {
      id
      amount
      startTime
      endTime
      settled
      bids(orderBy: amount, orderDirection: desc) {
        id
        amount
        blockNumber
        blockTimestamp
        txIndex
        bidder {
          id
        }
      }
      noun {
        id
        owner {
          id
        }
        seed {
          background
          body
          accessory
          head
          glasses
        }
      }
    }
  }
`;

export type CurrentAuctionQuery = {
  data: AuctionsQueryResponse;
};

export const AUCTION_HISTORY_QUERY = gql`
  query AuctionHistory($nounId: String!) {
    auctions(
      where: { noun: $nounId }
      first: 1
    ) {
      id
      amount
      startTime
      endTime
      settled
      bids(orderBy: amount, orderDirection: desc) {
        id
        amount
        blockNumber
        blockTimestamp
        txIndex
        bidder {
          id
        }
      }
      noun {
        id
        owner {
          id
        }
        seed {
          background
          body
          accessory
          head
          glasses
        }
      }
    }
  }
`;

export type AuctionHistoryQuery = {
  data: AuctionsQueryResponse;
  variables: {
    nounId: string;
  };
}; 