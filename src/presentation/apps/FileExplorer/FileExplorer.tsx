"use client";

import React, { useEffect, useState, useRef } from 'react';
import { FileSystemService } from '@/src/domain/fileSystem/services/FileSystemService';
import { FileSystemNode, DirectoryNode, FileNode } from '@/src/domain/fileSystem/models/FileSystem';
import { Menu, type MenuItem } from './Menu';
import styles from './FileExplorer.module.css';

interface TreeItem {
  id: string;
  name: string;
  icon: string;
  children?: TreeItem[];
  isExpanded?: boolean;
  level?: number;
}

interface MenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  items: MenuItem[];
}

interface FileDetails {
  name: string;
  size: string;
  type: string;
  modified: string;
}

interface FolderSelectState {
  isOpen: boolean;
  position: { x: number; y: number };
}

export function FileExplorer() {
  const fileSystem = FileSystemService.getInstance();
  const [currentDirectory, setCurrentDirectory] = useState<DirectoryNode | null>(null);
  const [files, setFiles] = useState<FileSystemNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedTreeItem, setSelectedTreeItem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    items: []
  });
  const [treeItems, setTreeItems] = useState<TreeItem[]>([]);
  const [folderSelect, setFolderSelect] = useState<FolderSelectState>({
    isOpen: false,
    position: { x: 0, y: 0 }
  });

  useEffect(() => {
    const buildTreeItems = (node: FileSystemNode, level = 0): TreeItem => {
      const children = node.type === 'directory' 
        ? fileSystem.getChildren(node.id)
          .filter(child => child.type === 'directory')
          .map(child => buildTreeItems(child, level + 1))
        : undefined;

      return {
        id: node.id,
        name: node.name,
        icon: node.icon || '/assets/icons/apps/fileexplorer/folders/folder.png',
        level,
        isExpanded: false,
        children: children?.length ? children : undefined
      };
    };

    const handleDirectoryChange = ({ directoryId }: { directoryId: string }) => {
      const current = fileSystem.getNode(directoryId);
      if (!current || current.type !== 'directory') return;
      
      // Update current directory and selection states
      setCurrentDirectory(current);
      setSelectedTreeItem(directoryId);
      setSelectedFile(null); // Clear file selection when changing directories

      // Update file list with ALL children (files and folders)
      const allChildren = fileSystem.getChildren(current.id);
      setFiles(allChildren);
      
      // Close any open menus
      setFolderSelect(prev => ({ ...prev, isOpen: false }));
      setMenu(prev => ({ ...prev, isOpen: false }));
      
      // Update tree expansion state
      const updateTreeExpansion = (items: TreeItem[], path: string[]): TreeItem[] => {
        return items.map(item => {
          const isInPath = path.includes(item.id);
          if (item.children) {
            return {
              ...item,
              isExpanded: isInPath || item.isExpanded,
              children: updateTreeExpansion(item.children, path)
            };
          }
          return {
            ...item,
            isExpanded: isInPath || item.isExpanded
          };
        });
      };

      // Get path from root to current directory
      const getPath = (node: FileSystemNode): string[] => {
        const path = [node.id];
        let current = node;
        while (current.parentId) {
          path.unshift(current.parentId);
          const parent = fileSystem.getNode(current.parentId);
          if (!parent) break;
          current = parent;
        }
        return path;
      };

      setTreeItems(prevItems => updateTreeExpansion(prevItems, getPath(current)));
    };

    const initializeFileSystem = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        await fileSystem.initializeFileSystem();
        
        // Initialize tree items from file system
        const rootNode = fileSystem.getCurrentDirectory();
        setTreeItems([buildTreeItems(rootNode)]);

        // Get initial directory after initialization
        handleDirectoryChange({ directoryId: rootNode.id });
      } catch (error) {
        console.error('Error initializing file system:', error);
        setError('Failed to initialize file system');
      } finally {
        setIsLoading(false);
      }
    };

    fileSystem.on('directoryChanged', handleDirectoryChange);
    fileSystem.on('fileSystemChanged', () => {
      if (currentDirectory) {
        // Update with ALL children when file system changes
        const allChildren = fileSystem.getChildren(currentDirectory.id);
        setFiles(allChildren);
        
        // Rebuild tree items to reflect file system changes
        const rootNode = fileSystem.getCurrentDirectory();
        setTreeItems([buildTreeItems(rootNode)]);
      }
    });

    initializeFileSystem().catch(console.error);

    return () => {
      fileSystem.off('directoryChanged', handleDirectoryChange);
    };
  }, []);

  const handleFileDoubleClick = (file: FileSystemNode) => {
    if (file.type === 'directory') {
      fileSystem.navigateTo(file.id);
    } else if (file.downloadUrl) {
      fileSystem.downloadFile(file.id);
    }
  };

  const handleFileClick = (file: FileSystemNode) => {
    setSelectedFile(file.id);
  };

  const handleTreeItemClick = (item: TreeItem) => {
    setSelectedTreeItem(item.id);
    fileSystem.navigateTo(item.id);
  };

  const handleTreeItemDoubleClick = (item: TreeItem) => {
    // Navigate to the folder
    fileSystem.navigateTo(item.id);
    
    // Toggle expansion state
    setTreeItems(prevItems => {
      const updateItem = (items: TreeItem[]): TreeItem[] => {
        return items.map(treeItem => {
          if (treeItem.id === item.id) {
            return { ...treeItem, isExpanded: !treeItem.isExpanded };
          }
          if (treeItem.children) {
            return { ...treeItem, children: updateItem(treeItem.children) };
          }
          return treeItem;
        });
      };
      return updateItem(prevItems);
    });
  };

  const handleExpandButtonClick = (e: React.MouseEvent, item: TreeItem) => {
    e.stopPropagation();
    setTreeItems(prevItems => {
      const updateItem = (items: TreeItem[]): TreeItem[] => {
        return items.map(treeItem => {
          if (treeItem.id === item.id) {
            return { ...treeItem, isExpanded: !treeItem.isExpanded };
          }
          if (treeItem.children) {
            return { ...treeItem, children: updateItem(treeItem.children) };
          }
          return treeItem;
        });
      };
      return updateItem(prevItems);
    });
  };

  const handleUpClick = () => {
    if (currentDirectory?.parentId) {
      fileSystem.navigateTo(currentDirectory.parentId);
    }
  };

  const handleMenuClick = (menuName: string, event: React.MouseEvent) => {
    event.preventDefault();
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    
    let menuItems: MenuItem[] = [];
    switch (menuName) {
      case 'File':
        menuItems = [
          {
            label: 'Open',
            action: () => {
              const selectedNode = files.find(f => f.id === selectedFile);
              if (selectedNode) {
                handleFileDoubleClick(selectedNode);
              }
            },
            disabled: !selectedFile,
            shortcut: 'Enter'
          },
          { separator: true },
          {
            label: 'Create New Folder',
            disabled: true
          },
          { separator: true },
          {
            label: 'Properties',
            disabled: !selectedFile
          },
          { separator: true },
          {
            label: 'Close',
            action: () => {
              // Close window logic would go here
            }
          }
        ];
        break;
      case 'Edit':
        menuItems = [
          {
            label: 'Cut',
            disabled: true,
            shortcut: 'Ctrl+X'
          },
          {
            label: 'Copy',
            disabled: true,
            shortcut: 'Ctrl+C'
          },
          {
            label: 'Paste',
            disabled: true,
            shortcut: 'Ctrl+V'
          },
          { separator: true },
          {
            label: 'Select All',
            shortcut: 'Ctrl+A',
            disabled: files.length === 0
          }
        ];
        break;
      case 'View':
        menuItems = [
          {
            label: 'Large Icons',
            disabled: true
          },
          {
            label: 'Small Icons',
            disabled: true
          },
          {
            label: 'List',
            disabled: true
          },
          {
            label: 'Details',
            disabled: true
          },
          { separator: true },
          {
            label: 'Arrange Icons',
            disabled: true
          },
          { separator: true },
          {
            label: 'Refresh',
            action: () => {
              if (currentDirectory) {
                setFiles(fileSystem.getChildren(currentDirectory.id));
              }
            },
            shortcut: 'F5'
          }
        ];
        break;
      case 'Tools':
        menuItems = [
          {
            label: 'Find Files...',
            disabled: true,
            shortcut: 'Ctrl+F'
          },
          { separator: true },
          {
            label: 'Map Network Drive...',
            disabled: true
          },
          {
            label: 'Disconnect Network Drive...',
            disabled: true
          }
        ];
        break;
      case 'Help':
        menuItems = [
          {
            label: 'Help Topics',
            disabled: true
          },
          { separator: true },
          {
            label: 'About Windows 95 File Explorer',
            disabled: true
          }
        ];
        break;
      default:
        menuItems = [];
    }

    setMenu({
      isOpen: true,
      position: { x: rect.left, y: rect.bottom },
      items: menuItems
    });
  };

  const closeMenu = () => {
    setMenu(prev => ({ ...prev, isOpen: false }));
  };

  const getFileDetails = (file: FileSystemNode): FileDetails => {
    return {
      name: file.name,
      size: file.stats?.size ? `${Math.round(file.stats.size / 1024)} KB` : '',
      type: file.type === 'directory' ? 'File Folder' : file.stats?.type || 'File',
      modified: file.stats?.modified ? new Date(file.stats.modified).toLocaleDateString() : ''
    };
  };

  const getFileIcon = (file: FileSystemNode): string => {
    if (file.type === 'directory') {
      return file.icon || '/assets/icons/apps/fileexplorer/folders/folder.png';
    }

    // If it's an image file, use the file itself as the icon
    if (file.name.match(/\.(png|jpg|jpeg|gif|svg)$/i) && file.downloadUrl) {
      return file.downloadUrl;
    }

    // For PDFs use a PDF icon
    if (file.name.endsWith('.pdf')) {
      return '/assets/icons/apps/fileexplorer/file-types/documents.png';
    }

    // Default file icon
    return '/assets/icons/apps/fileexplorer/file-types/default.png';
  };

  const renderTreeItem = (item: TreeItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const indent = (item.level || 0) * 16;

    return (
      <React.Fragment key={item.id}>
        <div
          className={`${styles.treeItem} ${selectedTreeItem === item.id ? styles.selected : ''}`}
          onClick={() => handleTreeItemClick(item)}
          onDoubleClick={() => handleTreeItemDoubleClick(item)}
        >
          <div style={{ width: indent }} className={styles.treeIndent} />
          {hasChildren ? (
            <div 
              className={styles.expandButton}
              onClick={(e) => handleExpandButtonClick(e, item)}
            >
              {item.isExpanded ? '-' : '+'}
            </div>
          ) : (
            <div style={{ width: 12 }} />
          )}
          <img src={item.icon} alt="" className={styles.treeIcon} />
          <span className={styles.treeLabel}>{item.name}</span>
        </div>
        {item.isExpanded && item.children?.map(child => renderTreeItem(child))}
      </React.Fragment>
    );
  };

  const handleFolderSelectClick = (event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setFolderSelect({
      isOpen: true,
      position: { x: rect.left, y: rect.bottom }
    });
  };

  const getFolderSelectItems = (): MenuItem[] => {
    const buildMenuItems = (items: TreeItem[], level = 0): MenuItem[] => {
      const menuItems: MenuItem[] = [];
      
      items.forEach(item => {
        menuItems.push({
          label: '  '.repeat(level) + item.name,
          action: () => fileSystem.navigateTo(item.id),
          icon: item.icon
        });
        
        if (item.children && item.children.length > 0) {
          menuItems.push(...buildMenuItems(item.children, level + 1));
        }
      });
      
      return menuItems;
    };

    return buildMenuItems(treeItems);
  };

  const renderFileItem = (file: FileSystemNode) => {
    const isImage = file.name.match(/\.(png|jpg|jpeg|gif|svg)$/i);
    const iconClass = `${styles.fileIcon} ${isImage ? styles.imagePreview : styles.medium}`;

    return (
      <div
        key={file.id}
        className={`${styles.fileItem} ${selectedFile === file.id ? styles.selected : ''}`}
        onClick={() => handleFileClick(file)}
        onDoubleClick={() => handleFileDoubleClick(file)}
      >
        <div className={iconClass}>
          <img src={file.icon} alt="" />
        </div>
        <span className={styles.fileName}>{file.name}</span>
      </div>
    );
  };

  const handleCreateFolder = () => {
    // TODO: Implement folder creation
    console.log('Create folder clicked');
  };

  const handleUpload = () => {
    // TODO: Implement file upload
    console.log('Upload clicked');
  };

  const handleDelete = () => {
    if (!selectedFile) return;
    // TODO: Implement file deletion
    console.log('Delete clicked for:', selectedFile);
  };

  const handleRename = () => {
    if (!selectedFile) return;
    // TODO: Implement file renaming
    console.log('Rename clicked for:', selectedFile);
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        {['File', 'Edit', 'View', 'Tools', 'Help'].map(menuName => (
          <div
            key={menuName}
            className={styles.menuItem}
            onClick={(e) => handleMenuClick(menuName, e)}
          >
            {menuName}
          </div>
        ))}
      </div>
      <div className={styles.buttonBar}>
        <div className={styles.folderSelect} onClick={handleFolderSelectClick}>
          <div className={styles.folderSelectButton}>
            <img 
              src={currentDirectory?.icon || '/assets/icons/apps/fileexplorer/folders/folder.png'} 
              alt="" 
              className={styles.folderSelectIcon} 
            />
            <span className={styles.folderSelectText}>
              {currentDirectory?.name || 'Root'}
            </span>
            <div className={styles.folderSelectArrow}>▼</div>
          </div>
        </div>
        <div className={styles.actionButtons}>
          <button 
            className={styles.actionButton} 
            onClick={() => handleCreateFolder()}
            title="Create New Folder"
          >
            <img src="/assets/icons/apps/fileexplorer/actions/new-folder.png" alt="New Folder" />
          </button>
          <button 
            className={styles.actionButton}
            onClick={() => handleUpload()}
            title="Upload File"
          >
            <img src="/assets/icons/apps/fileexplorer/actions/upload.png" alt="Upload" />
          </button>
          <button 
            className={styles.actionButton}
            onClick={() => handleDelete()}
            title="Delete"
            data-disabled={!selectedFile}
          >
            <img src="/assets/icons/apps/fileexplorer/actions/delete.png" alt="Delete" />
          </button>
          <button 
            className={styles.actionButton}
            onClick={() => handleRename()}
            title="Rename"
            data-disabled={!selectedFile}
          >
            <img src="/assets/icons/apps/fileexplorer/actions/rename.png" alt="Rename" />
          </button>
        </div>
        <div className={styles.toolButton} data-disabled>
          <img src="/assets/icons/apps/fileexplorer/actions/back.png" alt="Back" />
        </div>
        <div className={styles.toolButton} data-disabled>
          <img src="/assets/icons/apps/fileexplorer/actions/forward.png" alt="Forward" />
        </div>
        <div
          className={styles.toolButton}
          onClick={currentDirectory?.parentId ? handleUpClick : undefined}
          data-disabled={!currentDirectory?.parentId}
        >
          <img src="/assets/icons/apps/fileexplorer/actions/up.png" alt="Up" />
        </div>
        <div className={styles.toolbarDivider} />
        <div className={styles.toolButton} data-disabled>
          <img src="/assets/icons/apps/fileexplorer/actions/cut.png" alt="Cut" />
        </div>
        <div className={styles.toolButton} data-disabled>
          <img src="/assets/icons/apps/fileexplorer/actions/copy.png" alt="Copy" />
        </div>
        <div className={styles.toolButton} data-disabled>
          <img src="/assets/icons/apps/fileexplorer/actions/paste.png" alt="Paste" />
        </div>
        <div className={styles.toolbarDivider} />
        <div className={styles.toolButton} data-disabled>
          <img src="/assets/icons/apps/fileexplorer/actions/properties.png" alt="Properties" />
        </div>
        <div className={styles.toolButton} data-disabled>
          <img src="/assets/icons/apps/fileexplorer/actions/delete.png" alt="Delete" />
        </div>
      </div>
      <div className={styles.splitView}>
        <div className={styles.treeView}>
          <div className={styles.treeHeader}>All Folders</div>
          <div className={styles.folderTree}>
            {isLoading ? (
              <div className={styles.loadingMessage}>Loading...</div>
            ) : error ? (
              <div className={styles.errorMessage}>{error}</div>
            ) : (
              treeItems.map(item => renderTreeItem(item))
            )}
          </div>
        </div>
        <div className={styles.fileView}>
          <div className={styles.fileViewHeader}>
            Contents of '{currentDirectory?.name || 'My Computer'}'
          </div>
          <div className={styles.fileList}>
            {isLoading ? (
              <div className={styles.loadingMessage}>Loading...</div>
            ) : error ? (
              <div className={styles.errorMessage}>{error}</div>
            ) : (
              files.map(file => renderFileItem(file))
            )}
          </div>
        </div>
      </div>
      <div className={styles.statusBar}>
        {files.length} object(s)
      </div>
      <Menu
        isOpen={folderSelect.isOpen}
        position={folderSelect.position}
        items={getFolderSelectItems()}
        onClose={() => setFolderSelect(prev => ({ ...prev, isOpen: false }))}
      />
      <Menu
        isOpen={menu.isOpen}
        position={menu.position}
        items={menu.items}
        onClose={closeMenu}
      />
    </div>
  );
}

export default FileExplorer; 