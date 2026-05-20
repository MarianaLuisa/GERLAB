import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { AlertCircle, CheckCircle2, Inbox } from "lucide-react";
import type { LockerStatus } from "../types/models";

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="border-b border-[#D9E2EC] pb-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#60738A]">
          GERLAB
        </p>
        <h1 className="mt-1 text-[1.55rem] font-semibold leading-tight tracking-[-0.01em] text-[#102A43]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#5F6F82]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div> : null}
      </div>
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#E2E8F0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-sm font-semibold text-[#102A43]">{title}</h2>
        {description ? <p className="mt-0.5 text-xs leading-5 text-[#60738A]">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-md border border-[#D9E2EC] bg-white",
        className
      )}
    >
      {children}
    </section>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  variant = "secondary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      "border-[#0F62A8] bg-[#0F62A8] text-white hover:bg-[#0B4F86] focus:ring-[#0F62A8]/20",
    secondary:
      "border-[#C8D4E1] bg-white text-[#24364B] hover:border-[#9FB4CA] hover:bg-[#F6F8FA] focus:ring-[#0F62A8]/15",
    ghost:
      "border-transparent bg-transparent text-[#0F62A8] hover:bg-[#EDF4FB] focus:ring-[#0F62A8]/15",
    danger:
      "border-[#E7B8B8] bg-white text-[#B42318] hover:bg-[#FFF5F5] focus:ring-[#B42318]/15",
  };

  return (
    <button
      {...props}
      className={cx(
        "inline-flex min-h-9 items-center justify-center gap-2 rounded border px-3.5 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 disabled:opacity-50",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-[#344054]">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-[#7A8798]">{hint}</span> : null}
    </label>
  );
}

const controlClass =
  "w-full rounded border border-[#C8D4E1] bg-white px-3 py-2.5 text-sm text-[#1D2939] outline-none transition placeholder:text-[#98A2B3] hover:border-[#9FB4CA] focus:border-[#0F62A8] focus:ring-2 focus:ring-[#0F62A8]/15";

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(controlClass, className)} />;
}

export function SelectInput({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cx(controlClass, "pr-9", className)}>
      {children}
    </select>
  );
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(controlClass, "min-h-24 resize-y", className)} />;
}

export function Alert({
  type = "error",
  children,
}: {
  type?: "error" | "success";
  children: ReactNode;
}) {
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div
      className={cx(
        "flex items-start gap-2 rounded-md border px-3 py-3 text-sm",
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-700"
      )}
    >
      <Icon size={17} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: LockerStatus }) {
  const map: Record<LockerStatus, string> = {
    FREE: "bg-[#F0FDF4] text-[#166534] ring-[#BBF7D0]",
    OCCUPIED: "bg-[#EFF6FF] text-[#1D4ED8] ring-[#BFDBFE]",
    MAINTENANCE: "bg-[#FFFBEB] text-[#92400E] ring-[#FDE68A]",
  };
  const label: Record<LockerStatus, string> = {
    FREE: "Livre",
    OCCUPIED: "Ocupado",
    MAINTENANCE: "Manutenção",
  };
  return (
    <span className={cx("inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold ring-1 ring-inset", map[status])}>
      {label[status]}
    </span>
  );
}

export function DataToolbar({
  children,
  meta,
}: {
  children: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <Panel className="p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">{children}</div>
        {meta ? <div className="shrink-0 text-sm text-[#60738A]">{meta}</div> : null}
      </div>
    </Panel>
  );
}

export function CountBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-[#D9E2EC] bg-[#F8FAFC] px-2.5 py-1 text-xs font-semibold text-[#526579]">
      {children}
    </span>
  );
}

export function TableShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Panel className={cx("overflow-hidden", className)}>
      <div className="app-scrollbar overflow-x-auto">{children}</div>
    </Panel>
  );
}

export function EmptyCell({ children, colSpan }: { children: ReactNode; colSpan: number }) {
  return (
    <tr>
      <td className="px-5 py-12 text-center text-sm text-[#60738A]" colSpan={colSpan}>
        <div className="flex flex-col items-center gap-2">
          <Inbox size={22} className="text-[#8AA0B8]" />
          <span>{children}</span>
        </div>
      </td>
    </tr>
  );
}

export function MetricCard({
  title,
  value,
  description,
  accent = "blue",
}: {
  title: string;
  value: ReactNode;
  description?: string;
  accent?: "blue" | "green" | "amber" | "slate";
}) {
  const accents = {
    blue: "border-l-[#0F62A8]",
    green: "border-l-[#15803D]",
    amber: "border-l-[#B45309]",
    slate: "border-l-[#526579]",
  };

  return (
    <Panel className={cx("border-l-4 p-4", accents[accent])}>
      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-[#60738A]">{title}</div>
      <div className="mt-2 text-2xl font-semibold tracking-[-0.01em] text-[#102A43]">{value}</div>
      {description ? <div className="mt-1 text-xs leading-5 text-[#60738A]">{description}</div> : null}
    </Panel>
  );
}

export const tableClass = "min-w-full text-sm";
export const theadClass = "border-b border-[#D9E2EC] bg-[#F6F8FA] text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#526579]";
export const thClass = "px-4 py-3";
export const tdClass = "border-b border-[#E8EDF3] px-4 py-3 align-middle";
