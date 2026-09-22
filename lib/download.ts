export function downloadText(fileName: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  downloadUrl(fileName, url)
  URL.revokeObjectURL(url)
}

export function downloadDataUrl(fileName: string, dataUrl: string): void {
  downloadUrl(fileName, dataUrl)
}

function downloadUrl(fileName: string, url: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
