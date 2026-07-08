import React from 'react';
import { cn } from '../utils/helpers';
import { CAL_CONFIG } from '../constants/index';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  asBookingButton?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  asBookingButton = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-bold rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-yellow disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-brand-yellow text-brand-black hover:bg-[#fcd34d] shadow-[0_6px_0_0_#bfa322] hover:-translate-y-1 hover:shadow-[0_8px_0_0_#bfa322] active:translate-y-1 active:shadow-none border border-brand-yellow',
    secondary: 'bg-white text-black hover:bg-gray-100',
    ghost: 'bg-transparent text-white hover:bg-white/10',
    outline: 'bg-transparent border-2 border-white/20 text-white hover:border-white hover:bg-white/5',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-6 py-2.5 text-sm gap-2',
    lg: 'px-8 py-4 text-lg gap-3',
  };

  const bookingAttributes = asBookingButton
    ? {
      'data-cal-link': CAL_CONFIG.link,
      'data-cal-namespace': CAL_CONFIG.namespace,
      'data-cal-config': JSON.stringify(CAL_CONFIG.config),
    }
    : {};

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isLoading}
      {...bookingAttributes}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="animate-spin">⏳</span>
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
