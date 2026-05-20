import type { ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Modal({ open, onClose, title, children }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/42 p-4">
      <div className="relative w-full max-w-xl rounded-md border border-[#C8D4E1] bg-white shadow-[0_16px_36px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between gap-4 border-b border-[#D9E2EC] px-5 py-4">
          <h2 className="text-base font-semibold text-[#102A43]">{title}</h2>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#C8D4E1] text-[#60738A] transition hover:bg-[#F6F8FA] hover:text-[#102A43]"
            aria-label="Fechar"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
