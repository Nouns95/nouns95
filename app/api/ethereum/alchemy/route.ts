import { NextResponse } from 'next/server';
import { serverConfig } from '../../../../src/config/env';

export async function POST(request: Request) {
  const alchemyKey = serverConfig.alchemyApiKey;
  
  if (!alchemyKey) {
    return NextResponse.json({ error: 'Alchemy API key not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const response = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Alchemy API error:', error);
    return NextResponse.json({ error: 'Alchemy request failed' }, { status: 500 });
  }
} 