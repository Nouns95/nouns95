import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestPath = searchParams.get('path');

  if (!requestPath) {
    return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 });
  }

  try {
    const relativePath = requestPath === '/files' 
      ? '' 
      : requestPath.replace('/files/', '');
    
    const safePath = path.join(process.cwd(), 'public', 'files', relativePath);
    const publicFilesPath = path.join(process.cwd(), 'public', 'files');
    
    if (!safePath.startsWith(publicFilesPath)) {
      console.error('Invalid path access attempt:', safePath);
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    const files = await readdir(safePath);
    const contents = await Promise.all(
      files.map(async (name) => {
        const fullPath = path.join(safePath, name);
        const stats = await stat(fullPath);
        const isDirectory = stats.isDirectory();

        const downloadPath = requestPath === '/files'
          ? `/files/${name}`
          : `${requestPath}/${name}`;

        return {
          name,
          type: isDirectory ? 'directory' : 'file',
          stats: {
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            type: isDirectory ? 'directory' : path.extname(name).slice(1) || 'file'
          },
          downloadUrl: !isDirectory ? downloadPath : undefined
        };
      })
    );

    return NextResponse.json(contents);
  } catch (error) {
    console.error('Error reading directory:', error);
    return NextResponse.json({ error: 'Failed to read directory' }, { status: 500 });
  }
} 