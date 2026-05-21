import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

export function Toast({ children }: { children: ReactNode }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-2.5 rounded-md border border-[#C8D4E1] bg-white px-3.5 py-2.5 text-[13px] leading-5 text-[#24364B] shadow-[0_8px_22px_rgba(15,23,42,0.12)]">
      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
      <div>{children}</div>
    </div>
  );
}
