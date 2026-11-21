import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "sketch";
  size?: "sm" | "md" | "lg";
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  startIcon,
  endIcon,
  loading = false,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all select-none active:translate-y-[1.5px] disabled:opacity-40 disabled:pointer-events-none disabled:active:translate-y-0 cursor-pointer relative";

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs gap-1.5 rounded-md",
    md: "px-4 py-2 text-xs font-mono gap-2 rounded-md",
    lg: "px-5 py-2.5 text-sm gap-2.5 rounded-lg",
  };

  const variantStyles = {
    primary:
      "bg-[var(--accent-primary)] hover:opacity-95 text-white font-mono shadow-sm border border-[var(--accent-primary)] shadow-[var(--accent-glow)] tracking-tight",
    secondary:
      "bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] font-mono border border-[var(--border-strong)]",
    outline:
      "bg-transparent hover:bg-[var(--border-subtle)] text-[var(--text-primary)] font-mono border border-[var(--border-strong)] shadow-sm",
    ghost:
      "bg-transparent hover:bg-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono border border-transparent",
    danger:
      "bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-mono border border-rose-500/30",
    sketch:
      "bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] font-pencil text-base border-2 border-dashed border-[var(--border-strong)] shadow-sm hover:border-[var(--accent-primary)]",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        startIcon && <span className="shrink-0">{startIcon}</span>
      )}
      <span>{children}</span>
      {!loading && endIcon && <span className="shrink-0">{endIcon}</span>}
    </button>
  );
};
export default Button;
