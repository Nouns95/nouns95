import { NextResponse } from 'next/server';
import { serverConfig } from '../../../../src/lib/config/env';

export async function POST(request: Request) {
  const rpcUrl = serverConfig.solanaRpcUrl;
  
  if (!rpcUrl) {
    return NextResponse.json({ error: 'RPC URL not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Solana RPC error:', error);
    return NextResponse.json({ error: 'RPC request failed' }, { status: 500 });
  }
} 