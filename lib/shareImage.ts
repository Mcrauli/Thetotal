import type { RefObject } from 'react'
import { Platform } from 'react-native'
import { captureRef } from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'
import { downloadDataUrl } from './download'

export async function shareCapturedView(ref: RefObject<any>, fileName: string, dialogTitle?: string): Promise<void> {
  if (Platform.OS === 'web') {
    const dataUrl = await captureRef(ref, { format: 'png', quality: 1, result: 'data-uri' })
    const file = await dataUrlToFile(dataUrl, fileName)
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] })
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        throw e
      }
      return
    }
    downloadDataUrl(fileName, dataUrl)
    return
  }

  const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' })
  const available = await Sharing.isAvailableAsync()
  if (!available) throw new Error()
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle })
}

async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  return new File([blob], fileName, { type: 'image/png' })
}
