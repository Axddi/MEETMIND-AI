"use client"

import { useCallback, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import type { AppStatus, UploadResponse, MeetingResult } from "@/lib/types"

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://0kzzty22ni.execute-api.ap-south-1.amazonaws.com"

interface UploadCardProps {
  onStatusChange: (status: AppStatus) => void
  onResult: (result: MeetingResult) => void
  status: AppStatus
  uploadRef: React.RefObject<HTMLDivElement | null>
}

export function UploadCard({
  onStatusChange,
  onResult,
  status,
  uploadRef,
}: UploadCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.endsWith(".txt")) {
      toast.error("Invalid file type", {
        description: "Please upload a .txt file",
      })
      return
    }

    setSelectedFile(file)
  }, [])

  const clearFile = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }
  const pollForResults = async (meetingId: string) => {
    const maxAttempts = 60

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${API_BASE}/meeting/${meetingId}`)
        const data: MeetingResult = await response.json()

        if (data.status === "COMPLETED") {
          onStatusChange("completed")
          onResult(data)
          toast.success("Analysis complete 🎉")
          return
        }

        if (data.status === "FAILED") {
          onStatusChange("failed")
          toast.error(data.errorMessage || "Processing failed")
          return
        }
        await new Promise((r) => setTimeout(r, 3000))
      } catch (err) {
        await new Promise((r) => setTimeout(r, 3000))
      }
    }

    onStatusChange("failed")
    toast.error("Processing timeout")
  }
  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      onStatusChange("uploading")
      setUploadProgress(10)

      const uploadRes = await fetch(`${API_BASE}/upload`, {
        method: "POST",
      })

      if (!uploadRes.ok) throw new Error("Failed to get upload URL")

      const { meetingId, uploadUrl }: UploadResponse =
        await uploadRes.json()

      setUploadProgress(40)

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "text/plain" },
        body: await selectedFile.text(),
      })

      if (!putRes.ok) throw new Error("Failed to upload file")

      setUploadProgress(100)

      onStatusChange("processing")
      onResult({ meetingId, status: "PROCESSING" })

      await pollForResults(meetingId)
    } catch (error: any) {
      onStatusChange("failed")
      toast.error(error.message || "Upload failed")
      setUploadProgress(0)
    }
  }

  const isDisabled =
    status === "uploading" || status === "processing"
  return (
    <motion.div
      ref={uploadRef}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto w-full max-w-2xl px-4"
    >
      <div className="rounded-2xl border bg-card/60 backdrop-blur-xl p-6">

        {/* Drop Area */}
        <div
          onClick={() => !isDisabled && fileInputRef.current?.click()}
          className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 hover:border-primary transition"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            hidden
            onChange={(e) =>
              e.target.files && handleFileSelect(e.target.files[0])
            }
          />

          {selectedFile ? (
            <>
              <FileText className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm font-medium">
                {selectedFile.name}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  clearFile()
                }}
              >
                Remove
              </Button>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
              <p className="text-sm">
                Click or drag transcript (.txt)
              </p>
            </>
          )}
        </div>

        {/* Progress */}
        {status === "uploading" && (
          <div className="mt-4">
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Status */}
        {status === "processing" && (
          <div className="mt-4 flex items-center gap-2 text-primary">
            <Loader2 className="animate-spin h-4 w-4" />
            Processing with AI...
          </div>
        )}

        {status === "completed" && (
          <div className="mt-4 flex items-center gap-2 text-green-500">
            <CheckCircle2 className="h-4 w-4" />
            Completed!
          </div>
        )}

        {status === "failed" && (
          <div className="mt-4 flex items-center gap-2 text-red-500">
            <AlertCircle className="h-4 w-4" />
            Something went wrong
          </div>
        )}

        {/* Button */}
        <div className="mt-6 text-right">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isDisabled}
          >
            {status === "processing"
              ? "Processing..."
              : "Analyze Meeting"}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}