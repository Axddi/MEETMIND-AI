"use client"

import { Brain } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-background/50 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center md:flex-row md:justify-between md:px-6 md:text-left">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            &copy; 2026 MeetMind AI
          </span>
        </div>
        <span className="text-xs text-muted-foreground/60">
          Built with AWS Bedrock + Serverless Architecture
        </span>
      </div>
    </footer>
  )
}
