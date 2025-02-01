import { FileSystemState, FileNode, DirectoryNode, FileSystemNode } from '../models/FileSystem';
import { EventBus } from '@/src/utils/EventBus';
import { v4 as uuidv4 } from 'uuid';

interface FileSystemEventMap {
  directoryChanged: { directoryId: string };
  fileSystemChanged: { state: FileSystemState };
}

export class FileSystemService {
  private static instance: FileSystemService | null = null;
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

  public static resetInstance(): void {
    if (FileSystemService.instance) {
      FileSystemService.instance.eventBus.removeAllListeners();
      FileSystemService.instance = null;
    }
  }

  private reset(): void {
    this.state = {
      nodes: {},
      rootId: '',
      currentDirectoryId: ''
    };
    this.loadedDirectories.clear();
    this.navigationHistory = [];
    this.currentHistoryIndex = -1;
    this.isNavigatingBack = false;
    this.isNavigatingForward = false;
  }

  private async readDirectoryContents(dirPath: string): Promise<FileSystemNode[]> {
    try {
      // Normalize the path to always start with /files and handle subdirectories correctly
      const normalizedPath = dirPath.startsWith('/files') 
        ? dirPath
        : `/files${dirPath === '/' ? '' : dirPath}`;
      
      // Remove any double slashes and trailing slashes
      const cleanPath = normalizedPath.replace(/\/+/g, '/').replace(/\/$/, '');
      
      console.log('Reading directory:', cleanPath); // Debug log
      
      const response = await fetch(`/api/files?path=${encodeURIComponent(cleanPath)}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to read directory:', cleanPath, response.status, response.statusText);
        throw new Error(`Failed to read directory: ${response.statusText}`);
      }
      
      const contents = await response.json();
      console.log('Directory contents:', contents); // Debug log
      return contents;
    } catch (error) {
      console.error('Error reading directory:', error);
      throw error;
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
        return '/icons/apps/fileexplorer/file-types/image.png';
      case 'svg':
        return '/icons/apps/fileexplorer/file-types/svg.png';
      case 'pdf':
      case 'txt':
      case 'doc':
      case 'docx':
      case 'rtf':
      case 'odt':
      case 'md':
        return '/icons/apps/fileexplorer/file-types/documents.png';
      default:
        return '/icons/apps/fileexplorer/file-types/default.png';
    }
  }

  private getFolderIcon(): string {
    return '/icons/apps/fileexplorer/folders/folder.png';
  }

  public async loadDirectoryContents(parentId: string, dirPath: string): Promise<string[]> {
    try {
      // Normalize the path to always start with /files and handle subdirectories correctly
      const apiPath = dirPath.startsWith('/files')
        ? dirPath
        : `/files${dirPath === '/' ? '' : dirPath}`;

      console.log('Loading directory contents for:', apiPath); // Debug log
      
      const contents = await this.readDirectoryContents(apiPath);
      if (!contents) {
        return [];
      }

      const childIds: string[] = [];

      for (const item of contents) {
        const itemId = uuidv4();
        const itemPath = `${apiPath}/${item.name}`.replace(/\/+/g, '/');
        
        if (item.type === 'directory') {
          const dirNode: DirectoryNode = {
            id: itemId,
            name: item.name,
            type: 'directory',
            path: itemPath,
            parentId,
            icon: this.getFolderIcon(),
            children: []
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
            downloadUrl: itemPath
          };
          
          this.state.nodes[itemId] = fileNode;
          childIds.push(itemId);
        }
      }

      console.log('Created nodes:', childIds.length); // Debug log
      return childIds;
    } catch (error) {
      console.error('Error loading directory contents:', error);
      return [];
    }
  }

  public async initializeFileSystem(): Promise<void> {
    try {
      // Reset state before initializing
      this.reset();
      
      // First check if we can read the root directory
      const contents = await this.readDirectoryContents('/files');
      if (!contents) {
        throw new Error('Root directory is inaccessible');
      }

      const rootId = uuidv4();
      const root: DirectoryNode = {
        id: rootId,
        name: 'Files',
        type: 'directory',
        path: '/files',
        parentId: null,
        children: [],
        icon: this.getFolderIcon()
      };

      this.state = {
        nodes: {
          [rootId]: root
        },
        rootId,
        currentDirectoryId: rootId
      };

      // Load root directory contents
      const children = await this.loadDirectoryContents(rootId, '/files');
      if (!children) {
        throw new Error('Failed to load root directory contents');
      }

      root.children = children;
      this.state.nodes[rootId] = root;
      
      // Initialize navigation history
      this.navigationHistory = [rootId];
      this.currentHistoryIndex = 0;
      
      // Emit events
      this.eventBus.emit('fileSystemChanged', { state: this.state });
      this.eventBus.emit('directoryChanged', { directoryId: rootId });
    } catch (error: unknown) {
      console.error('Error initializing file system:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string'
          ? error
          : 'Unknown error';
      throw new Error('Failed to initialize file system: ' + errorMessage);
    }
  }

  public getCurrentDirectory(): DirectoryNode | null {
    const node = this.state.nodes[this.state.currentDirectoryId];
    if (!node || node.type !== 'directory') {
      return null;
    }
    return node;
  }

  public getNode(id: string): FileSystemNode | null {
    if (!id || !this.state.nodes[id]) {
      return null;
    }
    return this.state.nodes[id];
  }

  public getChildren(id: string): FileSystemNode[] {
    const node = this.getNode(id);
    if (!node || node.type !== 'directory') {
      return [];
    }
    return node.children
      .map(childId => this.state.nodes[childId])
      .filter(Boolean);
  }

  public async navigateTo(id: string): Promise<void> {
    const node = this.getNode(id);
    if (node && node.type === 'directory') {
      try {
        // Always reload directory contents when navigating
        const childIds = await this.loadDirectoryContents(id, node.path);
        node.children = childIds;
        this.state.nodes[id] = node;

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
        this.eventBus.emit('fileSystemChanged', { state: this.state });
        this.eventBus.emit('directoryChanged', { directoryId: id });
      } catch (error) {
        console.error('Error navigating to directory:', error);
      }
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
    if (current && current.parentId) {
      // Clear navigation flags to ensure history is updated
      this.isNavigatingBack = false;
      this.isNavigatingForward = false;
      this.navigateTo(current.parentId);
    }
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
