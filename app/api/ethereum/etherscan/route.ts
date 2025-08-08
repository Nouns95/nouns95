import { NextResponse } from 'next/server';
import { serverConfig } from '../../../../src/lib/config/env';

export async function GET(request: Request) {
  const etherscanKey = serverConfig.etherscanApiKey;
  
  if (!etherscanKey) {
    return NextResponse.json({ error: 'Etherscan API key not configured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const address = searchParams.get('address');
    const moduleType = searchParams.get('moduleType');

    if (!moduleType || !action || !address) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const response = await fetch(
      `https://api.etherscan.io/api?module=${moduleType}&action=${action}&address=${address}&apikey=${etherscanKey}`
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Etherscan API error:', error);
    return NextResponse.json({ error: 'Etherscan request failed' }, { status: 500 });
  }
} 