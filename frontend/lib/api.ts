const API_BASE = process.env.NEXT_PUBLIC_API_URL

export async function createMeeting(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  })

  if (!res.ok) throw new Error("Upload failed")

  return res.json()
}

export async function uploadToS3(uploadUrl: string, file: File) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
  })

  if (!res.ok) throw new Error("S3 upload failed")
}

export async function getMeeting(meetingId: string) {
  const res = await fetch(`${API_BASE}/meeting/${meetingId}`)
  if (!res.ok) throw new Error("Fetch failed")
  return res.json()
}