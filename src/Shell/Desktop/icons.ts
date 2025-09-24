import { StaticImport } from 'next/dist/shared/lib/get-img-props';
import { ComponentType } from 'react';
import { AuctionNounImage } from '../../Apps/Nouns/Auction';

export interface IconComponentProps {
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export type IconType = string | StaticImport | ComponentType<IconComponentProps>;

export interface AppIcon {
  icon: IconType;
  alt: string;
  isComponent?: boolean;
}

export interface AppIcons {
  [key: string]: AppIcon;
}

export const APP_ICONS: AppIcons = {
  auction: {
    icon: AuctionNounImage,
    alt: '🎨',
    isComponent: true
  },
  chat: {
    icon: '/icons/apps/chat/chat.png',
    alt: '💬',
    isComponent: false
  },
  fileexplorer: {
    icon: '/icons/apps/fileexplorer/folders/folder.png',
    alt: '📂',
    isComponent: false
  },
  governance: {
    icon: '/icons/apps/governance/governance.png',
    alt: '📁',
    isComponent: false
  },
  probe: {
    icon: '/icons/apps/probe/probe.png',
    alt: '🔍',
    isComponent: false
  },
  programs: {
    icon: '/icons/shell/TaskBar/StartMenu/programs.png',
    alt: '📁',
    isComponent: false
  },
  settings: {
    icon: '/icons/shell/settings/settings.png',
    alt: '⚙️',
    isComponent: false
  },
  shutdown: {
    icon: '/icons/shell/TaskBar/StartMenu/shutdown.png',
    alt: '📁',
    isComponent: false
  },
  startmenu: {
    icon: '/icons/shell/TaskBar/StartMenu/StartMenu.png',
    alt: 'Start Menu',
    isComponent: false
  },
  studio: {
    icon: '/icons/apps/studio/Studio.png',
    alt: '🎨',
    isComponent: false
  },
  'studio-pencil': {
    icon: '/icons/apps/studio/tools/pencil.png',
    alt: '✏️',
    isComponent: false
  },
  'studio-eraser': {
    icon: '/icons/apps/studio/tools/eraser.png',
    alt: '🧹',
    isComponent: false
  },
  'studio-bucket': {
    icon: '/icons/apps/studio/tools/bucket.png',
    alt: '🪣',
    isComponent: false
  },
  'studio-eyedropper': {
    icon: '/icons/apps/studio/tools/eyedropper.png',
    alt: '👁️',
    isComponent: false
  },
  'studio-undo': {
    icon: '/icons/apps/studio/tools/undo.png',
    alt: '↩️',
    isComponent: false
  },
  'studio-redo': {
    icon: '/icons/apps/studio/tools/redo.png',
    alt: '↪️',
    isComponent: false
  },
  'studio-noggles': {
    icon: '/icons/apps/studio/layers/noggles.svg',
    alt: '👓',
    isComponent: false
  },
  'studio-head': {
    icon: '/icons/apps/studio/layers/head.svg',
    alt: '👤',
    isComponent: false
  },
  'studio-accessory': {
    icon: '/icons/apps/studio/layers/accessory.svg',
    alt: '🎨',
    isComponent: false
  },
  'studio-body': {
    icon: '/icons/apps/studio/layers/body.svg',
    alt: '👕',
    isComponent: false
  },
  'studio-background': {
    icon: '/icons/apps/studio/layers/background.svg',
    alt: '🖼️',
    isComponent: false
  },
  wallet: {
    icon: '/icons/apps/wallet/wallet.png',
    alt: '💰',
    isComponent: false
  },
  'network-ethereum': {
    icon: '/icons/apps/wallet/networks/ethereum.png',
    alt: 'Ethereum',
    isComponent: false
  },
  'network-base': {
    icon: '/icons/apps/wallet/networks/base.png',
    alt: 'Base',
    isComponent: false
  },
  'network-solana': {
    icon: '/icons/apps/wallet/networks/solana.png',
    alt: 'Solana',
    isComponent: false
  },
  'network-bitcoin': {
    icon: '/icons/apps/wallet/networks/bitcoin.png',
    alt: 'Bitcoin',
    isComponent: false
  },
};

export const getAppIcon = (appId: string): AppIcon => {
  return APP_ICONS[appId] || {
    icon: '/icons/apps/default/default.png',
    alt: '📄',
    isComponent: false
  };
}; 