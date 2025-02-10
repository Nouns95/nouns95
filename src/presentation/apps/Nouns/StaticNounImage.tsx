'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import Image from 'next/image';
import { NOUN_BY_ID_QUERY } from '../../../domain/apps/nouns/graphql/queries/noun';
import { buildSVG } from './utils/svg-builder';
import { ImageData } from './utils/image-data';

interface StaticNounImageProps {
  nounId: string;
  width?: number;
  height?: number;
}

interface NounQueryResponse {
  noun: {
    id: string;
    seed: {
      background: string;
      body: string;
      accessory: string;
      head: string;
      glasses: string;
    };
  };
}

export function StaticNounImage({ nounId, width = 320, height = 320 }: StaticNounImageProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data, loading, error: queryError } = useQuery<NounQueryResponse>(NOUN_BY_ID_QUERY, {
    variables: { id: nounId }
  });

  useEffect(() => {
    if (data?.noun?.seed) {
      const graphqlSeed = data.noun.seed;
      const convertedSeed = {
        background: Number(graphqlSeed.background),
        body: Number(graphqlSeed.body),
        accessory: Number(graphqlSeed.accessory),
        head: Number(graphqlSeed.head),
        glasses: Number(graphqlSeed.glasses)
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
  }, [data?.noun?.seed]);

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
      alt={`Noun ${nounId}`}
      width={width}
      height={height}
      style={{ imageRendering: 'pixelated' }}
      unoptimized
    />
  );
} 