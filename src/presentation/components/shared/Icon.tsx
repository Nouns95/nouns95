"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { getAppIcon } from '@/src/config/icons';
import type { IconComponentProps } from '@/src/config/icons';
import { StaticImport } from 'next/dist/shared/lib/get-img-props';

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

  if (icon.isComponent) {
    const IconComponent = icon.icon as React.ComponentType<IconComponentProps>;
    return (
      <IconComponent
        width={width}
        height={height}
        className={`icon ${className}`}
      />
    );
  }

  return (
    <Image
      src={icon.icon as (string | StaticImport)}
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