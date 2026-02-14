import { getSupabase } from "@/lib/supabase"

export type FacebookAuthResult =
  | { success: true; isNewUser: boolean }
  | { success: false; error: string }

/**
 * Waits for the Facebook SDK to be loaded AND initialized (FB.init() called).
 * Checks window.__fbInitialized which is set by FacebookSDKProvider after init().
 */
function waitForFB(timeout = 10000): Promise<FacebookSDK> {
  return new Promise((resolve, reject) => {
    if (window.__fbInitialized && window.FB) {
      console.log("[FB Auth] SDK already initialized")
      resolve(window.FB)
      return
    }

    console.log("[FB Auth] Waiting for SDK to initialize...")
    const start = Date.now()
    const interval = setInterval(() => {
      if (window.__fbInitialized && window.FB) {
        clearInterval(interval)
        console.log("[FB Auth] SDK ready")
        resolve(window.FB)
      } else if (Date.now() - start > timeout) {
        clearInterval(interval)
        reject(new Error("Facebook SDK failed to load. Please check your connection and try again."))
      }
    }, 100)
  })
}

/**
 * Triggers the Facebook Login popup.
 * No scope option is passed — the SDK defaults to public_profile automatically.
 * Passing { scope: "" } or { scope: "public_profile" } both cause issues in v22.0,
 * so we omit it entirely.
 */
function facebookLogin(fb: FacebookSDK): Promise<FacebookLoginStatusResponse> {
  return new Promise((resolve) => {
    fb.login(
      (response) => {
        console.log("[FB Login] Raw response:", JSON.stringify(response, null, 2))
        console.log("[FB Login] Status:", response.status)
        if (response.authResponse) {
          console.log("[FB Login] UserID:", response.authResponse.userID)
          console.log("[FB Login] Access token (first 20 chars):", response.authResponse.accessToken?.slice(0, 20) + "...")
        } else {
          console.log("[FB Login] No authResponse — user may have cancelled or popup was blocked")
        }
        resolve(response)
      }
    )
  })
}

/**
 * Fetches user profile data from the Facebook Graph API.
 * Only requests name and picture — no email.
 */
function fetchFacebookProfile(fb: FacebookSDK): Promise<FacebookMeResponse> {
  return new Promise((resolve, reject) => {
    fb.api(
      "/me",
      { fields: "id,name,picture.type(large)" },
      (response) => {
        console.log("[FB Profile] Raw response:", JSON.stringify(response, null, 2))
        if (!response || !response.id) {
          reject(new Error("Failed to retrieve Facebook profile"))
          return
        }
        console.log("[FB Profile] Name:", response.name)
        console.log("[FB Profile] Picture URL:", response.picture?.data?.url?.slice(0, 60) + "...")
        resolve(response)
      }
    )
  })
}

/**
 * Full Facebook login flow (no email required):
 * 1. Open FB login popup (public_profile only)
 * 2. Fetch name + picture from Graph API
 * 3. Use Facebook userID as the unique Supabase identifier
 * 4. Sign in or create account using a synthetic email derived from the userID
 * 5. Upsert customer record with facebook_id, name, avatar
 */
export async function handleFacebookLogin(): Promise<FacebookAuthResult> {
  const fb = await waitForFB()
  const loginResponse = await facebookLogin(fb)

  if (loginResponse.status !== "connected" || !loginResponse.authResponse) {
    console.log("[FB Auth] Login not connected. Status:", loginResponse.status)
    return { success: false, error: "Facebook login was cancelled." }
  }

  const { accessToken, userID } = loginResponse.authResponse
  console.log("[FB Auth] Connected. UserID:", userID)

  // Fetch profile from Facebook (name + picture only)
  let profile: FacebookMeResponse
  try {
    profile = await fetchFacebookProfile(fb)
  } catch (err) {
    console.error("[FB Auth] Profile fetch failed:", err)
    return { success: false, error: "Could not retrieve your Facebook profile." }
  }

  const name = profile.name || "Facebook User"
  const avatarUrl = profile.picture?.data?.url || null

  const client = getSupabase()

  // Use a synthetic email based on the Facebook userID.
  // Supabase auth requires an email — this is never shown to the user
  // and serves only as a unique identifier tied to their FB account.
  const syntheticEmail = `fb_${userID}@tropichat.facebook.local`
  console.log("[FB Auth] Synthetic email:", syntheticEmail)

  // Deterministic password derived from the Facebook userID.
  // Never shown to or used by the user directly.
  const fbPassword = `fb_${userID}_${accessToken.slice(-16)}`

  // Try to sign in first (returning user)
  console.log("[FB Auth] Attempting Supabase sign-in for existing user...")
  const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
    email: syntheticEmail,
    password: fbPassword,
  })
  console.log("[FB Auth] Sign-in result — session:", !!signInData?.session, "error:", signInError?.message || "none")

  if (signInData?.session) {
    // Existing Facebook user — update name + avatar in case they changed
    await client
      .from("customers")
      .update({
        business_name: name,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", signInData.user.id)

    console.log("[FB Auth] Existing user signed in:", signInData.user.id)
    return { success: true, isNewUser: false }
  }

  // New user — create Supabase account
  console.log("[FB Auth] No existing user. Creating new Supabase account...")
  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email: syntheticEmail,
    password: fbPassword,
    options: {
      data: {
        business_name: name,
        facebook_id: userID,
        avatar_url: avatarUrl,
        full_name: name,
      },
    },
  })
  console.log("[FB Auth] Sign-up result — user:", signUpData?.user?.id || "none", "session:", !!signUpData?.session, "error:", signUpError?.message || "none")

  if (signUpError) {
    return { success: false, error: signUpError.message }
  }

  if (!signUpData.user) {
    return { success: false, error: "Failed to create account. Please try again." }
  }

  // Create the customer record
  console.log("[FB Auth] Creating customer record...")
  const { error: customerError } = await client.from("customers").insert({
    id: signUpData.user.id,
    business_name: name,
    contact_email: syntheticEmail,
    status: "trial",
    plan: "free",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    facebook_id: userID,
    avatar_url: avatarUrl,
  })

  if (customerError) {
    console.error("[FB Auth] Customer insert error:", customerError)
  } else {
    console.log("[FB Auth] Customer record created successfully")
  }

  // If Supabase requires email confirmation, the session won't be set.
  // Try signing in immediately since this is a verified Facebook account.
  if (!signUpData.session) {
    console.log("[FB Auth] No session after sign-up (email confirmation likely required). Attempting sign-in...")
    const { error: postSignInError } = await client.auth.signInWithPassword({
      email: syntheticEmail,
      password: fbPassword,
    })
    if (postSignInError) {
      console.error("[FB Auth] Post-signup sign-in failed:", postSignInError.message)
      return {
        success: false,
        error: "Account created but could not sign in automatically. Please try again.",
      }
    }
    console.log("[FB Auth] Post-signup sign-in successful")
  }

  console.log("[FB Auth] New user flow complete")
  return { success: true, isNewUser: true }
}
