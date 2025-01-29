export interface AppIcon {
  small: string;  // 16x16 for taskbar and window title
  large: string;  // 32x32 for start menu and desktop
  alt: string;    // Fallback emoji/text icon
}

export interface AppIcons {
  [key: string]: AppIcon;
}

export const APP_ICONS: AppIcons = {
  wallet: {
    small: '/icons/wallet-16.png',
    large: '/icons/wallet-32.png',
    alt: '💰'
  },
  settings: {
    small: '/icons/settings-16.png',
    large: '/icons/settings-32.png',
    alt: '⚙️'
  },
  documents: {
    small: '/icons/documents-16.png',
    large: '/icons/documents-32.png',
    alt: '📄'
  },
  programs: {
    small: '/icons/programs-16.png',
    large: '/icons/programs-32.png',
    alt: '📁'
  }
};

export const getAppIcon = (appId: string): AppIcon => {
  return APP_ICONS[appId] || {
    small: '/icons/default-16.png',
    large: '/icons/default-32.png',
    alt: '📄'
  };
}; 