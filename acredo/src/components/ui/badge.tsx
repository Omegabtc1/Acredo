import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-border bg-surface-2 text-foreground",
        primary:
          "border-white/10 bg-primary/15 text-foreground",
        accent:
          "border-white/10 bg-accent/15 text-foreground",
        success:
          "border-white/10 bg-success/15 text-foreground",
        warning:
          "border-white/10 bg-warning/15 text-foreground",
        danger:
          "border-white/10 bg-danger/15 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

