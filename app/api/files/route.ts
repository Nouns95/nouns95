import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

interface FileStats {
  size: number;
  created: Date;
  modified: Date;
  type: string;
}

interface FileSystemItem {
  name: string;
  type: 'directory' | 'file';
  stats: FileStats;
}

type StaticFileSystem = {
  [path: string]: FileSystemItem[];
};

// Static structure for production
const STATIC_STRUCTURE: StaticFileSystem = {
  '/files': [
    {
      name: 'documents',
      type: 'directory',
      stats: {
        size: 0,
        created: new Date(),
        modified: new Date(),
        type: 'directory'
      }
    },
    {
      name: 'downloads',
      type: 'directory',
      stats: {
        size: 0,
        created: new Date(),
        modified: new Date(),
        type: 'directory'
      }
    }
  ],
  '/files/documents': [
    {
      name: 'readme.txt',
      type: 'file',
      stats: {
        size: 1024,
        created: new Date(),
        modified: new Date(),
        type: 'text/plain'
      }
    },
    {
      name: 'sample.pdf',
      type: 'file',
      stats: {
        size: 102400,
        created: new Date(),
        modified: new Date(),
        type: 'application/pdf'
      }
    }
  ],
  '/files/downloads': [
    {
      name: 'traits-png',
      type: 'directory',
      stats: {
        size: 0,
        created: new Date(),
        modified: new Date(),
        type: 'directory'
      }
    },
    {
      name: 'traits-svg',
      type: 'directory',
      stats: {
        size: 0,
        created: new Date(),
        modified: new Date(),
        type: 'directory'
      }
    },
    {
      name: 'noggles',
      type: 'directory',
      stats: {
        size: 0,
        created: new Date(),
        modified: new Date(),
        type: 'directory'
      }
    },
    {
      name: 'image.jpg',
      type: 'file',
      stats: {
        size: 51200,
        created: new Date(),
        modified: new Date(),
        type: 'image/jpeg'
      }
    }
  ],
  '/files/downloads/traits-png': [
    {
      name: 'trait1.png',
      type: 'file',
      stats: {
        size: 25600,
        created: new Date(),
        modified: new Date(),
        type: 'image/png'
      }
    },
    {
      name: 'trait2.png',
      type: 'file',
      stats: {
        size: 28800,
        created: new Date(),
        modified: new Date(),
        type: 'image/png'
      }
    }
  ],
  '/files/downloads/traits-svg': [
    {
      name: 'trait1.svg',
      type: 'file',
      stats: {
        size: 12800,
        created: new Date(),
        modified: new Date(),
        type: 'image/svg+xml'
      }
    },
    {
      name: 'trait2.svg',
      type: 'file',
      stats: {
        size: 14400,
        created: new Date(),
        modified: new Date(),
        type: 'image/svg+xml'
      }
    }
  ],
  '/files/downloads/noggles': [
    {
      name: 'noggle1.pdf',
      type: 'file',
      stats: {
        size: 102400,
        created: new Date(),
        modified: new Date(),
        type: 'application/pdf'
      }
    },
    {
      name: 'noggle2.pdf',
      type: 'file',
      stats: {
        size: 115200,
        created: new Date(),
        modified: new Date(),
        type: 'application/pdf'
      }
    }
  ]
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestPath = searchParams.get('path');

  if (!requestPath) {
    return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 });
  }

  try {
    // In production, use static structure
    if (process.env.NODE_ENV === 'production') {
      const contents = STATIC_STRUCTURE[requestPath] || [];
      return NextResponse.json(contents);
    }

    // In development, read from filesystem
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
    const contents = await Promise.all(
      files.map(async (name) => {
        const fullPath = path.join(safePath, name);
        const stats = await stat(fullPath);
        const isDirectory = stats.isDirectory();

        return {
          name,
          type: isDirectory ? 'directory' as const : 'file' as const,
          stats: {
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            type: isDirectory ? 'directory' : path.extname(name).slice(1) || 'file'
          }
        };
      })
    );

    return NextResponse.json(contents);
  } catch (error) {
    console.error('Error reading directory:', error);
    return NextResponse.json({ error: 'Failed to read directory' }, { status: 500 });
  }
} 