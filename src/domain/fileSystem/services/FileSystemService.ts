import { FileSystemState, FileNode, DirectoryNode, FileSystemNode } from '../models/FileSystem';
import { EventBus } from '@/src/utils/EventBus';
import { v4 as uuidv4 } from 'uuid';

interface FileSystemEventMap {
  directoryChanged: { directoryId: string };
  fileSystemChanged: { state: FileSystemState };
}

export class FileSystemService {
  private static instance: FileSystemService;
  private state: FileSystemState;
  private eventBus: EventBus;
  private loadedDirectories: Set<string>;
  private navigationHistory: string[] = [];
  private currentHistoryIndex: number = -1;
  private isNavigatingBack: boolean = false;
  private isNavigatingForward: boolean = false;

  private constructor() {
    this.state = {
      nodes: {},
      rootId: '',
      currentDirectoryId: ''
    };
    this.eventBus = new EventBus();
    this.loadedDirectories = new Set();
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

  public async loadDirectoryContents(parentId: string, dirPath: string): Promise<string[]> {
    // If directory is already loaded, return its children
    if (this.loadedDirectories.has(dirPath)) {
      const node = this.state.nodes[parentId];
      return node.type === 'directory' ? node.children : [];
    }

    const contents = await this.readDirectoryContents(dirPath);
    const childIds: string[] = [];

    for (const item of contents) {
      const itemId = uuidv4();
      const itemPath = dirPath === '/files' 
        ? `/files/${item.name}` 
        : `${dirPath}/${item.name}`;
      
      if (item.type === 'directory') {
        // Create directory node without loading its contents
        const dirNode: DirectoryNode = {
          id: itemId,
          name: item.name,
          type: 'directory',
          path: itemPath,
          parentId,
          icon: this.getFolderIcon(),
          children: [], // Children will be loaded when directory is accessed
          stats: item.stats
        };
        
        this.state.nodes[itemId] = dirNode;
        childIds.push(itemId);
      } else {
        const fileNode: FileNode = {
          id: itemId,
          name: item.name,
          type: 'file',
          path: itemPath,
          parentId,
          icon: this.getFileIcon(item.name, itemPath),
          downloadUrl: itemPath,
          stats: item.stats
        };
        
        this.state.nodes[itemId] = fileNode;
        childIds.push(itemId);
      }
    }

    this.loadedDirectories.add(dirPath);
    return childIds;
  }

  public async initializeFileSystem(): Promise<void> {
    const rootId = uuidv4();
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

    this.state = {
      nodes: {
        [rootId]: root
      },
      rootId,
      currentDirectoryId: rootId
    };

    try {
      // Only load root directory contents initially
      const children = await this.loadDirectoryContents(rootId, '/files');
      root.children = children;
      this.state.nodes[rootId] = root;
      
      // Initialize navigation history with root
      this.navigationHistory = [rootId];
      this.currentHistoryIndex = 0;
      
      this.eventBus.emit('fileSystemChanged', { state: this.state });
      this.eventBus.emit('directoryChanged', { directoryId: rootId });
    } catch (error) {
      console.error('Error loading file system:', error);
      throw error;
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
      return [];
    }
    return node.children.map(childId => this.state.nodes[childId]).filter(Boolean);
  }

  public async navigateTo(id: string): Promise<void> {
    const node = this.getNode(id);
    if (node && node.type === 'directory') {
      // Load directory contents if not already loaded
      if (!this.loadedDirectories.has(node.path)) {
        const children = await this.loadDirectoryContents(id, node.path);
        node.children = children;
        this.state.nodes[id] = node;
        this.eventBus.emit('fileSystemChanged', { state: this.state });
      }

      // Update navigation history for new navigation
      if (!this.isNavigatingBack && !this.isNavigatingForward) {
        // If we're navigating to a new location
        if (this.navigationHistory[this.currentHistoryIndex] !== id) {
          // Remove any forward history
          this.navigationHistory = this.navigationHistory.slice(0, this.currentHistoryIndex + 1);
          // Add new location
          this.navigationHistory.push(id);
          this.currentHistoryIndex++;
        }
      }

      this.state.currentDirectoryId = id;
      this.eventBus.emit('directoryChanged', { directoryId: id });
    }
  }

  public async navigateBack(): Promise<void> {
    if (this.canNavigateBack()) {
      this.isNavigatingBack = true;
      this.currentHistoryIndex--;
      const previousId = this.navigationHistory[this.currentHistoryIndex];
      await this.navigateTo(previousId);
      this.isNavigatingBack = false;
    }
  }

  public async navigateForward(): Promise<void> {
    if (this.canNavigateForward()) {
      this.isNavigatingForward = true;
      this.currentHistoryIndex++;
      const nextId = this.navigationHistory[this.currentHistoryIndex];
      await this.navigateTo(nextId);
      this.isNavigatingForward = false;
    }
  }

  public canNavigateBack(): boolean {
    return this.currentHistoryIndex > 0;
  }

  public canNavigateForward(): boolean {
    return this.currentHistoryIndex < this.navigationHistory.length - 1;
  }

  public setNavigatingBack(value: boolean): void {
    this.isNavigatingBack = value;
  }

  public setNavigatingForward(value: boolean): void {
    this.isNavigatingForward = value;
  }

  public isNavigatingBackward(): boolean {
    return this.isNavigatingBack;
  }

  public isNavigatingForwardState(): boolean {
    return this.isNavigatingForward;
  }

  public navigateUp(): void {
    const current = this.getCurrentDirectory();
    if (current.parentId) {
      // Clear navigation flags to ensure history is updated
      this.isNavigatingBack = false;
      this.isNavigatingForward = false;
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

  public on<K extends keyof FileSystemEventMap>(
    event: K,
    callback: (data: FileSystemEventMap[K]) => void
  ): void {
    this.eventBus.on(event, callback);
  }

  public off<K extends keyof FileSystemEventMap>(
    event: K,
    callback: (data: FileSystemEventMap[K]) => void
  ): void {
    this.eventBus.off(event, callback);
  }
}
