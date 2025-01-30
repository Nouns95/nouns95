import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import mime from 'mime-types';

const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean).slice(2);
  
  try {
    const relativePath = pathSegments.join('/');
    const filePath = path.join(process.cwd(), 'public', 'files', relativePath);
    const publicFilesPath = path.join(process.cwd(), 'public', 'files');
    
    if (!filePath.startsWith(publicFilesPath)) {
      console.error('Invalid path access attempt:', filePath);
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    const stats = await stat(filePath);
    if (!stats.isFile()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 });
    }

    const buffer = await readFile(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
} 