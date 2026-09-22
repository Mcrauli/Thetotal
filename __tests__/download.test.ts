import { downloadText, downloadDataUrl } from '../lib/download'

describe('download (web only helpers)', () => {
  let clickSpy: jest.Mock
  let anchor: any
  let createObjectURL: jest.Mock
  let revokeObjectURL: jest.Mock

  beforeEach(() => {
    clickSpy = jest.fn()
    anchor = { href: '', download: '', click: clickSpy }
    ;(global as any).document = {
      createElement: jest.fn(() => anchor),
      body: { appendChild: jest.fn(), removeChild: jest.fn() },
    }
    createObjectURL = jest.fn(() => 'blob:mock-url')
    revokeObjectURL = jest.fn()
    ;(global as any).URL = { createObjectURL, revokeObjectURL }
    ;(global as any).Blob = jest.fn().mockImplementation((parts: any, opts: any) => ({ parts, opts }))
  })

  it('downloadText builds a blob URL, clicks an anchor, and revokes the URL', () => {
    downloadText('thetotal-data.json', '{"a":1}', 'application/json')

    expect(Blob).toHaveBeenCalledWith(['{"a":1}'], { type: 'application/json' })
    expect(document.createElement).toHaveBeenCalledWith('a')
    expect(anchor.download).toBe('thetotal-data.json')
    expect(anchor.href).toBe('blob:mock-url')
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('downloadDataUrl points the anchor at the data URL and clicks it', () => {
    downloadDataUrl('thetotal-rank.png', 'data:image/png;base64,AAA')

    expect(anchor.download).toBe('thetotal-rank.png')
    expect(anchor.href).toBe('data:image/png;base64,AAA')
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(createObjectURL).not.toHaveBeenCalled()
  })
})
