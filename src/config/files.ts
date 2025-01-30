import { DirectoryNode, FileNode } from '@/src/domain/fileSystem/models/FileSystem';

type SampleFileNode = Omit<FileNode, 'id'> | (Omit<DirectoryNode, 'id'> & { children: [] });

export const SAMPLE_FILES: SampleFileNode[] = [
  // Folders in Downloads
  {
    name: 'traits-png',
    type: 'directory',
    path: '/Downloads/traits-png',
    parentId: 'downloads',
    icon: '/icons/folder-16.png',
    children: [],
    stats: {
      size: 0,
      created: new Date('2024-01-29'),
      modified: new Date('2024-01-29'),
      type: 'directory'
    }
  },
  {
    name: 'traits-svg',
    type: 'directory',
    path: '/Downloads/traits-svg',
    parentId: 'downloads',
    icon: '/icons/folder-16.png',
    children: [],
    stats: {
      size: 0,
      created: new Date('2024-01-29'),
      modified: new Date('2024-01-29'),
      type: 'directory'
    }
  },
  {
    name: 'noggles',
    type: 'directory',
    path: '/Downloads/noggles',
    parentId: 'downloads',
    icon: '/icons/folder-16.png',
    children: [],
    stats: {
      size: 0,
      created: new Date('2024-01-29'),
      modified: new Date('2024-01-29'),
      type: 'directory'
    }
  },
  // Files in traits-png folder
  {
    name: 'trait1.png',
    type: 'file',
    path: '/Downloads/traits-png/trait1.png',
    parentId: 'traits-png',
    icon: '/icons/image-16.png',
    downloadUrl: '/files/downloads/traits-png/trait1.png',
    stats: {
      size: 25600,
      created: new Date('2024-01-29'),
      modified: new Date('2024-01-29'),
      type: 'image/png'
    }
  },
  {
    name: 'trait2.png',
    type: 'file',
    path: '/Downloads/traits-png/trait2.png',
    parentId: 'traits-png',
    icon: '/icons/image-16.png',
    downloadUrl: '/files/downloads/traits-png/trait2.png',
    stats: {
      size: 28800,
      created: new Date('2024-01-29'),
      modified: new Date('2024-01-29'),
      type: 'image/png'
    }
  },
  // Files in traits-svg folder
  {
    name: 'trait1.svg',
    type: 'file',
    path: '/Downloads/traits-svg/trait1.svg',
    parentId: 'traits-svg',
    icon: '/icons/image-16.png',
    downloadUrl: '/files/downloads/traits-svg/trait1.svg',
    stats: {
      size: 12800,
      created: new Date('2024-01-29'),
      modified: new Date('2024-01-29'),
      type: 'image/svg+xml'
    }
  },
  {
    name: 'trait2.svg',
    type: 'file',
    path: '/Downloads/traits-svg/trait2.svg',
    parentId: 'traits-svg',
    icon: '/icons/image-16.png',
    downloadUrl: '/files/downloads/traits-svg/trait2.svg',
    stats: {
      size: 14400,
      created: new Date('2024-01-29'),
      modified: new Date('2024-01-29'),
      type: 'image/svg+xml'
    }
  },
  // Files in noggles folder
  {
    name: 'noggle1.pdf',
    type: 'file',
    path: '/Downloads/noggles/noggle1.pdf',
    parentId: 'noggles',
    icon: '/icons/pdf-16.png',
    downloadUrl: '/files/downloads/noggles/noggle1.pdf',
    stats: {
      size: 102400,
      created: new Date('2024-01-29'),
      modified: new Date('2024-01-29'),
      type: 'application/pdf'
    }
  },
  {
    name: 'noggle2.pdf',
    type: 'file',
    path: '/Downloads/noggles/noggle2.pdf',
    parentId: 'noggles',
    icon: '/icons/pdf-16.png',
    downloadUrl: '/files/downloads/noggles/noggle2.pdf',
    stats: {
      size: 115200,
      created: new Date('2024-01-29'),
      modified: new Date('2024-01-29'),
      type: 'application/pdf'
    }
  },
  // Original files
  {
    name: 'readme.txt',
    type: 'file',
    path: '/Documents/readme.txt',
    parentId: 'documents',
    icon: '/icons/text-16.png',
    downloadUrl: '/files/documents/readme.txt',
    stats: {
      size: 1024,
      created: new Date('2024-01-28'),
      modified: new Date('2024-01-28'),
      type: 'text/plain'
    }
  },
  {
    name: 'sample.pdf',
    type: 'file',
    path: '/Documents/sample.pdf',
    parentId: 'documents',
    icon: '/icons/pdf-16.png',
    downloadUrl: '/files/documents/sample.pdf',
    stats: {
      size: 102400,
      created: new Date('2024-01-28'),
      modified: new Date('2024-01-28'),
      type: 'application/pdf'
    }
  },
  {
    name: 'image.jpg',
    type: 'file',
    path: '/Downloads/image.jpg',
    parentId: 'downloads',
    icon: '/icons/image-16.png',
    downloadUrl: '/files/downloads/image.jpg',
    stats: {
      size: 51200,
      created: new Date('2024-01-28'),
      modified: new Date('2024-01-28'),
      type: 'image/jpeg'
    }
  }
]; 