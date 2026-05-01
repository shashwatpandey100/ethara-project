"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PaginationMeta {
  page: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
}

interface FloatingBarProps {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: "absolute" | "fixed";
  closeDisabled?: boolean;
  pagination?: PaginationMeta;
}

function BorderButton({
  onClick,
  disabled,
  tooltip,
  children,
  className = "",
  border = "left",
}: {
  onClick?: () => void;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
  className?: string;
  border?: "left" | "right" | "none";
}) {
  const borderClass = border === "left" ? "border-l" : border === "right" ? "border-r" : "";

  return (
    <div className={`flex h-full items-center justify-center border-white/20 ${borderClass}`}>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex h-full items-center">
              <Button
                variant="ghost"
                onClick={onClick}
                disabled={disabled}
                className={`aspect-square h-full rounded-none text-sm hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 ${className}`}
              >
                {children}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export function FloatingBar({
  show,
  onClose,
  children,
  position = "fixed",
  closeDisabled = false,
  pagination,
}: FloatingBarProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={show ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`${position} bottom-8 z-50 flex h-13 -translate-x-1/2 items-center justify-between rounded-lg bg-[#141414] text-[13px] text-white/80 whitespace-nowrap`}
      style={{
        pointerEvents: show ? "auto" : "none",
        left:
          position === "fixed"
            ? "calc(var(--sidebar-width, 0px) + (100% - var(--sidebar-width, 0px)) / 2)"
            : "50%",
      }}
    >
      {pagination && (
        <div className="flex h-full items-center">
          <BorderButton
            onClick={() => pagination.onPageChange(pagination.page - 1)}
            disabled={!pagination.hasPrevPage}
            tooltip={!pagination.hasPrevPage ? "You're on the first page" : "Previous page"}
            className="rounded-l-lg"
            border="none"
          >
            <ChevronLeft size={20} className="min-h-5 min-w-5" />
          </BorderButton>

          <div className="flex h-full items-center px-1">
            <span className="border-l border-r border-white/20 px-3 py-1 text-[13px] text-white/60 whitespace-nowrap">
              {pagination.page} / {pagination.totalPages}
            </span>
          </div>

          <BorderButton
            onClick={() => pagination.onPageChange(pagination.page + 1)}
            disabled={!pagination.hasNextPage}
            tooltip={!pagination.hasNextPage ? "You're on the last page" : "Next page"}
            border="right"
          >
            <ChevronRight size={20} className="min-h-5 min-w-5" />
          </BorderButton>
        </div>
      )}

      <div className="flex items-center gap-2 px-4">{children}</div>

      <div className="flex h-full items-center">
        <BorderButton
          onClick={onClose}
          disabled={closeDisabled}
          tooltip={closeDisabled ? "Nothing selected to close" : "Clear selection"}
          className="rounded-r-lg"
        >
          <X size={15} />
        </BorderButton>
      </div>
    </motion.div>
  );
}
