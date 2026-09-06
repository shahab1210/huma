import React from 'react';
import { Spinner } from './Spinner';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({ loading = false, children, disabled, className = '', ...props }) => (
  <button
    {...props}
    disabled={loading || disabled}
    className={`${className} ${loading ? 'opacity-80 cursor-not-allowed' : ''}`}
  >
    {loading ? (
      <span className="flex items-center justify-center gap-2">
        <Spinner size="sm" />
        <span>{children}</span>
      </span>
    ) : (
      children
    )}
  </button>
);
