import * as React from "react"
import { cn } from "@/lib/utils"

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn("relative inline-flex w-full items-center", className)}
      {...props}
    />
  )
}

function InputGroupAddon({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group-addon"
      className={cn(
        "pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-2 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { InputGroup, InputGroupAddon }
