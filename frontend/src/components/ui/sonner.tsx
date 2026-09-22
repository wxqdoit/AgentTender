"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckCircle2, Info, AlertTriangle, XCircle, Loader2 } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group font-mono"
      icons={{
        success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
        info: <Info className="w-4 h-4 text-blue-500 shrink-0" />,
        warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
        error: <XCircle className="w-4 h-4 text-destructive shrink-0" />,
        loading: <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast font-mono text-xs border border-border bg-card text-foreground shadow-md rounded-md p-3 gap-2.5",
          description: "text-muted-foreground text-[11px] leading-relaxed",
          actionButton:
            "bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded",
          cancelButton:
            "bg-secondary text-muted-foreground text-xs font-semibold px-2.5 py-1 rounded",
          error: "border-destructive/40 bg-card text-destructive",
          success: "border-emerald-500/40 bg-card text-foreground",
          warning: "border-amber-500/40 bg-card text-amber-500",
          info: "border-blue-500/40 bg-card text-blue-500",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
