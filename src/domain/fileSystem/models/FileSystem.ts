export interface FileStats {
  size: number;
  created: Date;
  modified: Date;
  type: string;
}

export interface BaseFileNode {
  id: string;
  name: string;
  path: string;
  stats: FileStats;
  parentId: string | null;
  icon?: string;
}

export interface DirectoryNode extends BaseFileNode {
  type: 'directory';
  children: string[];
}

export interface FileNode extends BaseFileNode {
  type: 'file';
  downloadUrl?: string;
}

export type FileSystemNode = DirectoryNode | FileNode;

export interface FileSystemState {
  nodes: { [id: string]: FileSystemNode };
  rootId: string;
  currentDirectoryId: string;
} 
