import React from 'react';

interface WindowContentProps {
  children: React.ReactNode;
  className?: string;
}

const WindowContent: React.FC<WindowContentProps> = ({ children, className }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default WindowContent;
