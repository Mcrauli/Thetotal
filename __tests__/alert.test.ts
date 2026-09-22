import { Platform, Alert } from 'react-native'
import { showAlert, useAlertStore } from '../lib/alert'

describe('showAlert on web', () => {
  beforeEach(() => {
    Platform.OS = 'web'
    useAlertStore.setState({ current: null, queue: [] })
  })

  it('pushes an alert with a default OK button', () => {
    showAlert('A')
    expect(useAlertStore.getState().current).toEqual({ title: 'A', buttons: [{ text: 'OK' }] })
  })

  it('queues a second alert while one is showing', () => {
    showAlert('A')
    showAlert('B')
    const state = useAlertStore.getState()
    expect(state.current?.title).toBe('A')
    expect(state.queue).toHaveLength(1)
    expect(state.queue[0].title).toBe('B')
  })

  it('dismiss raises the queued alert', () => {
    showAlert('A')
    showAlert('B')
    useAlertStore.getState().dismiss()
    expect(useAlertStore.getState().current?.title).toBe('B')
    expect(useAlertStore.getState().queue).toHaveLength(0)
  })

  it('press calls onPress and dismisses', () => {
    const onPress = jest.fn()
    showAlert('A', undefined, [{ text: 'Go', onPress }])
    const button = useAlertStore.getState().current!.buttons[0]
    useAlertStore.getState().press(button)
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(useAlertStore.getState().current).toBeNull()
  })
})

describe('showAlert on native', () => {
  beforeEach(() => {
    Platform.OS = 'ios'
    useAlertStore.setState({ current: null, queue: [] })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('calls Alert.alert with the same arguments and does not touch the store', () => {
    const spy = jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    const buttons = [{ text: 'OK' }]
    showAlert('Title', 'Message', buttons)
    expect(spy).toHaveBeenCalledWith('Title', 'Message', buttons)
    expect(useAlertStore.getState().current).toBeNull()
    expect(useAlertStore.getState().queue).toHaveLength(0)
  })
})
