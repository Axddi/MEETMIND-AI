"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import {
  FileText,
  CheckSquare,
  BarChart3,
  Copy,
  Check,
  Download,
  Hash,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { SentimentBadge } from "@/components/sentiment-badge"
import { toast } from "sonner"
import type { AppStatus, MeetingResult } from "@/lib/types"

interface ResultsPanelProps {
  status: AppStatus
  result: MeetingResult | null
}

export function ResultsPanel({ status, result }: ResultsPanelProps) {
  const [copied, setCopied] = useState(false)
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({})

  const handleCopy = useCallback(async () => {
    if (!result?.summary) return
    try {
      await navigator.clipboard.writeText(result.summary)
      setCopied(true)
      toast.success("Copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }, [result?.summary])

  const handleDownloadJson = useCallback(() => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `meeting-${result.meetingId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Downloaded as JSON")
  }, [result])

  const toggleItem = useCallback((index: number) => {
    setCheckedItems((prev) => ({ ...prev, [index]: !prev[index] }))
  }, [])

  if (status === "idle" || status === "uploading") return null

  // Processing skeleton state
  if (status === "processing") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-6xl px-4 pb-20 pt-12 md:px-6"
      >
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl"
            >
              <div className="border-b border-border/30 px-6 py-4">
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-3 p-6">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    )
  }

  if (status === "failed") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-2xl px-4 pb-20 pt-12 md:px-6"
      >
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center backdrop-blur-xl">
          <p className="text-sm text-destructive">
            Processing failed. Please try uploading again.
          </p>
        </div>
      </motion.div>
    )
  }

  if (!result || status !== "completed") return null

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, duration: 0.5, ease: "easeOut" },
    }),
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-6xl px-4 pb-20 pt-12 md:px-6"
    >
      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"
      >
        <div className="flex items-center gap-2">
          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono text-xs text-muted-foreground">
            {result.meetingId}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-1.5 rounded-lg border-border/50 bg-secondary/50 text-xs text-foreground hover:border-primary/30 hover:bg-secondary"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy Summary"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadJson}
            className="gap-1.5 rounded-lg border-border/50 bg-secondary/50 text-xs text-foreground hover:border-primary/30 hover:bg-secondary"
          >
            <Download className="h-3.5 w-3.5" />
            Download JSON
          </Button>
        </div>
      </motion.div>

      {/* Result cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Summary Card */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl md:col-span-2"
        >
          <div className="flex items-center gap-2 border-b border-border/30 px-6 py-4">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">Summary</h3>
          </div>
          <ScrollArea className="h-[280px]">
            <div className="p-6">
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {result.summary || "No summary available."}
              </p>
            </div>
          </ScrollArea>
        </motion.div>

        {/* Sentiment Card */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 border-b border-border/30 px-6 py-4">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">
              Team Sentiment
            </h3>
          </div>
          <div className="flex items-center justify-center p-6">
            {result.sentiment ? (
              <SentimentBadge sentiment={result.sentiment} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No sentiment data available.
              </p>
            )}
          </div>
        </motion.div>

        {/* Action Items Card */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl md:col-span-3"
        >
          <div className="flex items-center gap-2 border-b border-border/30 px-6 py-4">
            <CheckSquare className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">
              Action Items
            </h3>
            {result.actionItems && (
              <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                {result.actionItems.length}
              </span>
            )}
          </div>
          <ScrollArea className="max-h-[300px]">
            <div className="p-6">
              {result.actionItems && result.actionItems.length > 0 ? (
                <ul className="space-y-3">
                  {result.actionItems.map((item, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                    >
                      <button
                        onClick={() => toggleItem(index)}
                        className="group flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-secondary/50"
                      >
                        <Checkbox
                          checked={checkedItems[index] || false}
                          onCheckedChange={() => toggleItem(index)}
                          className="mt-0.5 border-border/80 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                        />
                        <span
                          className={`text-sm leading-relaxed transition-all ${
                            checkedItems[index]
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {item}
                        </span>
                      </button>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No action items found.
                </p>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      </div>
    </motion.div>
  )
}
