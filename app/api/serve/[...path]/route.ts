import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import mime from 'mime-types';

const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'files', ...params.path);
    const publicFilesPath = path.join(process.cwd(), 'public', 'files');
    
    console.log('Serving file:', {
      params,
      filePath,
      publicFilesPath
    });
    
    // Security check: ensure the path is within the public/files directory
    if (!filePath.startsWith(publicFilesPath)) {
      console.error('Invalid path access attempt:', filePath);
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    // Check if file exists
    try {
      const stats = await stat(filePath);
      console.log('File stats:', {
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      });
    } catch (error) {
      console.error('File not found:', {
        error,
        filePath
      });
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read file
    const buffer = await readFile(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';

    console.log('Serving file with type:', {
      mimeType,
      size: buffer.length
    });

    // Return file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error serving file:', {
      error,
      params,
      filePath: path.join(process.cwd(), 'public', 'files', ...params.path)
    });
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
} 