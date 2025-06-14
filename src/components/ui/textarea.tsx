import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-quant-border bg-quant-bg-secondary px-4 py-3 text-sm text-quant-text shadow-soft transition-all duration-200 placeholder:text-quant-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quant-accent focus-visible:border-quant-accent disabled:cursor-not-allowed disabled:opacity-50 font-mono",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
