export async function captureElementAsDataUrl(
  el: HTMLElement,
  options: { backgroundColor: string | null; scale: number }
): Promise<string> {
  const { default: html2canvas } = await import('html2canvas')
  const canvas = await html2canvas(el, options)
  return canvas.toDataURL('image/png')
}
