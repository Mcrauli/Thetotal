import { Platform } from 'react-native'

let Purchases: any = null
try { Purchases = require('react-native-purchases').default } catch {}

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY

export const SUPPORTER_ENTITLEMENT = 'supporter'

let configured = false

export function purchasesAvailable(): boolean {
  return !!Purchases && !!(Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY)
}

export async function initPurchases(appUserId?: string): Promise<void> {
  if (!purchasesAvailable() || configured) return
  const apiKey = Platform.OS === 'ios' ? IOS_KEY! : ANDROID_KEY!
  try {
    await Purchases.configure({ apiKey, appUserID: appUserId })
    configured = true
  } catch {}
}

export async function getSupporterPackage(): Promise<any | null> {
  if (!purchasesAvailable()) return null
  try {
    const offerings = await Purchases.getOfferings()
    const current = offerings.current
    if (!current) return null
    return current.lifetime ?? current.availablePackages?.[0] ?? null
  } catch {
    return null
  }
}

function isActive(info: any): boolean {
  return !!info?.entitlements?.active?.[SUPPORTER_ENTITLEMENT]
}

export async function hasSupporterEntitlement(): Promise<boolean> {
  if (!purchasesAvailable()) return false
  try {
    return isActive(await Purchases.getCustomerInfo())
  } catch {
    return false
  }
}

// Heittää virheen (esim. userCancelled) jotta kutsuja voi käsitellä peruutuksen.
export async function purchaseSupporter(pkg: any): Promise<boolean> {
  if (!purchasesAvailable() || !pkg) return false
  const { customerInfo } = await Purchases.purchasePackage(pkg)
  return isActive(customerInfo)
}

export async function restoreSupporter(): Promise<boolean> {
  if (!purchasesAvailable()) return false
  return isActive(await Purchases.restorePurchases())
}
