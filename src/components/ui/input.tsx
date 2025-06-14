import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-quant-border bg-quant-bg-secondary px-4 py-2 text-sm text-quant-text shadow-soft transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-quant-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quant-accent focus-visible:border-quant-accent disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
