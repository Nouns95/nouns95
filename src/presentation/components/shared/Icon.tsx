"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { getAppIcon } from '@/src/config/icons';

interface IconProps {
  appId: string;
  className?: string;
  width?: number;
  height?: number;
}

const Icon: React.FC<IconProps> = ({ 
  appId, 
  className = '',
  width = 24,
  height = 24
}) => {
  const [imageError, setImageError] = useState(false);
  const icon = getAppIcon(appId);

  if (imageError) {
    return <span className={`icon-fallback ${className}`}>{icon.alt}</span>;
  }

  return (
    <Image
      src={icon.icon}
      alt={appId}
      width={width}
      height={height}
      className={`icon ${className}`}
      onError={() => setImageError(true)}
      style={{ objectFit: 'contain' }}
    />
  );
};

export default Icon; 