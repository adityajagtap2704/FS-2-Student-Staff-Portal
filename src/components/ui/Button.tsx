"use client";

import { ButtonHTMLAttributes, forwardRef, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-primary text-white shadow-glow hover:shadow-glow-lg disabled:opacity-50 disabled:shadow-none",
  secondary:
    "bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 disabled:opacity-50",
  danger:
    "bg-red-500 text-white hover:bg-red-600 shadow-sm disabled:opacity-50",
  ghost:
    "bg-transparent text-[#444] hover:bg-gray-100 disabled:opacity-50",
  outline:
    "bg-white text-[#444] border border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-card disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  xs: "px-2.5 py-1 text-xs gap-1 min-h-[28px]",
  sm: "px-3 py-1.5 text-sm gap-1.5 min-h-[32px]",
  md: "px-4 py-2 text-sm gap-2 min-h-[36px]",
  lg: "px-5 py-2.5 text-base gap-2 min-h-[42px]",
  xl: "px-6 py-3 text-base gap-2.5 min-h-[48px]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      icon,
      iconRight,
      fullWidth = false,
      className = "",
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        disabled={disabled || loading}
        whileHover={{ scale: disabled || loading ? 1 : 1.02, filter: disabled || loading ? "brightness(1)" : "brightness(1.05)" }}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
        className={`
          inline-flex items-center justify-center font-medium rounded-xl
          transition-colors duration-150
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
          disabled:cursor-not-allowed select-none
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {loading ? (
          <motion.svg
            className="h-4 w-4 shrink-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </motion.svg>
        ) : icon ? (
          <motion.span
            className="shrink-0"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {icon}
          </motion.span>
        ) : null}
        {children && <span>{children}</span>}
        {!loading && iconRight && (
          <motion.span
            className="shrink-0 ml-auto"
            whileHover={{ x: 2 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {iconRight}
          </motion.span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
export default Button;
