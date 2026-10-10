export function createApi(url, anonKey, key, tabId) {
  if (!/^https?:\/\//.test(url) || url.includes('YOUR_PROJECT') || !anonKey || anonKey.includes('YOUR_ANON')) throw new Error('Copy config.example.js to config.js and set the project URL and public anon key.');
  let role;
  try { role = JSON.parse(atob(anonKey.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role; } catch { /* Publishable keys are opaque. */ }
  if (role === 'service_role' || anonKey.startsWith('sb_secret_')) throw new Error('Use a public anon/publishable key. Service keys cannot be used in this page.');
  return {
    async call(name, params = {}) {
      const response = await fetch(`${url.replace(/\/$/,'')}/rest/v1/rpc/sim_${name}`, {
        method: 'POST', headers: { apikey: anonKey, ...(anonKey.startsWith('sb_publishable_') ? {} : { Authorization: `Bearer ${anonKey}` }), 'Content-Type':'application/json' },
        body: JSON.stringify({ p_key:key, ...(name==='snapshot' ? {} : {p_tab_id:tabId}), ...params }),
        signal: AbortSignal.timeout(10000), referrerPolicy: 'no-referrer',
      });
      const data = await response.json().catch(()=>null);
      if (!response.ok) throw new Error(data?.message || `Database request failed (${response.status})`);
      return data;
    },
  };
}
