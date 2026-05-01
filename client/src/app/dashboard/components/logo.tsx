import { ClipboardList } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#141414]">
        <ClipboardList className="text-white" size={14} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#141414]">
        <ClipboardList className="text-white" size={14} />
      </div>
      <span className="text-[15px] font-semibold text-[#141414]">TaskScribe</span>
    </div>
  );
}
