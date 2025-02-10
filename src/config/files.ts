import { DirectoryNode, FileNode } from '@/src/domain/apps/fileSystem/models/FileSystem';

type SampleFileNode = Omit<FileNode, 'id'> | (Omit<DirectoryNode, 'id'> & { children: [] });

export const SAMPLE_FILES: SampleFileNode[] = [
  // Folders in Downloads
  {
    name: 'traits-png',
    type: 'directory',
    path: '/Downloads/traits-png',
    parentId: 'downloads',
    icon: '/icons/folder-16.png',
    children: []
  },
  {
    name: 'traits-svg',
    type: 'directory',
    path: '/Downloads/traits-svg',
    parentId: 'downloads',
    icon: '/icons/folder-16.png',
    children: []
  },
  {
    name: 'noggles',
    type: 'directory',
    path: '/Downloads/noggles',
    parentId: 'downloads',
    icon: '/icons/folder-16.png',
    children: []
  },
  // Files in traits-png folder
  {
    name: 'trait1.png',
    type: 'file',
    path: '/Downloads/traits-png/trait1.png',
    parentId: 'traits-png',
    icon: '/icons/image-16.png',
    downloadUrl: '/files/downloads/traits-png/trait1.png'
  },
  {
    name: 'trait2.png',
    type: 'file',
    path: '/Downloads/traits-png/trait2.png',
    parentId: 'traits-png',
    icon: '/icons/image-16.png',
    downloadUrl: '/files/downloads/traits-png/trait2.png'
  },
  // Files in traits-svg folder
  {
    name: 'trait1.svg',
    type: 'file',
    path: '/Downloads/traits-svg/trait1.svg',
    parentId: 'traits-svg',
    icon: '/icons/image-16.png',
    downloadUrl: '/files/downloads/traits-svg/trait1.svg'
  },
  {
    name: 'trait2.svg',
    type: 'file',
    path: '/Downloads/traits-svg/trait2.svg',
    parentId: 'traits-svg',
    icon: '/icons/image-16.png',
    downloadUrl: '/files/downloads/traits-svg/trait2.svg'
  },
  // Files in noggles folder
  {
    name: 'noggle1.pdf',
    type: 'file',
    path: '/Downloads/noggles/noggle1.pdf',
    parentId: 'noggles',
    icon: '/icons/pdf-16.png',
    downloadUrl: '/files/downloads/noggles/noggle1.pdf'
  },
  {
    name: 'noggle2.pdf',
    type: 'file',
    path: '/Downloads/noggles/noggle2.pdf',
    parentId: 'noggles',
    icon: '/icons/pdf-16.png',
    downloadUrl: '/files/downloads/noggles/noggle2.pdf'
  },
  // Original files
  {
    name: 'readme.txt',
    type: 'file',
    path: '/Documents/readme.txt',
    parentId: 'documents',
    icon: '/icons/text-16.png',
    downloadUrl: '/files/documents/readme.txt'
  },
  {
    name: 'sample.pdf',
    type: 'file',
    path: '/Documents/sample.pdf',
    parentId: 'documents',
    icon: '/icons/pdf-16.png',
    downloadUrl: '/files/documents/sample.pdf'
  },
  {
    name: 'image.jpg',
    type: 'file',
    path: '/Downloads/image.jpg',
    parentId: 'downloads',
    icon: '/icons/image-16.png',
    downloadUrl: '/files/downloads/image.jpg'
  }
]; 