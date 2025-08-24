import React from 'react';
import { cn } from '../lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'narrow' | 'content' | 'wide' | 'full' | 'responsive';
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  size = 'responsive',
  className = '',
  as: Component = 'div'
}) => {
  const sizeClass = `container-${size}`;
  
  return (
    <Component className={cn(sizeClass, 'container-base', className)}>
      {children}
    </Component>
  );
};