import { LoaderCircle } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold select-none " +
  "transition-[background-color,border-color,color,box-shadow] duration-150 " +
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-offset-0 " +
  "disabled:cursor-not-allowed aria-busy:cursor-progress";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-on-accent hover:bg-accent-hover focus-visible:ring-primary-300 " +
    "disabled:bg-subtle disabled:text-ink-3 aria-busy:bg-accent/80 aria-busy:text-on-accent",
  secondary:
    "border border-line bg-surface text-ink shadow-sm hover:bg-subtle focus-visible:ring-primary-300/60 " +
    "disabled:text-ink-3 disabled:shadow-none",
  ghost:
    "text-ink hover:bg-subtle focus-visible:ring-primary-300/60 disabled:text-ink-3 disabled:hover:bg-transparent",
  danger:
    "bg-danger text-white hover:bg-danger-hover focus-visible:ring-danger/40 " +
    "disabled:bg-subtle disabled:text-ink-3",
  link:
    "h-auto! px-0! text-accent-ink underline underline-offset-4 decoration-1 hover:text-accent " +
    "focus-visible:ring-primary-300/60 rounded-sm disabled:text-ink-3",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-7 px-2.5 text-[13px] rounded-[8px] [&_svg]:size-3.5",
  md: "h-9 px-3.5 text-body rounded-input [&_svg]:size-4",
  lg: "h-11 px-5 text-[15px] rounded-[12px] [&_svg]:size-[18px]",
};

export type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: ReactNode;
  icon?: ReactNode;
  iconRight?: ReactNode;
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  icon,
  iconRight,
  className,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle className="animate-spin" aria-hidden /> : icon}
      {loading && loadingText ? loadingText : children}
      {!loading && iconRight}
    </button>
  );
}

export function IconButton({
  label,
  variant = "ghost",
  size = "md",
  className,
  children,
  ...props
}: Omit<ButtonProps, "icon" | "iconRight"> & { label: string }) {
  const square = { sm: "w-7 px-0", md: "w-9 px-0", lg: "w-11 px-0" }[size];
  return (
    <Button
      variant={variant}
      size={size}
      aria-label={label}
      title={label}
      className={cn(square, className)}
      {...props}
    >
      {children}
    </Button>
  );
}
