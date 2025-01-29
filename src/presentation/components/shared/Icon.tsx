"use client";

import React, { useState } from 'react';
import { getAppIcon } from '@/src/config/icons';

interface IconProps {
  appId: string;
  size?: 'small' | 'large';
  className?: string;
}

const Icon: React.FC<IconProps> = ({ appId, size = 'small', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const icon = getAppIcon(appId);
  const imagePath = size === 'small' ? icon.small : icon.large;

  if (imageError) {
    return <span className={`icon-fallback ${className}`}>{icon.alt}</span>;
  }

  return (
    <img
      src={imagePath}
      alt={appId}
      className={`icon ${className}`}
      onError={() => setImageError(true)}
    />
  );
};

export default Icon; 