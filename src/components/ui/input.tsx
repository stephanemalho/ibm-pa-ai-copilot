import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input = ({
  className,
  type = "text",
  ...props
}: InputProps): ReactNode => {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-950 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      type={type}
      {...props}
    />
  );
};

export { Input };
