import React from 'react';

export interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  size = 'md',
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className='w-full'>
      {label && (
        <div className='flex justify-between text-sm text-gray-600 mb-1'>
          <span>{label}</span>
          <span>{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className='bg-blue-600 h-full rounded-full transition-all duration-300'
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};
