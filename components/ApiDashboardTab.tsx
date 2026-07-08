import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const API_TAB_BG = '#0F0F11';
const API_TAB_SURF = '#17171A';
const API_TAB_BORDER = '#262629';
const API_TAB_TXT = '#EDEDED';
const API_TAB_MUTED = '#6B6B72';
const API_TAB_BLUE = '#4450F2';
const API_TAB_YELLOW = '#FFE241';

export const ApiDashboardTab: React.FC = () => {
  const { user } = useAuth();
  const [keys, setKeys] = useState<{ id: string, key_prefix: string, created_at: string }[]>([]);
  const [usage, setUsage] = useState<{ connectedAccounts: number, maxAccounts: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Authenticate with Supabase session
    const { data: { session } } = await import('../utils/supabase').then(m => m.supabase.auth.getSession());
    const headers = { 'Authorization': `Bearer ${session?.access_token}` };
    
    const [keysRes, usageRes] = await Promise.all([
      fetch('/api/v1/keys', { headers }),
      fetch('/api/v1/me/usage', { headers })
    ]);
    if (keysRes.ok) setKeys(await keysRes.json());
    if (usageRes.ok) setUsage(await usageRes.json());
    setLoading(false);
  };

  const generateKey = async () => {
    try {
      const { data: { session } } = await import('../utils/supabase').then(m => m.supabase.auth.getSession());
      if (!session) {
        alert('You must be logged in to generate an API key.');
        return;
      }
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNewKey(data.key);
        fetchData();
      } else {
        const errorData = await res.json();
        alert(`Failed to generate key: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error generating key:', error);
      alert('An error occurred while generating the key.');
    }
  };

  const revokeKey = async (id: string) => {
    try {
      const { data: { session } } = await import('../utils/supabase').then(m => m.supabase.auth.getSession());
      if (!session) {
        alert('You must be logged in to revoke an API key.');
        return;
      }
      const res = await fetch(`/api/v1/keys/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        const errorData = await res.json();
        alert(`Failed to revoke key: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error revoking key:', error);
      alert('An error occurred while revoking the key.');
    }
  };

  if (loading) return <div style={{ color: API_TAB_TXT }}>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl p-6" style={{ background: API_TAB_SURF, border: `1px solid ${API_TAB_BORDER}` }}>
        <h2 className="text-lg font-semibold mb-2" style={{ color: API_TAB_TXT }}>API Usage</h2>
        <p style={{ color: API_TAB_MUTED }}>{usage?.connectedAccounts} / {usage?.maxAccounts} accounts connected</p>
      </div>

      <div className="rounded-xl p-6" style={{ background: API_TAB_SURF, border: `1px solid ${API_TAB_BORDER}` }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: API_TAB_TXT }}>API Keys</h2>
        <button onClick={generateKey} className="px-4 py-2 rounded-lg font-semibold" style={{ background: API_TAB_BLUE, color: '#fff' }}>Generate New Key</button>
        {newKey && <div className="mt-4 p-4 rounded bg-green-900/20 text-green-400">Save this key: {newKey}</div>}
        <div className="mt-4 space-y-2">
          {keys.map(key => (
            <div key={key.id} className="flex justify-between items-center p-3 rounded" style={{ background: API_TAB_BG }}>
              <span style={{ color: API_TAB_TXT }}>{key.key_prefix}****</span>
              <button onClick={() => revokeKey(key.id)} className="text-red-400">Revoke</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
