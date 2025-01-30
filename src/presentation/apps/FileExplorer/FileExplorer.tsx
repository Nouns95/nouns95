"use client";

import React, { useEffect, useState, useCallback } from 'react';
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
  const [folderHistory, setFolderHistory] = useState<DirectoryNode[]>([]);
  const [backPressed, setBackPressed] = useState(false);
  const [forwardPressed, setForwardPressed] = useState(false);

  const buildTreeItems = useCallback((node: FileSystemNode, level: number, isRoot = false): TreeItem => {
    const children = fileSystem.getChildren(node.id)
      .filter(child => child.type === 'directory')
      .map(child => buildTreeItems(child, level + 1, false));

    return {
      id: node.id,
      name: node.name,
      icon: node.icon || '/assets/icons/apps/fileexplorer/folders/folder.png',
      level,
      isExpanded: level === 0 || isRoot,
      children: children.length > 0 ? children : undefined
    };
  }, [fileSystem]);

  const handleDirectoryChange = useCallback(({ directoryId }: { directoryId: string }) => {
    const current = fileSystem.getNode(directoryId);
    if (!current || current.type !== 'directory') return;
    
    setCurrentDirectory(current);
    setSelectedTreeItem(directoryId);
    setSelectedFile(null);
    setFiles(fileSystem.getChildren(current.id));
    
    setFolderHistory(prev => {
      if (prev.some(folder => folder.id === current.id)) {
        return prev;
      }
      return [current as DirectoryNode, ...prev].slice(0, 5);
    });
    
    setFolderSelect(prev => ({ ...prev, isOpen: false }));
    setMenu(prev => ({ ...prev, isOpen: false }));
    
    const getPath = (node: FileSystemNode): string[] => {
      const path = [node.id];
      let currentNode = node;
      while (currentNode.parentId) {
        path.unshift(currentNode.parentId);
        const parent = fileSystem.getNode(currentNode.parentId);
        if (!parent) break;
        currentNode = parent;
      }
      return path;
    };

    const path = getPath(current);
    const rootId = path[0];
    const rootNode = fileSystem.getNode(rootId);
    if (rootNode && rootNode.type === 'directory') {
      const newRootTreeItem = buildTreeItems(rootNode, 0, true);
      
      setTreeItems(() => {
        const updateTreeExpansion = (items: TreeItem[], path: string[]): TreeItem[] => {
          return items.map(item => {
            const isInPath = path.includes(item.id);
            const isRoot = item.level === 0;
            
            if ((isInPath || isRoot) && (!item.children || item.children.length === 0)) {
              const node = fileSystem.getNode(item.id);
              if (node && node.type === 'directory') {
                const dirChildren = fileSystem.getChildren(node.id)
                  .filter(child => child.type === 'directory')
                  .map(child => buildTreeItems(child, (item.level || 0) + 1));
                
                return {
                  ...item,
                  isExpanded: isRoot || isInPath,
                  children: dirChildren.length > 0 ? dirChildren : undefined
                };
              }
            }
            
            return {
              ...item,
              isExpanded: isRoot || isInPath,
              children: item.children 
                ? updateTreeExpansion(item.children, path)
                : undefined
            };
          });
        };
        
        return updateTreeExpansion([newRootTreeItem], path);
      });
    }
  }, [buildTreeItems, fileSystem]);

  const handleFileSystemChange = useCallback(() => {
    const root = fileSystem.getCurrentDirectory();
    if (!root) return;

    const currentDir = fileSystem.getCurrentDirectory();
    if (currentDir) {
      setFiles(fileSystem.getChildren(currentDir.id));
      const treeItem = buildTreeItems(root, 0, true);
      setTreeItems([{ ...treeItem, isExpanded: true }]);
    }
  }, [buildTreeItems, fileSystem]);

  useEffect(() => {
    let mounted = true;
    let initialized = false;

    const initializeFileSystem = async () => {
      if (initialized) return;
      try {
        setIsLoading(true);
        setError(null);
        
        await fileSystem.initializeFileSystem();
        
        if (!mounted) return;

        const rootNode = fileSystem.getCurrentDirectory();
        if (rootNode) {
          const treeItem = buildTreeItems(rootNode, 0, true);
          setTreeItems([{ ...treeItem, isExpanded: true }]);
          handleDirectoryChange({ directoryId: rootNode.id });
        }
        initialized = true;
      } catch (error) {
        if (!mounted) return;
        console.error('Error initializing file system:', error);
        setError('Failed to initialize file system');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fileSystem.on('directoryChanged', handleDirectoryChange);
    fileSystem.on('fileSystemChanged', handleFileSystemChange);

    initializeFileSystem();

    return () => {
      mounted = false;
      fileSystem.off('directoryChanged', handleDirectoryChange);
      fileSystem.off('fileSystemChanged', handleFileSystemChange);
    };
  }, [buildTreeItems, fileSystem, handleDirectoryChange, handleFileSystemChange]);

  const handleFileDoubleClick = useCallback((file: FileSystemNode) => {
    if (file.type === 'directory') {
      fileSystem.navigateTo(file.id);
    } else if (file.downloadUrl) {
      fileSystem.downloadFile(file.id);
    }
  }, [fileSystem]);

  const handleFileClick = useCallback((file: FileSystemNode) => {
    setSelectedFile(file.id);
  }, []);

  const handleTreeItemClick = useCallback((item: TreeItem) => {
    setSelectedTreeItem(item.id);
    fileSystem.navigateTo(item.id);
  }, [fileSystem]);

  const handleTreeItemDoubleClick = useCallback((item: TreeItem) => {
    fileSystem.navigateTo(item.id);
    
    setTreeItems(prevItems => {
      const updateItem = (items: TreeItem[]): TreeItem[] => {
        return items.map(treeItem => {
          if (treeItem.id === item.id) {
            if (!treeItem.isExpanded) {
              const node = fileSystem.getNode(treeItem.id);
              if (node && node.type === 'directory') {
                const dirChildren = fileSystem.getChildren(node.id)
                  .filter(child => child.type === 'directory')
                  .map(child => buildTreeItems(child, (treeItem.level || 0) + 1));
                
                return {
                  ...treeItem,
                  isExpanded: true,
                  children: dirChildren.length > 0 ? dirChildren : undefined
                };
              }
            }
            return { 
              ...treeItem, 
              isExpanded: !treeItem.isExpanded 
            };
          }
          if (treeItem.children) {
            return { 
              ...treeItem, 
              children: updateItem(treeItem.children) 
            };
          }
          return treeItem;
        });
      };
      return updateItem(prevItems);
    });
  }, [buildTreeItems, fileSystem]);

  const handleExpandButtonClick = useCallback((e: React.MouseEvent, item: TreeItem) => {
    e.stopPropagation();
    setTreeItems(prevItems => {
      const updateItem = (items: TreeItem[]): TreeItem[] => {
        return items.map(treeItem => {
          if (treeItem.id === item.id) {
            if (!treeItem.isExpanded && (!treeItem.children || treeItem.children.length === 0)) {
              const node = fileSystem.getNode(treeItem.id);
              if (node && node.type === 'directory') {
                const dirChildren = fileSystem.getChildren(node.id)
                  .filter(child => child.type === 'directory')
                  .map(child => buildTreeItems(child, (treeItem.level || 0) + 1));
                
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
  }, [buildTreeItems, fileSystem]);

  const handleBackClick = useCallback(() => {
    fileSystem.navigateBack();
  }, [fileSystem]);

  const handleForwardClick = useCallback(() => {
    fileSystem.navigateForward();
  }, [fileSystem]);

  const handleMenuClick = (menuName: string, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    
    let menuItems: MenuAction[] = [];
    switch (menuName) {
      case 'File':
        menuItems = [
          {
            id: 'file-new-folder',
            label: 'New Folder',
            icon: '/assets/icons/apps/fileexplorer/actions/new-folder.png',
            action: handleCreateFolder
          },
          {
            id: 'file-upload',
            label: 'Upload',
            icon: '/assets/icons/apps/fileexplorer/actions/upload.png',
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
            icon: '/assets/icons/apps/fileexplorer/actions/rename.png',
            action: handleRename
          },
          {
            id: 'edit-delete',
            label: 'Delete',
            icon: '/assets/icons/apps/fileexplorer/actions/delete.png',
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
                fileSystem.loadDirectoryContents(currentDirectory.id, currentDirectory.path);
                setFiles(fileSystem.getChildren(currentDirectory.id));
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

    const details = {
      name: file.name,
      size: file.stats?.size ? `${Math.round(file.stats.size / 1024)} KB` : '',
      type: file.type === 'directory' ? 'File Folder' : file.stats?.type || 'File',
      modified: file.stats?.modified ? new Date(file.stats.modified).toLocaleDateString() : ''
    };

    return (
      <div className={styles.fileDetails}>
        <div>Name: {details.name}</div>
        <div>Size: {details.size}</div>
        <div>Type: {details.type}</div>
        <div>Modified: {details.modified}</div>
      </div>
    );
  };

  const renderFileIcon = (file: FileSystemNode) => {
    return (
      <Image
        src={file.icon || (file.type === 'directory' 
          ? '/assets/icons/apps/fileexplorer/folders/folder.png'
          : '/assets/icons/apps/fileexplorer/file-types/default.png')}
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
          icon: folder.icon || '/assets/icons/apps/fileexplorer/folders/folder.png',
          action: () => {
            fileSystem.navigateTo(folder.id);
            setFolderSelect(prev => ({ ...prev, isOpen: false }));
          }
        });
      });
    }

    return items;
  }, [folderHistory, fileSystem]);

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
    if (!currentDirectory) return;
    
    const newFolderName = 'New Folder';
    const newFolder = fileSystem.addFile({
      name: newFolderName,
      type: 'directory',
      path: `${currentDirectory.path}/${newFolderName}`,
      parentId: currentDirectory.id,
      icon: '/assets/icons/apps/fileexplorer/folders/folder.png',
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
    if (!currentDirectory) return;
    
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
            await fileSystem.loadDirectoryContents(currentDirectory.id, currentDirectory.path);
            setFiles(fileSystem.getChildren(currentDirectory.id));
          }
        } catch (error) {
          console.error('Error uploading file:', error);
        }
      }
    };

    input.click();
  };

  const handleDelete = async () => {
    if (!selectedFile) return;
    
    const file = fileSystem.getNode(selectedFile);
    if (!file) return;

    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(file.path)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        if (file.parentId) {
          const parent = fileSystem.getNode(file.parentId);
          if (parent && parent.type === 'directory') {
            parent.children = parent.children.filter(id => id !== file.id);
            setFiles(fileSystem.getChildren(parent.id));
          }
        }
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleRename = async () => {
    if (!selectedFile) return;
    
    const file = fileSystem.getNode(selectedFile);
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
              src={currentDirectory?.icon || '/assets/icons/apps/fileexplorer/folders/folder.png'} 
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
          data-disabled={!fileSystem.canNavigateBack()}
          onMouseDown={() => {
            if (fileSystem.canNavigateBack()) {
              setBackPressed(true);
            }
          }}
          onMouseUp={() => setBackPressed(false)}
          onMouseLeave={() => setBackPressed(false)}
        >
          <Image 
            src={!fileSystem.canNavigateBack() || backPressed
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
          data-disabled={!fileSystem.canNavigateForward()}
          onMouseDown={() => {
            if (fileSystem.canNavigateForward()) {
              setForwardPressed(true);
            }
          }}
          onMouseUp={() => setForwardPressed(false)}
          onMouseLeave={() => setForwardPressed(false)}
        >
          <Image 
            src={!fileSystem.canNavigateForward() || forwardPressed
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