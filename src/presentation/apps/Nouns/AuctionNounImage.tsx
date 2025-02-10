'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import Image from 'next/image';
import { CURRENT_AUCTION_QUERY } from '../../../domain/apps/nouns/graphql/queries/auction';
import type { AuctionsQueryResponse } from '../../../domain/apps/nouns/types/graphql';
import { buildSVG } from './utils/svg-builder';
import { ImageData } from './utils/image-data';

interface NounImageProps {
  width?: number;
  height?: number;
}

export default function AuctionNounImage({ width = 320, height = 320 }: NounImageProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data, loading, error: queryError } = useQuery<AuctionsQueryResponse>(CURRENT_AUCTION_QUERY);

  // Extract auction data to a memoized value
  const currentAuctionSeed = data?.auctions?.[0]?.noun?.seed;

  useEffect(() => {
    if (currentAuctionSeed) {
      const convertedSeed = {
        background: Number(currentAuctionSeed.background),
        body: Number(currentAuctionSeed.body),
        accessory: Number(currentAuctionSeed.accessory),
        head: Number(currentAuctionSeed.head),
        glasses: Number(currentAuctionSeed.glasses)
      };
      
      try {
        // Get the encoded part data for each component
        const encodedParts = [
          { data: ImageData.images.bodies[convertedSeed.background].data },
          { data: ImageData.images.bodies[convertedSeed.body].data },
          { data: ImageData.images.accessories[convertedSeed.accessory].data },
          { data: ImageData.images.heads[convertedSeed.head].data },
          { data: ImageData.images.glasses[convertedSeed.glasses].data }
        ];
        
        const svgData = buildSVG(
          encodedParts,
          ImageData.palette,
          ImageData.bgcolors[0]
        );
        
        setSvg(`data:image/svg+xml;base64,${btoa(svgData)}`);
        setError(null);
      } catch (err) {
        if (err instanceof Error) {
          setError('Failed to generate SVG: ' + err.message);
        } else {
          setError('Failed to generate SVG: An unknown error occurred');
        }
      }
    }
  }, [currentAuctionSeed]); // Only depend on the seed data

  if (loading) return (
    <div 
      style={{ 
        width: width, 
        height: height, 
        background: '#c0c0c0',
        border: '2px solid',
        borderColor: '#808080 #ffffff #ffffff #808080'
      }} 
    />
  );
  if (queryError) return <div>Error loading Noun</div>;
  if (error) return <div>{error}</div>;
  if (!svg) return null;

  return (
    <Image
      src={svg}
      alt="Noun"
      width={width}
      height={height}
      style={{ imageRendering: 'pixelated' }}
      unoptimized
    />
  );
} 