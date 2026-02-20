"use client"

import { motion } from "framer-motion"
import { Upload, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeroSectionProps {
  onUploadClick: () => void
}

export function HeroSection({ onUploadClick }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-20 md:px-6 md:pb-24 md:pt-32">
      {/* Gradient glow background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute left-1/4 top-1/4 h-[300px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute right-1/4 top-1/3 h-[250px] w-[350px] rounded-full bg-chart-5/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-3 py-1"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground">
            Powered by AWS Bedrock
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl"
        >
          Turn Long Meetings Into{" "}
          <span className="bg-gradient-to-r from-primary to-chart-5 bg-clip-text text-transparent">
            Clear Decisions
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mb-10 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg"
        >
          Upload your meeting transcript and instantly get a structured summary,
          action items, and sentiment analysis.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button
            size="lg"
            className="group gap-2 rounded-xl bg-primary px-6 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
            onClick={onUploadClick}
          >
            <Upload className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
            Upload Transcript
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
