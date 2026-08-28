export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window === 'undefined') return headers;

  try {
    // 1. Check active rockyt_session_user
    const sessionStr = localStorage.getItem('rockyt_session_user');
    if (sessionStr) {
      try {
        const parsed = JSON.parse(sessionStr);
        if (parsed.id) headers['x-user-id'] = parsed.id;
        if (parsed.email) headers['x-user-email'] = parsed.email;
        if (parsed.accessToken) headers['Authorization'] = `Bearer ${parsed.accessToken}`;
      } catch {}
    }

    // 2. Check explicit rockyt_user_id
    const legacyUid = localStorage.getItem('rockyt_user_id');
    if (legacyUid && !headers['x-user-id']) {
      headers['x-user-id'] = legacyUid;
    }

    // 3. Check Supabase auth token stored in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        try {
          const tokenData = JSON.parse(localStorage.getItem(key) || '{}');
          if (tokenData.user?.id && !headers['x-user-id']) {
            headers['x-user-id'] = tokenData.user.id;
          }
          if (tokenData.user?.email && !headers['x-user-email']) {
            headers['x-user-email'] = tokenData.user.email;
          }
          if (tokenData.access_token && !headers['Authorization']) {
            headers['Authorization'] = `Bearer ${tokenData.access_token}`;
          }
        } catch {}
      }
    }
  } catch {}

  return headers;
}
