"use client"

import { useCallback, useRef, useState } from "react"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { UploadCard } from "@/components/upload-card"
import { ResultsPanel } from "@/components/results-panel"
import { Footer } from "@/components/footer"
import type { AppStatus, MeetingResult } from "@/lib/types"

export default function Home() {
  const [status, setStatus] = useState<AppStatus>("idle")
  const [result, setResult] = useState<MeetingResult | null>(null)
  const uploadRef = useRef<HTMLDivElement>(null)

  const scrollToUpload = useCallback(() => {
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [])

  const handleStatusChange = useCallback((newStatus: AppStatus) => {
    setStatus(newStatus)
  }, [])

  const handleResult = useCallback((data: MeetingResult) => {
    setResult(data)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <HeroSection onUploadClick={scrollToUpload} />
        <UploadCard
          uploadRef={uploadRef}
          status={status}
          onStatusChange={handleStatusChange}
          onResult={handleResult}
        />
        <ResultsPanel status={status} result={result} />
      </main>
      <Footer />
    </div>
  )
}
