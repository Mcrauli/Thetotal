import { Platform } from 'react-native'
import { captureRef } from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'
import { shareCapturedView } from '../lib/shareImage'
import { downloadDataUrl } from '../lib/download'
import { captureElementAsDataUrl } from '../lib/html2canvasCapture'

jest.mock('react-native-view-shot', () => ({ captureRef: jest.fn() }))
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }))
jest.mock('../lib/download', () => ({ downloadDataUrl: jest.fn() }))
jest.mock('../lib/html2canvasCapture', () => ({ captureElementAsDataUrl: jest.fn() }))

const mockCaptureRef = captureRef as jest.Mock
const mockDownloadDataUrl = downloadDataUrl as jest.Mock
const mockCaptureElementAsDataUrl = captureElementAsDataUrl as jest.Mock
const fakeRef = { current: {} } as any
const dataUrl = 'data:image/png;base64,AAAA'

describe('shareCapturedView on web', () => {
  beforeEach(() => {
    Platform.OS = 'web'
    jest.clearAllMocks()
    mockCaptureElementAsDataUrl.mockResolvedValue(dataUrl)
    ;(global as any).window = { devicePixelRatio: 2 }
    ;(global as any).fetch = jest.fn().mockResolvedValue({ blob: jest.fn().mockResolvedValue({ type: 'image/png' }) })
    ;(global as any).File = jest.fn().mockImplementation((parts: any, name: any, opts: any) => ({ parts, name, opts }))
  })

  it('captures the ref via html2canvas and shares it as a file when file sharing is supported', async () => {
    const share = jest.fn().mockResolvedValue(undefined)
    const canShare = jest.fn().mockReturnValue(true)
    ;(global as any).navigator = { share, canShare }

    await shareCapturedView(fakeRef, 'thetotal-rank.png')

    expect(mockCaptureElementAsDataUrl).toHaveBeenCalledWith(fakeRef.current, { backgroundColor: null, scale: 2 })
    expect(mockCaptureRef).not.toHaveBeenCalled()
    expect(canShare).toHaveBeenCalledWith({ files: [expect.objectContaining({ name: 'thetotal-rank.png' })] })
    expect(share).toHaveBeenCalledWith({ files: [expect.objectContaining({ name: 'thetotal-rank.png' })] })
    expect(mockDownloadDataUrl).not.toHaveBeenCalled()
  })

  it('treats a cancelled share sheet (AbortError) as success, not an error', async () => {
    const abortError = Object.assign(new Error('cancelled'), { name: 'AbortError' })
    const share = jest.fn().mockRejectedValue(abortError)
    const canShare = jest.fn().mockReturnValue(true)
    ;(global as any).navigator = { share, canShare }

    await expect(shareCapturedView(fakeRef, 'thetotal-rank.png')).resolves.toBeUndefined()
    expect(mockDownloadDataUrl).not.toHaveBeenCalled()
  })

  it('falls back to downloadDataUrl on NotAllowedError from navigator.share', async () => {
    const notAllowed = Object.assign(new Error('gesture expired'), { name: 'NotAllowedError' })
    const share = jest.fn().mockRejectedValue(notAllowed)
    const canShare = jest.fn().mockReturnValue(true)
    ;(global as any).navigator = { share, canShare }

    await expect(shareCapturedView(fakeRef, 'thetotal-rank.png')).resolves.toBeUndefined()
    expect(mockDownloadDataUrl).toHaveBeenCalledWith('thetotal-rank.png', dataUrl)
  })

  it('falls back to downloadDataUrl on a TypeError from navigator.share', async () => {
    const share = jest.fn().mockRejectedValue(new TypeError('bad data'))
    const canShare = jest.fn().mockReturnValue(true)
    ;(global as any).navigator = { share, canShare }

    await expect(shareCapturedView(fakeRef, 'thetotal-rank.png')).resolves.toBeUndefined()
    expect(mockDownloadDataUrl).toHaveBeenCalledWith('thetotal-rank.png', dataUrl)
  })

  it('rethrows other errors from navigator.share', async () => {
    const share = jest.fn().mockRejectedValue(new Error('boom'))
    const canShare = jest.fn().mockReturnValue(true)
    ;(global as any).navigator = { share, canShare }

    await expect(shareCapturedView(fakeRef, 'thetotal-rank.png')).rejects.toThrow('boom')
  })

  it('falls back to downloadDataUrl when navigator.canShare is unavailable', async () => {
    ;(global as any).navigator = {}

    await shareCapturedView(fakeRef, 'thetotal-rank.png')

    expect(mockDownloadDataUrl).toHaveBeenCalledWith('thetotal-rank.png', dataUrl)
  })
})

describe('shareCapturedView on native', () => {
  const mockIsAvailable = Sharing.isAvailableAsync as jest.Mock
  const mockShareAsync = Sharing.shareAsync as jest.Mock

  beforeEach(() => {
    Platform.OS = 'ios'
    jest.clearAllMocks()
    mockCaptureRef.mockResolvedValue('file:///tmp/thetotal-rank.png')
  })

  it('captures a tmpfile and shares it via expo-sharing', async () => {
    mockIsAvailable.mockResolvedValue(true)

    await shareCapturedView(fakeRef, 'thetotal-rank.png', 'Jaa rankisi')

    expect(mockCaptureRef).toHaveBeenCalledWith(fakeRef, { format: 'png', quality: 1, result: 'tmpfile' })
    expect(mockShareAsync).toHaveBeenCalledWith('file:///tmp/thetotal-rank.png', {
      mimeType: 'image/png',
      dialogTitle: 'Jaa rankisi',
    })
  })

  it('throws with no message when sharing is unavailable, without calling shareAsync', async () => {
    mockIsAvailable.mockResolvedValue(false)

    await expect(shareCapturedView(fakeRef, 'thetotal-rank.png')).rejects.toThrow()
    let caught: any
    try {
      await shareCapturedView(fakeRef, 'thetotal-rank.png')
    } catch (e) {
      caught = e
    }
    expect(caught.message).toBe('')
    expect(mockShareAsync).not.toHaveBeenCalled()
  })
})
