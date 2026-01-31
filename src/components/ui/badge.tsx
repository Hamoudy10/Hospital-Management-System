import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#2438a6] text-white",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        success: "border-transparent bg-[#41a02f] text-white",
        warning: "border-transparent bg-[#e88b39] text-white",
        destructive: "border-transparent bg-[#9b162d] text-white",
        purple: "border-transparent bg-[#a06695] text-white",
        muted: "border-transparent bg-[#70748d] text-white",
        outline: "text-foreground border-current",
        
        // Status variants
        active: "border-transparent bg-green-100 text-green-800",
        inactive: "border-transparent bg-gray-100 text-gray-800",
        pending: "border-transparent bg-yellow-100 text-yellow-800",
        completed: "border-transparent bg-blue-100 text-blue-800",
        cancelled: "border-transparent bg-red-100 text-red-800",
        
        // Appointment status
        scheduled: "border-transparent bg-blue-100 text-blue-800",
        confirmed: "border-transparent bg-green-100 text-green-800",
        checked_in: "border-transparent bg-purple-100 text-purple-800",
        in_progress: "border-transparent bg-orange-100 text-orange-800",
        no_show: "border-transparent bg-red-100 text-red-800",
        
        // Invoice status
        draft: "border-transparent bg-gray-100 text-gray-800",
        partial: "border-transparent bg-orange-100 text-orange-800",
        paid: "border-transparent bg-green-100 text-green-800",
        overdue: "border-transparent bg-red-100 text-red-800",
        refunded: "border-transparent bg-purple-100 text-purple-800",
        
        // Priority
        low: "border-transparent bg-gray-100 text-gray-700",
        normal: "border-transparent bg-blue-100 text-blue-800",
        high: "border-transparent bg-orange-100 text-orange-800",
        urgent: "border-transparent bg-red-100 text-red-800",
        critical: "border-transparent bg-red-200 text-red-900",
        
        // Lab status
        collected: "border-transparent bg-blue-100 text-blue-800",
        received: "border-transparent bg-purple-100 text-purple-800",
        processing: "border-transparent bg-orange-100 text-orange-800",
        verified: "border-transparent bg-green-100 text-green-800",
        rejected: "border-transparent bg-red-100 text-red-800",
        
        // Prescription
        dispensed: "border-transparent bg-green-100 text-green-800",
        expired: "border-transparent bg-red-100 text-red-800",
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
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// Status Badge with auto variant detection
interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: string;
}

function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const variant = status.toLowerCase().replace(/\s+/g, '_') as VariantProps<typeof badgeVariants>['variant'];
  const displayText = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return (
    <Badge variant={variant} className={className} {...props}>
      {displayText}
    </Badge>
  );
}

export { Badge, StatusBadge, badgeVariants };