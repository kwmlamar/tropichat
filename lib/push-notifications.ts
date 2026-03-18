/**
 * PWA Push Notification Helpers
 * Handles permission requests, service worker registration,
 * and saving subscriptions to Supabase.
 */

import { getSupabase } from './supabase'

// Public VAPID key (should match backend)
// For local testing, we typically generate one, but for now we define the logic.
// You can generate this using: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

/** Check if push notifications are supported and permitted */
export function isPushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
}

/** Get current notification permission state */
export function getNotificationPermission(): NotificationPermission {
  return typeof window !== 'undefined' ? Notification.permission : 'default'
}

/** Base64 to Uint8Array helper for VAPID key */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/** Subscribe the user to push notifications */
export async function subscribeToPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: 'Push notifications are not supported on this browser.' }
  }

  try {
    // 1. Request permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { success: false, error: 'Permission was denied.' }
    }

    // 2. Register/Wait for service worker
    const registration = await navigator.serviceWorker.ready

    // 3. Check for existing subscription
    const existingSubscription = await registration.pushManager.getSubscription()
    if (existingSubscription) {
      await saveSubscriptionToDb(existingSubscription)
      return { success: true }
    }

    // 4. Create new subscription
    if (!VAPID_PUBLIC_KEY) {
      console.warn('VAPID public key not found. Subscribing without it (might fail).')
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY ? urlBase64ToUint8Array(VAPID_PUBLIC_KEY) : undefined,
    })

    // 5. Save to database
    await saveSubscriptionToDb(subscription)
    return { success: true }
  } catch (err: any) {
    console.error('Failed to subscribe to push notifications:', err)
    return { success: false, error: err.message || 'Subscription failed.' }
  }
}

/** Unsubscribe from push notifications */
export async function unsubscribeFromPush(): Promise<{ success: boolean; error?: string }> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      // 1. Remove from database first
      await removeSubscriptionFromDb(subscription.endpoint)
      // 2. Unsubscribe from browser
      await subscription.unsubscribe()
    }

    return { success: true }
  } catch (err: any) {
    console.error('Failed to unsubscribe from push notifications:', err)
    return { success: false, error: err.message || 'Unsubscription failed.' }
  }
}

/** Save subscription details to Supabase */
async function saveSubscriptionToDb(subscription: PushSubscription) {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  const subJson = subscription.toJSON()
  const endpoint = subJson.endpoint
  const p256dh = subJson.keys?.p256dh
  const auth = subJson.keys?.auth

  if (!endpoint || !p256dh || !auth) return

  const { error } = await supabase.from('push_subscriptions').upsert({
    customer_id: user.id,
    endpoint,
    p256dh,
    auth,
    device_info: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
    },
  }, {
    onConflict: 'customer_id,endpoint',
  })

  if (error) console.error('Error saving push subscription to DB:', error)
}

/** Remove subscription from Supabase */
async function removeSubscriptionFromDb(endpoint: string) {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)

  if (error) console.error('Error removing push subscription from DB:', error)
}
