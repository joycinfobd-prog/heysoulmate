// shared helpers for hub / box / letter pages
window.L = {
  $: s => document.querySelector(s),
  api: (u, o) => fetch(u, o).then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw Object.assign(new Error(d.error || 'Error'), { status: r.status, data: d }); return d; }),
  // real "back": go to the previous page if it was ours, otherwise to a safe fallback
  back(fallback) { let ok = false; try { ok = new URL(document.referrer).origin === location.origin; } catch {} if (ok && history.length > 1) history.back(); else location.href = fallback || '/'; },
  burst(el, n = 8) { const r = el.getBoundingClientRect(); for (let i = 0; i < n; i++) { const e = document.createElement('span'); e.className = 'pop'; e.textContent = ['❤️', '💖', '✨', '💕'][i % 4]; e.style.left = r.left + r.width / 2 + 'px'; e.style.top = r.top + 'px'; e.style.setProperty('--dx', (Math.random() - .5) * 160 + 'px'); e.style.setProperty('--dy', -40 - Math.random() * 90 + 'px'); document.body.appendChild(e); setTimeout(() => e.remove(), 1100); } }
};
setInterval(() => { const e = document.createElement('span'); e.className = 'fl'; e.textContent = ['✦', '♥', '♡'][Math.random() * 3 | 0]; e.style.left = Math.random() * 100 + 'vw'; e.style.fontSize = 8 + Math.random() * 10 + 'px'; e.style.color = ['#ffb84d', '#ff5d8f', '#fff'][Math.random() * 3 | 0]; document.body.appendChild(e); setTimeout(() => e.remove(), 5000); }, 900);
