import { CircleAlert, CircleCheck, Info, TriangleAlert, WifiOff, X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type FeedbackTone = "info" | "success" | "warning" | "danger";

const toneClasses: Record<FeedbackTone, string> = {
  info: "border-accent/25 bg-accent-soft text-ink [&_[data-icon]]:text-accent-ink",
  success: "border-success/25 bg-success-soft text-ink [&_[data-icon]]:text-success-ink",
  warning: "border-warning/30 bg-warning-soft text-ink [&_[data-icon]]:text-warning-ink",
  danger: "border-danger/25 bg-danger-soft text-ink [&_[data-icon]]:text-danger-ink",
};

const toneIcon: Record<FeedbackTone, ReactNode> = {
  info: <Info />,
  success: <CircleCheck />,
  warning: <TriangleAlert />,
  danger: <CircleAlert />,
};

/**
 * Baner na całą szerokość („Wyniki niezatwierdzone – uczniowie ich jeszcze nie widzą.”).
 * `title` jest pogrubiony i wchodzi w tę samą linię co treść.
 */
export function Banner({
  tone = "info",
  title,
  icon,
  action,
  className,
  children,
}: {
  tone?: FeedbackTone;
  title?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-input border px-4 py-3 text-body",
        toneClasses[tone],
        className,
      )}
    >
      <span data-icon className="mt-0.5 shrink-0 [&_svg]:size-4" aria-hidden>
        {icon ?? toneIcon[tone]}
      </span>
      <p className="min-w-0 flex-1">
        {title && <strong className="font-semibold">{title} </strong>}
        {children}
      </p>
      {action && <div className="shrink-0 text-[13px] font-medium">{action}</div>}
    </div>
  );
}

/** Ikona dla banera utraty połączenia. */
export const OfflineIcon = <WifiOff />;

/**
 * Toast („Link skopiowany · Cofnij”). Komponent prezentacyjny — kolejkę
 * i pozycjonowanie doda warstwa powiadomień.
 */
export function Toast({
  tone = "success",
  title,
  icon,
  action,
  onClose,
  className,
  children,
}: {
  tone?: FeedbackTone;
  title: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  onClose?: () => void;
  className?: string;
  children?: ReactNode;
}) {
  const iconColor = {
    info: "text-accent-ink",
    success: "text-success-ink",
    warning: "text-warning-ink",
    danger: "text-danger-ink",
  }[tone];
  return (
    <div
      role="status"
      className={cn(
        "flex w-full max-w-sm items-start gap-3 rounded-card border border-line bg-surface p-3.5 shadow-md",
        className,
      )}
    >
      <span className={cn("mt-0.5 shrink-0 [&_svg]:size-4", iconColor)} aria-hidden>
        {icon ?? toneIcon[tone]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold text-ink">{title}</p>
        {children && <p className="text-[13px] text-ink-2">{children}</p>}
      </div>
      {action && <div className="shrink-0 text-[13px] font-medium">{action}</div>}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Zamknij"
          className="shrink-0 rounded-sm text-ink-3 hover:text-ink"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Okno modalne (prezentacja). `blocking` = bez zamykania kliknięciem w tło
 * (np. „Wyszedłeś z trybu pełnoekranowego”).
 */
export function ModalPanel({
  title,
  description,
  icon,
  iconTone = "warning",
  footer,
  className,
  children,
  ...props
}: Omit<ComponentProps<"div">, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  iconTone?: FeedbackTone;
  footer?: ReactNode;
}) {
  const iconBg = {
    info: "bg-accent-soft text-accent-ink",
    success: "bg-success-soft text-success-ink",
    warning: "bg-warning-soft text-warning-ink",
    danger: "bg-danger-soft text-danger-ink",
  }[iconTone];
  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "w-full max-w-md rounded-modal border border-line bg-surface p-6 shadow-lg",
        className,
      )}
      {...props}
    >
      {icon && (
        <span
          className={cn(
            "mb-4 inline-flex size-10 items-center justify-center rounded-[12px] [&_svg]:size-5",
            iconBg,
          )}
          aria-hidden
        >
          {icon}
        </span>
      )}
      <h2 className="font-display text-h3 text-ink">{title}</h2>
      {description && <p className="mt-2 text-body text-ink-2">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
      {footer && <div className="mt-6 flex items-center justify-end gap-2">{footer}</div>}
    </div>
  );
}

/** Przyciemnione tło pod modalem. */
export function ModalBackdrop({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4", className)}
      {...props}
    />
  );
}

/** Szkielet ładowania — zachowuje układ treści. */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("animate-pulse rounded-tag bg-subtle", className)} {...props} />;
}
