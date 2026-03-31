import type { ReactNode, SelectHTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

const Select = ({ className, ...props }: SelectProps): ReactNode => {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-950 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
};

export { Select };
