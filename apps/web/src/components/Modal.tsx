import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Modal({ open, onClose, title, children }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#003366]">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}