"use client";

import React from 'react';

interface IconProps {
  label: string;
  icon: string;
  onClick: () => void;
}

const Icon: React.FC<IconProps> = ({ label, icon, onClick }) => {
  return (
    <div 
      className="desktop-icon"
      onClick={onClick}
      onDoubleClick={onClick}
    >
      <div className="desktop-icon-image">{icon}</div>
      <span className="desktop-icon-label">
        {label}
      </span>
    </div>
  );
};

export default Icon;
