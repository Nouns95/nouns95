import React from 'react';
import Image from 'next/image';
import { WindowService } from '@/src/Shell/Window/domain/services/WindowService';
import { ProcessManager } from '@/src/Shell/Window/domain/services/ProcessManager';
import { AppId, getAppConfig } from '@/src/Apps/AppConfig';
import { getAppIcon } from './icons';
import styles from './DesktopIcons.module.css';

interface DesktopIcon {
  id: AppId;
  label: string;
}

const DESKTOP_ICONS: DesktopIcon[] = [
  { id: 'governance', label: 'Camp' },
  { id: 'auction', label: 'Auction House' },
  { id: 'probe', label: 'Probe' },
  { id: 'chat', label: 'Chat' },
  { id: 'fileexplorer', label: 'File Explorer' },
  { id: 'studio', label: 'Noundry' }
];

export function DesktopIcons() {
  const windowService = WindowService.getInstance();
  const processManager = ProcessManager.getInstance();

  const handleIconClick = (appId: AppId) => {
    const config = getAppConfig(appId);
    if (!config) return;

    const process = processManager.createProcess({
      applicationId: appId,
      windowId: `${appId}-${Date.now()}`,
    });

    const metadata = appId === 'wallet' ? { network: 'ethereum' } : undefined;
    const windowId = config.type === 'miniapp'
      ? windowService.createMiniApp(appId, process.id, metadata)
      : windowService.createWindow(appId, process.id, metadata);

    windowService.focusWindow(windowId);
  };

  const renderIcon = (icon: DesktopIcon) => {
    const appIcon = getAppIcon(icon.id);
    
    if (appIcon.isComponent) {
      const IconComponent = appIcon.icon as React.ComponentType<{ width: number; height: number }>;
      return <IconComponent width={32} height={32} />;
    }

    return (
      <Image
        src={appIcon.icon as string}
        alt={appIcon.alt}
        width={icon.id === 'chat' ? 64 : 32}
        height={icon.id === 'chat' ? 64 : 32}
        style={{ objectFit: 'contain' }}
      />
    );
  };

  return (
    <div className={styles.container}>
      {DESKTOP_ICONS.map((icon) => (
        <button
          key={icon.id}
          className={styles.iconButton}
          onClick={() => handleIconClick(icon.id)}
        >
          <div className={`${styles.icon} ${icon.id === 'chat' ? styles.chatIcon : ''}`}>
            {renderIcon(icon)}
          </div>
          <span className={styles.label}>{icon.label}</span>
        </button>
      ))}
    </div>
  );
} 