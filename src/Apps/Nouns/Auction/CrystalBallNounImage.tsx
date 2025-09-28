'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePublicClient } from 'wagmi';
import { buildSVG } from '../domain/utils/svg-builder';
import { ImageData } from '../domain/utils/image-data';
import { keccak256, encodePacked } from 'viem';

interface CrystalBallNounImageProps {
  nounId: string;
  width?: number;
  height?: number;
  className?: string;
}

// Emulates NounsSeeder.sol's pseudorandom part selection
function getPseudorandomPart(pseudorandomness: string, partCount: number, shiftAmount: number): number {
  // Convert the hex string to a BigInt
  const bn = BigInt(pseudorandomness);
  
  // Perform the right shift
  const shifted = bn >> BigInt(shiftAmount);
  
  // Take only the least significant 48 bits (as done in the contract)
  const mask = (BigInt(1) << BigInt(48)) - BigInt(1);
  const masked = shifted & mask;
  
  // Calculate modulo to get the part index
  const result = Number(masked % BigInt(partCount));
  
  // Debug logging for body trait
  if (shiftAmount === 48) { // This is the body trait
    // Calculate body part index
  }
  
  return result;
}

// Emulates NounsSeeder.sol's seed generation
function getNounSeedFromBlockHash(nounId: string, blockHash: string) {
  // Create pseudorandomness by hashing blockHash and nounId together
  const encodedData = encodePacked(
    ['bytes32', 'uint256'],
    [blockHash as `0x${string}`, BigInt(nounId)]
  );
  const pseudorandomness = keccak256(encodedData);

  // Generate seed from block hash and noun ID

  return {
    background: getPseudorandomPart(pseudorandomness, ImageData.bgcolors.length, 0),
    body: getPseudorandomPart(pseudorandomness, ImageData.images.bodies.length, 48),
    accessory: getPseudorandomPart(pseudorandomness, ImageData.images.accessories.length, 96),
    head: getPseudorandomPart(pseudorandomness, ImageData.images.heads.length, 144),
    glasses: getPseudorandomPart(pseudorandomness, ImageData.images.glasses.length, 192),
  };
}

export function CrystalBallNounImage({ nounId, width = 320, height = 320, className }: CrystalBallNounImageProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blockHash, setBlockHash] = useState<string | null>(null);
  
  // Get the public client
  const publicClient = usePublicClient();

  // Subscribe to new blocks
  useEffect(() => {
    if (!publicClient) return;

    const unwatch = publicClient.watchBlocks({
      onBlock: async (block) => {
        const fullBlock = await publicClient.getBlock({ blockHash: block.hash });
        setBlockHash(fullBlock.hash);
        // New block received
      },
    });

    return () => {
      unwatch();
    };
  }, [publicClient]);

  // Generate SVG when block hash changes
  useEffect(() => {
    if (!blockHash || !nounId) return;

    try {
      // Generate seed from block hash
      const seed = getNounSeedFromBlockHash(nounId, blockHash);
      
      // Generate crystal ball body trait
      
      // Get the encoded part data for each component in the correct order:
      // Background color is passed separately to buildSVG
      // The order of parts should be: body, accessory, head, glasses
      const encodedParts = [
        { data: ImageData.images.bodies[seed.body].data },
        { data: ImageData.images.accessories[seed.accessory].data },
        { data: ImageData.images.heads[seed.head].data },
        { data: ImageData.images.glasses[seed.glasses].data }
      ];
      
      // Generate noun parts from seed
      
      const svgData = buildSVG(
        encodedParts,
        ImageData.palette,
        ImageData.bgcolors[seed.background]
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
  }, [nounId, blockHash]);

  if (!blockHash || !svg) return (
    <div style={{ 
      width, 
      height, 
      background: '#c0c0c0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Image
        src="/icons/apps/auction/loading.gif"
        alt="Loading..."
        width={320}
        height={320}
        style={{ imageRendering: 'pixelated' }}
        unoptimized
      />
    </div>
  );
  if (error) return <div>{error}</div>;

  return (
    <Image
      src={svg}
      alt={`Future Noun ${nounId}`}
      width={width}
      height={height}
      style={{ imageRendering: 'pixelated' }}
      className={className}
      unoptimized
    />
  );
} 