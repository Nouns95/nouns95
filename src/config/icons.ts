import { StaticImport } from 'next/dist/shared/lib/get-img-props';
import { ComponentType } from 'react';
import { NounImage } from '../presentation/apps/Nouns/AuctionNounImage';

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
  wallet: {
    icon: '/icons/apps/wallet/wallet.png',
    alt: '💰',
    isComponent: false
  },
  settings: {
    icon: '/icons/settings/settings.png',
    alt: '⚙️',
    isComponent: false
  },
  programs: {
    icon: '/icons/apps/programs/programs.png',
    alt: '📁',
    isComponent: false
  },
  fileexplorer: {
    icon: '/icons/apps/fileexplorer/folders/folder.png',
    alt: '📂',
    isComponent: false
  },
  auction: {
    icon: NounImage,
    alt: '🎨',
    isComponent: true
  }
};

export const getAppIcon = (appId: string): AppIcon => {
  return APP_ICONS[appId] || {
    icon: '/icons/apps/default/default.png',
    alt: '📄',
    isComponent: false
  };
}; 