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
    // Ensure the path is within the public/files directory
    const safePath = path.join(process.cwd(), 'public', requestPath);
    const publicFilesPath = path.join(process.cwd(), 'public', 'files');
    
    console.log('Reading directory:', {
      requestPath,
      safePath,
      publicFilesPath
    });

    if (!safePath.startsWith(publicFilesPath)) {
      console.error('Invalid path access attempt:', safePath);
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    const files = await readdir(safePath);
    console.log('Found files:', files);

    const contents = await Promise.all(
      files.map(async (name) => {
        const fullPath = path.join(safePath, name);
        const stats = await stat(fullPath);
        const isDirectory = stats.isDirectory();

        // Get relative path for download URL
        const relativePath = path.relative(
          path.join(process.cwd(), 'public'),
          fullPath
        ).replace(/\\/g, '/');

        const item = {
          name,
          type: isDirectory ? 'directory' : 'file',
          stats: {
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            type: isDirectory ? 'directory' : path.extname(name).slice(1) || 'file'
          },
          downloadUrl: !isDirectory ? `/${relativePath}` : undefined
        };

        console.log('Processed item:', {
          name,
          type: item.type,
          path: fullPath,
          relativePath,
          downloadUrl: item.downloadUrl,
          stats: item.stats
        });

        return item;
      })
    );

    return NextResponse.json(contents);
  } catch (error) {
    console.error('Error reading directory:', {
      error,
      requestPath,
      safePath: path.join(process.cwd(), 'public', requestPath)
    });
    return NextResponse.json({ error: 'Failed to read directory' }, { status: 500 });
  }
} 