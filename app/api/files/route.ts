import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

interface FileSystemItem {
  name: string;
  type: 'directory' | 'file';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestPath = searchParams.get('path');

  if (!requestPath) {
    return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 });
  }

  try {
    const relativePath = requestPath === '/files' 
      ? '' 
      : requestPath.startsWith('/files/') 
        ? requestPath.slice(7) // Remove '/files/' prefix
        : requestPath;
    
    const safePath = path.join(process.cwd(), 'public', 'files', relativePath);
    const publicFilesPath = path.join(process.cwd(), 'public', 'files');
    
    // Ensure the path exists and is within public/files
    if (!fs.existsSync(safePath)) {
      console.error('Path does not exist:', safePath);
      return NextResponse.json([]);
    }

    if (!safePath.startsWith(publicFilesPath)) {
      console.error('Invalid path access attempt:', safePath);
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    const files = await readdir(safePath);
    const contents: FileSystemItem[] = await Promise.all(
      files.map(async (name): Promise<FileSystemItem> => {
        const fullPath = path.join(safePath, name);
        const stats = await stat(fullPath);
        const isDirectory = stats.isDirectory();

        return {
          name,
          type: isDirectory ? 'directory' : 'file'
        };
      })
    );

    return NextResponse.json(contents);
  } catch (error) {
    console.error('Error reading directory:', error);
    return NextResponse.json({ error: 'Failed to read directory' }, { status: 500 });
  }
} 