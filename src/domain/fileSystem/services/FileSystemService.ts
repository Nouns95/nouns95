import { FileSystemState, FileNode, DirectoryNode, FileSystemNode } from '../models/FileSystem';
import { EventBus } from '@/src/utils/EventBus';
import { v4 as uuidv4 } from 'uuid';

export class FileSystemService {
  private static instance: FileSystemService;
  private state: FileSystemState;
  private eventBus: EventBus;

  private constructor() {
    this.state = {
      nodes: {},
      rootId: '',
      currentDirectoryId: ''
    };
    this.eventBus = new EventBus();
  }

  public static getInstance(): FileSystemService {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService();
    }
    return FileSystemService.instance;
  }

  private async readDirectoryContents(dirPath: string): Promise<FileSystemNode[]> {
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(dirPath)}`);
      if (!response.ok) {
        throw new Error('Failed to read directory');
      }
      const contents = await response.json();
      return contents;
    } catch (error) {
      console.error('Error reading directory:', error);
      return [];
    }
  }

  private getFileIcon(filename: string, downloadUrl?: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    // Use the actual file as its own icon for images
    if (downloadUrl && (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'svg')) {
      return downloadUrl;
    }

    // Otherwise use type-specific icons
    switch (ext) {
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return '/assets/icons/apps/fileexplorer/file-types/image.png';
      case 'svg':
        return '/assets/icons/apps/fileexplorer/file-types/svg.png';
      case 'pdf':
      case 'txt':
      case 'doc':
      case 'docx':
      case 'rtf':
      case 'odt':
      case 'md':
        return '/assets/icons/apps/fileexplorer/file-types/documents.png';
      default:
        return '/assets/icons/apps/fileexplorer/file-types/default.png';
    }
  }

  private getFolderIcon(): string {
    return '/assets/icons/apps/fileexplorer/folders/folder.png';
  }

  private async loadDirectoryContents(parentId: string, dirPath: string): Promise<string[]> {
    console.log('Loading contents for:', dirPath);
    const contents = await this.readDirectoryContents(dirPath);
    const childIds: string[] = [];

    for (const item of contents) {
      const itemId = uuidv4();
      const itemPath = dirPath === '/files' ? `/files/${item.name}` : `${dirPath}/${item.name}`;
      
      if (item.type === 'directory') {
        // Create directory node
        const dirNode: DirectoryNode = {
          id: itemId,
          name: item.name,
          type: 'directory',
          path: itemPath,
          parentId,
          icon: this.getFolderIcon(),
          children: [],
          stats: item.stats
        };
        
        // Recursively load subdirectory contents
        console.log('Loading subdirectory:', itemPath);
        const subChildIds = await this.loadDirectoryContents(itemId, itemPath);
        dirNode.children = subChildIds;
        
        this.state.nodes[itemId] = dirNode;
      } else {
        // Create file node with downloadUrl
        const downloadUrl = itemPath;
        const fileNode: FileNode = {
          id: itemId,
          name: item.name,
          type: 'file',
          path: itemPath,
          parentId,
          icon: this.getFileIcon(item.name, downloadUrl),
          downloadUrl,
          stats: item.stats
        };
        
        console.log('Created file node:', {
          path: fileNode.path,
          name: fileNode.name,
          type: fileNode.type,
          icon: fileNode.icon,
          parentId: fileNode.parentId
        });
        this.state.nodes[itemId] = fileNode;
      }
      
      childIds.push(itemId);
    }

    console.log('Directory contents loaded:', {
      dirPath,
      childCount: childIds.length,
      children: childIds.map(id => ({
        id,
        name: this.state.nodes[id].name,
        type: this.state.nodes[id].type
      }))
    });

    return childIds;
  }

  public async initializeFileSystem(): Promise<void> {
    const rootId = uuidv4();

    // Create root directory
    const root: DirectoryNode = {
      id: rootId,
      name: 'Root',
      type: 'directory',
      path: '/files',
      parentId: null,
      children: [],
      icon: this.getFolderIcon(),
      stats: {
        size: 0,
        created: new Date(),
        modified: new Date(),
        type: 'directory'
      }
    };

    // Initialize state with root
    this.state = {
      nodes: {
        [rootId]: root
      },
      rootId,
      currentDirectoryId: rootId
    };

    try {
      // Recursively load all contents starting from root
      root.children = await this.loadDirectoryContents(rootId, '/files');
      
      this.eventBus.emit('directoryChanged', { directoryId: this.state.currentDirectoryId });
    } catch (error) {
      console.error('Error loading file system:', error);
    }
  }

  public getCurrentDirectory(): DirectoryNode {
    const node = this.state.nodes[this.state.currentDirectoryId];
    if (node.type !== 'directory') {
      throw new Error('Current directory is not a directory node');
    }
    return node;
  }

  public getNode(id: string): FileSystemNode | null {
    return this.state.nodes[id] || null;
  }

  public getChildren(id: string): FileSystemNode[] {
    const node = this.getNode(id);
    if (!node || node.type !== 'directory') {
      console.log('No children found for node:', {
        id,
        nodeExists: !!node,
        type: node?.type
      });
      return [];
    }

    const children = node.children.map(childId => this.state.nodes[childId]).filter(Boolean);
    console.log('Retrieved children for node:', {
      id,
      childCount: children.length,
      children: children.map(child => ({
        id: child.id,
        name: child.name,
        type: child.type
      }))
    });
    return children;
  }

  public navigateTo(id: string): void {
    const node = this.getNode(id);
    if (node && node.type === 'directory') {
      this.state.currentDirectoryId = id;
      this.eventBus.emit('directoryChanged', { directoryId: id });
    }
  }

  public navigateUp(): void {
    const current = this.getCurrentDirectory();
    if (current.parentId) {
      this.navigateTo(current.parentId);
    }
  }

  public addFile(file: Omit<FileSystemNode, 'id'>): FileSystemNode {
    const id = `file-${Date.now()}`;
    const newFile = file.type === 'directory'
      ? { ...file, id, children: [] } as DirectoryNode
      : { ...file, id } as FileNode;
    
    this.state.nodes[id] = newFile;
    
    const parent = this.getNode(file.parentId!);
    if (parent && parent.type === 'directory') {
      parent.children.push(id);
    }

    this.eventBus.emit('fileSystemChanged', { state: this.state });
    return newFile;
  }

  public downloadFile(id: string): void {
    const file = this.getNode(id);
    if (file && file.type === 'file' && file.downloadUrl) {
      window.open(file.downloadUrl, '_blank');
    }
  }

  public on(event: string, callback: (data: any) => void): void {
    this.eventBus.on(event, callback);
  }

  public off(event: string, callback: (data: any) => void): void {
    this.eventBus.off(event, callback);
  }
}
