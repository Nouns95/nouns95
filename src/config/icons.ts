export interface AppIcon {
  icon: string;  // Path to the icon in public directory
  alt: string;   // Fallback emoji/text icon
}

export interface AppIcons {
  [key: string]: AppIcon;
}

export const APP_ICONS: AppIcons = {
  wallet: {
    icon: '/icons/apps/wallet/wallet.png',
    alt: '💰'
  },
  settings: {
    icon: '/icons/apps/settings/settings.png',
    alt: '⚙️'
  },
  programs: {
    icon: '/icons/apps/programs/programs.png',
    alt: '📁'
  },
  fileexplorer: {
    icon: '/icons/apps/fileexplorer/folders/folder.png',
    alt: '📂'
  }
};

export const getAppIcon = (appId: string): AppIcon => {
  return APP_ICONS[appId] || {
    icon: '/icons/apps/default/default.png',
    alt: '📄'
  };
}; 