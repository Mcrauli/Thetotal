import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useUserStore } from '../../store/userStore'
import { supabase } from '../../lib/supabase'
import { useT } from '../../lib/i18n'
import { COLORS } from '../../lib/constants'
import { initPurchases, getSupporterPackage, purchaseSupporter, restoreSupporter, purchasesAvailable } from '../../lib/purchases'

export function SupporterCard() {
  const t = useT()
  const { profile, fetchProfile } = useUserStore()
  const [pkg, setPkg] = useState<any>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!profile) return
    let active = true
    ;(async () => {
      await initPurchases(profile.id)
      const p = await getSupporterPackage()
      if (active) setPkg(p)
    })()
    return () => { active = false }
  }, [profile?.id])

  async function markSupporter() {
    if (!profile) return
    await supabase.from('users').update({ is_supporter: true }).eq('id', profile.id)
    await fetchProfile()
  }

  async function buy() {
    if (busy) return
    if (!purchasesAvailable() || !pkg) { Alert.alert(t('supporter.unavailable')); return }
    setBusy(true)
    try {
      if (await purchaseSupporter(pkg)) { await markSupporter(); Alert.alert(t('supporter.thanks')) }
    } catch (e: any) {
      if (!e?.userCancelled) Alert.alert(t('common.error'), e?.message ?? '')
    } finally {
      setBusy(false)
    }
  }

  async function restore() {
    if (busy) return
    setBusy(true)
    try {
      if (await restoreSupporter()) { await markSupporter(); Alert.alert(t('supporter.restored')) }
      else Alert.alert(t('supporter.nothingToRestore'))
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? '')
    } finally {
      setBusy(false)
    }
  }

  if (profile?.is_supporter) {
    return (
      <View style={{ marginTop: 24, backgroundColor: COLORS.card, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 24, marginBottom: 6 }}>⭐</Text>
        <Text style={{ color: COLORS.gold, fontWeight: '900', fontSize: 16 }}>{t('supporter.activeTitle')}</Text>
        <Text style={{ color: COLORS.muted, fontSize: 13, textAlign: 'center', marginTop: 4 }}>{t('supporter.activeBody')}</Text>
      </View>
    )
  }

  const priceLabel = pkg?.product?.priceString

  return (
    <View style={{ marginTop: 24, backgroundColor: COLORS.card, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12 }}>
      <Text style={{ fontSize: 24, marginBottom: 6 }}>⭐</Text>
      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, marginBottom: 4 }}>{t('supporter.title')}</Text>
      <Text style={{ color: COLORS.muted, fontSize: 13, textAlign: 'center', marginBottom: 14 }}>{t('supporter.body')}</Text>
      <TouchableOpacity
        onPress={buy}
        disabled={busy}
        style={{ backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28, opacity: busy ? 0.6 : 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}
      >
        {busy && <ActivityIndicator color="#fff" size="small" />}
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>
          {priceLabel ? t('supporter.buyWithPrice', { price: priceLabel }) : t('supporter.buy')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={restore} disabled={busy} style={{ marginTop: 10 }}>
        <Text style={{ color: COLORS.muted, fontSize: 12 }}>{t('supporter.restore')}</Text>
      </TouchableOpacity>
    </View>
  )
}
