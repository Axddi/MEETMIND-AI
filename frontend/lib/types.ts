export type AppStatus = "idle" | "uploading" | "processing" | "completed" | "failed"

export interface UploadResponse {
  meetingId: string
  uploadUrl: string
}

export interface MeetingResult {
  meetingId: string
  status: "PROCESSING" | "COMPLETED" | "FAILED"
  summary?: string
  actionItems?: string[]
  sentiment?: "Positive" | "Neutral" | "Negative"
}
