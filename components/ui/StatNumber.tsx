import { Text, type TextProps, type TextStyle } from 'react-native'

interface StatNumberProps extends TextProps {
  value: string | number
  size?: number
  color?: string
  unit?: string
  unitColor?: string
}

export function StatNumber({ value, size = 22, color = '#fff', unit, unitColor, style, ...rest }: StatNumberProps) {
  const base: TextStyle = {
    color,
    fontSize: size,
    fontWeight: '900',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  }
  return (
    <Text style={[base, style]} {...rest}>
      {value}
      {unit ? (
        <Text style={{ fontSize: size * 0.55, fontWeight: '600', letterSpacing: 0, color: unitColor ?? color }}>{unit}</Text>
      ) : null}
    </Text>
  )
}
