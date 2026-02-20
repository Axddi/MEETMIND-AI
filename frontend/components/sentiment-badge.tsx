"use client"

import { motion } from "framer-motion"

interface SentimentBadgeProps {
  sentiment: "Positive" | "Neutral" | "Negative"
}

const sentimentConfig = {
  Positive: {
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    emoji: "😊",
    label: "Positive",
    description: "The overall tone of the meeting was constructive and optimistic.",
  },
  Neutral: {
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    emoji: "😐",
    label: "Neutral",
    description: "The meeting had a balanced, objective tone throughout.",
  },
  Negative: {
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    emoji: "😟",
    label: "Negative",
    description: "Some tension or concerns were detected in the discussion.",
  },
}

export function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  const config = sentimentConfig[sentiment]

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="text-5xl"
        role="img"
        aria-label={`${config.label} sentiment`}
      >
        {config.emoji}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium ${config.color}`}
      >
        {config.label}
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-xs leading-relaxed text-muted-foreground"
      >
        {config.description}
      </motion.p>
    </div>
  )
}
