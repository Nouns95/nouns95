"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { FileSystemService } from '@/src/domain/fileSystem/services/FileSystemService';
import { FileSystemNode, DirectoryNode } from '@/src/domain/fileSystem/models/FileSystem';
import { Menu, MenuAction } from './Menu';
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

    const children = fs.getChildren(node.id)
      .filter(child => child && child.type === 'directory')
      .map(child => buildTreeItems(fs, child, level + 1, false));

    return {
      id: node.id,
      name: node.name,
      icon: node.icon || '/icons/apps/fileexplorer/folders/folder.png',
      level,
      isExpanded: level === 0 || isRoot,
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
      const current = fs.getNode(directoryId);
      if (!current || current.type !== 'directory') return;
      
      setCurrentDirectory(current);
      setSelectedTreeItem(directoryId);
      setSelectedFile(null);
      setFiles(fs.getChildren(current.id));

      if (current.type === 'directory') {
        const treeItem = buildTreeItems(fs, current, 0, true);
        setTreeItems([{ ...treeItem, isExpanded: true }]);
      }
    };

    const handleFSChange = () => {
      const currentDir = fs.getCurrentDirectory();
      if (!currentDir || currentDir.type !== 'directory') return;
      
      setFiles(fs.getChildren(currentDir.id));
      const treeItem = buildTreeItems(fs, currentDir, 0, true);
      setTreeItems([{ ...treeItem, isExpanded: true }]);
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

  const handleTreeItemDoubleClick = useCallback((item: TreeItem) => {
    const fs = fsRef.current;
    if (!fs) return;
    
    // First navigate to the directory
    fs.navigateTo(item.id).then(() => {
      // After navigation, update the tree state
      setTreeItems(prevItems => {
        const updateItem = (items: TreeItem[]): TreeItem[] => {
          return items.map(treeItem => {
            if (treeItem.id === item.id) {
              if (!treeItem.isExpanded && (!treeItem.children || treeItem.children.length === 0)) {
                const node = fs.getNode(treeItem.id);
                if (node && node.type === 'directory') {
                  const dirChildren = fs.getChildren(node.id)
                    .filter(child => child && child.type === 'directory')
                    .map(child => buildTreeItems(fs, child, (treeItem.level || 0) + 1));
                  
                  return {
                    ...treeItem,
                    isExpanded: true,
                    children: dirChildren.length > 0 ? dirChildren : undefined
                  };
                }
              }
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
    });
  }, [fsRef, buildTreeItems]);

  const handleExpandButtonClick = useCallback((e: React.MouseEvent, item: TreeItem) => {
    const fs = fsRef.current;
    if (!fs) return;
    
    e.stopPropagation();
    setTreeItems(prevItems => {
      const updateItem = (items: TreeItem[]): TreeItem[] => {
        return items.map(treeItem => {
          if (treeItem.id === item.id) {
            if (!treeItem.isExpanded && (!treeItem.children || treeItem.children.length === 0)) {
              const node = fs.getNode(treeItem.id);
              if (node && node.type === 'directory') {
                const dirChildren = fs.getChildren(node.id)
                  .filter(child => child.type === 'directory')
                  .map(child => buildTreeItems(fs, child, (treeItem.level || 0) + 1));
                
                return {
                  ...treeItem,
                  isExpanded: true,
                  children: dirChildren.length > 0 ? dirChildren : undefined
                };
              }
            }
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
            id: 'file-new-folder',
            label: 'New Folder',
            icon: '/icons/apps/fileexplorer/actions/new-folder.png',
            action: handleCreateFolder
          },
          {
            id: 'file-upload',
            label: 'Upload',
            icon: '/icons/apps/fileexplorer/actions/upload.png',
            action: handleUpload
          },
          { id: 'file-separator-1', separator: true },
          {
            id: 'file-properties',
            label: 'Properties',
            disabled: true
          },
          { id: 'file-separator-2', separator: true },
          {
            id: 'file-close',
            label: 'Close',
            action: () => window.close()
          }
        ];
        break;
      case 'Edit':
        menuItems = [
          {
            id: 'edit-rename',
            label: 'Rename',
            icon: '/icons/apps/fileexplorer/actions/rename.png',
            action: handleRename
          },
          {
            id: 'edit-delete',
            label: 'Delete',
            icon: '/icons/apps/fileexplorer/actions/delete.png',
            action: handleDelete
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
      case 'Tools':
        menuItems = [
          {
            id: 'tools-find-files',
            label: 'Find Files...',
            disabled: true
          },
          { id: 'tools-separator-1', separator: true },
          {
            id: 'tools-map-network-drive',
            label: 'Map Network Drive...',
            disabled: true
          },
          {
            id: 'tools-disconnect-network-drive',
            label: 'Disconnect Network Drive...',
            disabled: true
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

  const handleCreateFolder = async () => {
    const fs = fsRef.current;
    if (!fs || !currentDirectory) return;
    
    const newFolderName = 'New Folder';
    const newFolder = fs.addFile({
      name: newFolderName,
      type: 'directory',
      path: `${currentDirectory.path}/${newFolderName}`,
      parentId: currentDirectory.id,
      icon: '/icons/apps/fileexplorer/folders/folder.png',
      stats: {
        size: 0,
        created: new Date(),
        modified: new Date(),
        type: 'directory'
      }
    });

    setSelectedFile(newFolder.id);
  };

  const handleUpload = async () => {
    const fs = fsRef.current;
    if (!fs || !currentDirectory) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', currentDirectory.path);

        try {
          const response = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            await fs.loadDirectoryContents(currentDirectory.id, currentDirectory.path);
            setFiles(fs.getChildren(currentDirectory.id));
          }
        } catch (error) {
          console.error('Error uploading file:', error);
        }
      }
    };

    input.click();
  };

  const handleDelete = async () => {
    const fs = fsRef.current;
    if (!fs || !selectedFile) return;
    
    const file = fs.getNode(selectedFile);
    if (!file) return;

    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(file.path)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        if (file.parentId) {
          const parent = fs.getNode(file.parentId);
          if (parent && parent.type === 'directory') {
            parent.children = parent.children.filter(id => id !== file.id);
            setFiles(fs.getChildren(parent.id));
          }
        }
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleRename = async () => {
    const fs = fsRef.current;
    if (!fs || !selectedFile) return;
    
    const file = fs.getNode(selectedFile);
    if (!file) return;

    const newName = prompt('Enter new name:', file.name);
    if (!newName || newName === file.name) return;

    try {
      const response = await fetch(`/api/files/rename`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldPath: file.path,
          newName
        })
      });

      if (response.ok) {
        const newPath = file.path.replace(file.name, newName);
        file.name = newName;
        file.path = newPath;
        if (file.type === 'file' && file.downloadUrl) {
          file.downloadUrl = newPath;
        }
        setFiles([...files]);
      }
    } catch (error) {
      console.error('Error renaming file:', error);
    }
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