"use client"

import { motion } from "framer-motion"
import { Brain, LayoutDashboard, CreditCard } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function Navbar() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/60 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-none tracking-tight text-foreground">
              MeetMind AI
            </span>
            <span className="text-[10px] leading-none text-muted-foreground">
              AI Meeting Intelligence
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          <a
            href="#"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
          </a>
          <a
            href="#"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <CreditCard className="h-4 w-4" />
          </a>
          <div className="ml-2 h-6 w-px bg-border/50" />
          <Avatar className="ml-2 h-8 w-8 cursor-pointer border border-border/50 transition-colors hover:border-primary/50">
            <AvatarFallback className="bg-secondary text-xs text-muted-foreground">
              AS
            </AvatarFallback>
          </Avatar>
        </nav>
      </div>
    </motion.header>
  )
}
