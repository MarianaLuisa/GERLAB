import type { ReactNode } from "react";

export function Toast({ children }: { children: ReactNode }) {
  return (
    <div className="fixed bottom-4 right-4 bg-white border border-[#E6EAF0] shadow-[0_10px_30px_rgba(0,0,0,0.12)] rounded-2xl px-4 py-3 text-sm">
      {children}
    </div>
  );
}