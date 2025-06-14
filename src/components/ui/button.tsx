import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quant-accent focus-visible:ring-offset-2 focus-visible:ring-offset-quant-bg disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-quant-accent text-quant-bg shadow-soft hover:bg-quant-accent/90 hover:shadow-glow rounded-2xl",
        destructive:
          "bg-quant-error text-white shadow-soft hover:bg-quant-error/90 rounded-2xl",
        outline:
          "border border-quant-border bg-transparent shadow-soft hover:bg-quant-accent/10 hover:border-quant-accent text-quant-text rounded-2xl",
        secondary:
          "bg-quant-accent-secondary text-white shadow-soft hover:bg-quant-accent-secondary/90 hover:shadow-glow-blue rounded-2xl",
        ghost: "hover:bg-quant-accent/10 hover:text-quant-accent rounded-xl",
        link: "text-quant-accent underline-offset-4 hover:underline",
        code: "bg-quant-bg-secondary border border-quant-border text-quant-text hover:border-quant-accent/50 rounded-xl font-mono text-xs",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-8 rounded-xl px-4 text-xs",
        lg: "h-12 rounded-2xl px-8 text-base",
        icon: "h-10 w-10 rounded-xl",
        code: "h-8 px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
