"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { FileSystemService } from '@/src/Apps/Windows/FileExplorer/domain/fileSystem/services/FileSystemService';
import { FileSystemNode, DirectoryNode } from '@/src/Apps/Windows/FileExplorer/domain/fileSystem/models/FileSystem';
import { Menu, MenuAction } from '@/src/Shell/Window/components/Menu/Menu';
import { WindowService } from '@/src/Shell/Window/domain/services/WindowService';
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
  items: MenuAction[];
}

interface FolderSelectState {
  isOpen: boolean;
  position: { x: number; y: number };
}

export function FileExplorer() {
  const fsRef = useRef<FileSystemService | null>(null);
  const windowService = WindowService.getInstance();
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
  const [folderHistory, setFolderHistory] = useState<DirectoryNode[]>([]);
  const [backPressed, setBackPressed] = useState(false);
  const [forwardPressed, setForwardPressed] = useState(false);

  const buildTreeItems = useCallback((fs: FileSystemService, node: FileSystemNode, level: number, isRoot = false): TreeItem => {
    if (!node) return {
      id: 'root',
      name: 'Root',
      icon: '/icons/apps/fileexplorer/folders/folder.png',
      level: 0,
      isExpanded: true
    };

    let children: TreeItem[] = [];
    if (node.type === 'directory') {
      // Get children for root, loaded directories, or expanded directories
      if (isRoot || fs.isDirectoryLoaded(node.id)) {
        children = fs.getChildren(node.id)
          .filter(child => child && child.type === 'directory')
          .map(child => buildTreeItems(fs, child, level + 1, false));
      }
    }

    // A directory should be expanded if:
    // 1. It's the root
    // 2. It's loaded AND has children
    // 3. It's in the path to the current directory
    const isInCurrentPath = (() => {
      let current = fs.getCurrentDirectory();
      while (current && current.parentId) {
        if (current.id === node.id) return true;
        current = fs.getNode(current.parentId) as DirectoryNode | null;
      }
      return false;
    })();

    return {
      id: node.id,
      name: node.name,
      icon: node.icon || '/icons/apps/fileexplorer/folders/folder.png',
      level,
      isExpanded: isRoot || isInCurrentPath || (fs.isDirectoryLoaded(node.id) && children.length > 0),
      children: children.length > 0 ? children : undefined
    };
  }, []);

  useEffect(() => {
    // Reset any existing instance first
    FileSystemService.resetInstance();
    
    // Create new instance
    fsRef.current = FileSystemService.getInstance();
    const fs = fsRef.current;

    const initFS = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await fs.initializeFileSystem();
        
        const rootNode = fs.getCurrentDirectory();
        if (!rootNode || rootNode.type !== 'directory') {
          throw new Error('Invalid root directory');
        }

        setCurrentDirectory(rootNode);
        setFiles(fs.getChildren(rootNode.id));
        setSelectedTreeItem(rootNode.id);
        
        const treeItem = buildTreeItems(fs, rootNode, 0, true);
        setTreeItems([{ ...treeItem, isExpanded: true }]);
      } catch (error) {
        console.error('Error initializing file system:', error);
        setError('Failed to initialize file system');
      } finally {
        setIsLoading(false);
      }
    };

    const handleDirChange = ({ directoryId }: { directoryId: string }) => {
      const fs = fsRef.current;
      if (!fs) return;

      const current = fs.getNode(directoryId);
      if (!current || current.type !== 'directory') return;
      
      setCurrentDirectory(current);
      setSelectedTreeItem(directoryId);
      setSelectedFile(null);
      setFiles(fs.getChildren(current.id));

      // Load all parent directories to maintain the tree structure
      const loadParentDirectories = async (node: FileSystemNode) => {
        if (node.parentId) {
          const parent = fs.getNode(node.parentId);
          if (parent && parent.type === 'directory' && !fs.isDirectoryLoaded(parent.id)) {
            await fs.loadDirectoryContents(parent.id, parent.path);
            await loadParentDirectories(parent);
          }
        }
      };

      // Load parent directories and then rebuild the tree
      loadParentDirectories(current).then(() => {
        const rootNode = fs.getNode(fs.getRootId());
        if (rootNode && rootNode.type === 'directory') {
          const treeItem = buildTreeItems(fs, rootNode, 0, true);
          setTreeItems([{ ...treeItem, isExpanded: true }]);
        }
      });
    };

    const handleFSChange = () => {
      const fs = fsRef.current;
      if (!fs) return;

      const currentDir = fs.getCurrentDirectory();
      if (!currentDir || currentDir.type !== 'directory') return;
      
      setFiles(fs.getChildren(currentDir.id));

      // Get the root node and rebuild the entire tree
      const rootNode = fs.getNode(fs.getRootId());
      if (rootNode && rootNode.type === 'directory') {
        const treeItem = buildTreeItems(fs, rootNode, 0, true);
        setTreeItems([{ ...treeItem, isExpanded: true }]);
      }
    };

    fs.on('directoryChanged', handleDirChange);
    fs.on('fileSystemChanged', handleFSChange);

    // Initialize the file system
    initFS();

    // Cleanup function
    return () => {
      fs.off('directoryChanged', handleDirChange);
      fs.off('fileSystemChanged', handleFSChange);
      FileSystemService.resetInstance();
      fsRef.current = null;
      
      // Reset component state
      setCurrentDirectory(null);
      setFiles([]);
      setSelectedFile(null);
      setSelectedTreeItem(null);
      setTreeItems([]);
      setFolderHistory([]);
      setError(null);
    };
  }, [buildTreeItems]);

  const handleFileDoubleClick = useCallback((file: FileSystemNode) => {
    const fs = fsRef.current;
    if (!fs) return;
    
    if (file.type === 'directory') {
      // First update the UI state
      setCurrentDirectory(file as DirectoryNode);
      setSelectedTreeItem(file.id);
      setSelectedFile(null);
      
      // Then navigate to the directory
      fs.navigateTo(file.id).then(() => {
        // After navigation, update the files list
        setFiles(fs.getChildren(file.id));
        
        // Update folder history
        setFolderHistory(prev => {
          if (prev.some(folder => folder.id === file.id)) {
            return prev;
          }
          return [file as DirectoryNode, ...prev].slice(0, 5);
        });
      });
    } else if (file.downloadUrl) {
      fs.downloadFile(file.id);
    }
  }, [fsRef]);

  const handleFileClick = useCallback((file: FileSystemNode) => {
    setSelectedFile(file.id);
  }, []);

  const handleTreeItemClick = useCallback((item: TreeItem) => {
    if (!fsRef.current) return;
    setSelectedTreeItem(item.id);
    fsRef.current.navigateTo(item.id);
  }, [fsRef]);

  const handleTreeItemDoubleClick = useCallback(async (item: TreeItem) => {
    const fs = fsRef.current;
    if (!fs) return;
    
    try {
      // First navigate to the directory
      await fs.navigateTo(item.id);
      
      // After navigation, update the tree state
      setTreeItems(prevItems => {
        const updateItem = (items: TreeItem[]): TreeItem[] => {
          return items.map(treeItem => {
            if (treeItem.id === item.id) {
              const node = fs.getNode(treeItem.id);
              if (node && node.type === 'directory') {
                const dirChildren = fs.getChildren(node.id)
                  .filter(child => child && child.type === 'directory')
                  .map(child => buildTreeItems(fs, child, (treeItem.level || 0) + 1));
                
                return {
                  ...treeItem,
                  isExpanded: !treeItem.isExpanded,
                  children: dirChildren.length > 0 ? dirChildren : undefined
                };
              }
            }
            if (treeItem.children) {
              return { ...treeItem, children: updateItem(treeItem.children) };
            }
            return treeItem;
          });
        };
        return updateItem(prevItems);
      });
    } catch (error) {
      console.error('Error handling tree item double click:', error);
    }
  }, [fsRef, buildTreeItems]);

  const handleExpandButtonClick = useCallback(async (e: React.MouseEvent, item: TreeItem) => {
    const fs = fsRef.current;
    if (!fs) return;
    
    e.stopPropagation();
    
    try {
      const node = fs.getNode(item.id);
      if (!node || node.type !== 'directory') return;

      // Load directory contents if not already loaded
      if (!fs.isDirectoryLoaded(item.id)) {
        await fs.loadDirectoryContents(item.id, node.path);
      }

      // Update the tree state
      setTreeItems(prevItems => {
        const updateItem = (items: TreeItem[]): TreeItem[] => {
          return items.map(treeItem => {
            if (treeItem.id === item.id) {
              const dirChildren = fs.getChildren(node.id)
                .filter(child => child.type === 'directory')
                .map(child => buildTreeItems(fs, child, (treeItem.level || 0) + 1));
              
              return {
                ...treeItem,
                isExpanded: !treeItem.isExpanded,
                children: dirChildren.length > 0 ? dirChildren : undefined
              };
            }
            if (treeItem.children) {
              return { ...treeItem, children: updateItem(treeItem.children) };
            }
            return treeItem;
          });
        };
        return updateItem(prevItems);
      });
    } catch (error) {
      console.error('Error handling expand button click:', error);
    }
  }, [fsRef, buildTreeItems]);

  const handleBackClick = useCallback(() => {
    fsRef.current?.navigateBack();
  }, [fsRef]);

  const handleForwardClick = useCallback(() => {
    fsRef.current?.navigateForward();
  }, [fsRef]);

  const handleMenuClick = (menuName: string, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    
    let menuItems: MenuAction[] = [];
    switch (menuName) {
      case 'File':
        menuItems = [
          {
            id: 'file-properties',
            label: 'Properties',
            disabled: true
          },
          { id: 'file-separator-1', separator: true },
          {
            id: 'file-close',
            label: 'Close',
            action: () => {
              const windows = windowService.getAllWindows();
              const currentWindow = windows.find(w => w.isFocused);
              if (currentWindow) {
                windowService.closeWindow(currentWindow.id);
              }
            }
          }
        ];
        break;
      case 'View':
        menuItems = [
          {
            id: 'view-large-icons',
            label: 'Large Icons',
            disabled: true
          },
          {
            id: 'view-small-icons',
            label: 'Small Icons',
            disabled: true
          },
          {
            id: 'view-list',
            label: 'List',
            disabled: true
          },
          {
            id: 'view-details',
            label: 'Details',
            disabled: true
          },
          { id: 'view-separator-1', separator: true },
          {
            id: 'view-arrange-icons',
            label: 'Arrange Icons',
            disabled: true
          },
          { id: 'view-separator-2', separator: true },
          {
            id: 'view-refresh',
            label: 'Refresh',
            action: () => {
              if (currentDirectory) {
                fsRef.current?.loadDirectoryContents(currentDirectory.id, currentDirectory.path);
                setFiles(fsRef.current?.getChildren(currentDirectory.id) || []);
              }
            }
          }
        ];
        break;
      case 'Help':
        menuItems = [
          {
            id: 'help-help-topics',
            label: 'Help Topics',
            disabled: true
          },
          { id: 'help-separator-1', separator: true },
          {
            id: 'help-about-windows-95-file-explorer',
            label: 'About Windows 95 File Explorer',
            disabled: true
          }
        ];
        break;
      default:
        menuItems = [
          {
            id: `${menuName.toLowerCase()}-not-implemented`,
            label: 'Not implemented',
            disabled: true
          }
        ];
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

  const renderFileDetails = (file: FileSystemNode | null) => {
    if (!file) return null;
    return null; // Don't render the details panel but keep the function for state management
  };

  const renderFileIcon = (file: FileSystemNode) => {
    return (
      <Image
        src={file.icon || (file.type === 'directory' 
          ? '/icons/apps/fileexplorer/folders/folder.png'
          : '/icons/apps/fileexplorer/file-types/default.png')}
        alt=""
        width={32}
        height={32}
        className={styles.fileIcon}
        style={{ objectFit: 'contain' }}
      />
    );
  };

  const renderTreeItem = (item: TreeItem, index: number) => {
    const hasChildren = item.children && item.children.length > 0;
    const indent = (item.level || 0) * 16;

    return (
      <React.Fragment key={`${item.id}-${index}`}>
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
          <Image 
            src={item.icon} 
            alt="" 
            width={16} 
            height={16} 
            className={styles.treeIcon}
            style={{ objectFit: 'contain' }}
          />
          <span className={styles.treeLabel}>{item.name}</span>
        </div>
        {item.isExpanded && item.children?.map((child, childIndex) => 
          renderTreeItem(child, childIndex)
        )}
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

  const getFolderSelectItems = useCallback((): MenuAction[] => {
    const items: MenuAction[] = [];

    // Recent Folders section
    if (folderHistory.length > 0) {
      items.push({
        id: 'recent-header',
        label: 'Recent Folders',
        disabled: true
      });

      folderHistory.forEach((folder, index) => {
        items.push({
          id: `history-${folder.id}-${index}`,
          label: folder.name,
          icon: folder.icon || '/icons/apps/fileexplorer/folders/folder.png',
          action: () => {
            fsRef.current?.navigateTo(folder.id);
            setFolderSelect(prev => ({ ...prev, isOpen: false }));
          }
        });
      });
    }

    return items;
  }, [folderHistory, fsRef]);

  const renderFileItem = (file: FileSystemNode) => {
    return (
      <div
        key={file.id}
        className={`${styles.fileItem} ${selectedFile === file.id ? styles.selected : ''}`}
        onClick={() => handleFileClick(file)}
        onDoubleClick={() => handleFileDoubleClick(file)}
      >
        {renderFileIcon(file)}
        <span className={styles.fileName}>{file.name}</span>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        {['File', 'View', 'Help'].map(menuName => (
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
            <Image 
              src={currentDirectory?.icon || '/icons/apps/fileexplorer/folders/folder.png'} 
              alt=""
              width={16}
              height={16}
              className={styles.folderSelectIcon}
              style={{ objectFit: 'contain' }}
            />
            <span className={styles.folderSelectText}>
              {currentDirectory?.name || 'Root'}
            </span>
            <div className={styles.folderSelectArrow}>▼</div>
          </div>
        </div>
        <div 
          className={styles.toolButton} 
          onClick={handleBackClick}
          data-disabled={!fsRef.current?.canNavigateBack()}
          onMouseDown={() => {
            if (fsRef.current?.canNavigateBack()) {
              setBackPressed(true);
            }
          }}
          onMouseUp={() => setBackPressed(false)}
          onMouseLeave={() => setBackPressed(false)}
        >
          <Image 
            src={!fsRef.current?.canNavigateBack() || backPressed
              ? '/icons/apps/fileexplorer/navigation/back-pressed.png'
              : '/icons/apps/fileexplorer/navigation/back.png'
            }
            alt="Back" 
            width={8}
            height={10}
            style={{ imageRendering: 'pixelated' }}
            priority
          />
        </div>
        <div 
          className={styles.toolButton} 
          onClick={handleForwardClick}
          data-disabled={!fsRef.current?.canNavigateForward()}
          onMouseDown={() => {
            if (fsRef.current?.canNavigateForward()) {
              setForwardPressed(true);
            }
          }}
          onMouseUp={() => setForwardPressed(false)}
          onMouseLeave={() => setForwardPressed(false)}
        >
          <Image 
            src={!fsRef.current?.canNavigateForward() || forwardPressed
              ? '/icons/apps/fileexplorer/navigation/forward-pressed.png'
              : '/icons/apps/fileexplorer/navigation/forward.png'
            }
            alt="Forward" 
            width={8}
            height={10}
            style={{ imageRendering: 'pixelated' }}
            priority
          />
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
              treeItems.map((item, index) => renderTreeItem(item, index))
            )}
          </div>
        </div>
        <div className={styles.fileView}>
          <div className={styles.fileViewHeader}>
            Contents of &apos;{currentDirectory?.name || 'My Computer'}&apos;
          </div>
          <div className={styles.fileList}>
            {isLoading ? (
              <div className={styles.loadingMessage}>Loading...</div>
            ) : error ? (
              <div className={styles.errorMessage}>{error}</div>
            ) : files.length === 0 ? (
              <div className={styles.emptyMessage}>This folder is empty</div>
            ) : (
              files.map(file => renderFileItem(file))
            )}
          </div>
          {selectedFile && renderFileDetails(files.find(f => f.id === selectedFile) || null)}
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