import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-xl border px-3 py-1 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-quant-accent focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-quant-accent text-quant-bg shadow-soft hover:bg-quant-accent/90",
        secondary:
          "border-transparent bg-quant-bg-secondary text-quant-text border-quant-border hover:bg-quant-bg-tertiary",
        destructive:
          "border-transparent bg-quant-error text-white shadow-soft hover:bg-quant-error/80",
        outline: "text-quant-text border-quant-border hover:bg-quant-accent/10",
        success:
          "border-transparent bg-quant-success text-quant-bg shadow-soft hover:bg-quant-success/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
