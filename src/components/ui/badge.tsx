import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 dark:bg-red-600 dark:text-white",
        outline: "text-foreground dark:text-gray-100 dark:border-gray-500",
        success: "border-transparent bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700",
        warning: "border-transparent bg-yellow-500 text-gray-900 hover:bg-yellow-600 dark:bg-yellow-600 dark:text-white dark:hover:bg-yellow-700",
        info: "border-transparent bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700",
        archived: "border bg-gray-500 text-white hover:bg-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-900 dark:border dark:border-gray-300 font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }