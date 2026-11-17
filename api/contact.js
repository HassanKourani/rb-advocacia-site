// Contact form endpoint: validates the form and sends it by email through Resend.
// Env vars: RESEND_API_KEY, CONTACT_TO_EMAIL, optional CONTACT_FROM_EMAIL.

const SUBJECTS = [
  'Aposentadorias',
  'Benefícios por incapacidade e acidente',
  'Planejamento previdenciário',
  'BPC/LOAS e pensões',
  'Isenção de Imposto de Renda por doença grave',
  'Recursos e ações contra o INSS',
  'Outro assunto'
];
const LIMITS = { nome: 120, tel: 40, email: 200, msg: 5000 };
const MAX_BODY = 16 * 1024;
const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

// Best-effort rate limit: 5 messages per IP per 10 minutes, per warm instance.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (list.length >= MAX_PER_WINDOW) { hits.set(ip, list); return true; }
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return false;
}

function clean(v, max) {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
}

function oneLine(v) { return v.replace(/[\r\n]+/g, ' '); }

function esc(v) {
  return v.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function send(res, status, body, why) {
  // One log line per request: status and outcome only, no visitor data.
  console.log('contact: ' + status + ' ' + (why || (body && (body.error || (body.ok ? 'sent' : 'fail')))));
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { ok: false, error: 'method' });
  }

  const len = Number(req.headers['content-length'] || 0);
  if (len > MAX_BODY) return send(res, 413, { ok: false, error: 'too_large' });

  let data = req.body;
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { data = null; } }
  if (!data || typeof data !== 'object') return send(res, 400, { ok: false, error: 'invalid' });

  // Honeypot: real visitors never fill this hidden field. Answer with an error (not a fake
  // success), so a person whose browser autofilled it still sees that nothing was sent.
  const hp = data.rb_hp != null ? data.rb_hp : data.website;
  if (typeof hp === 'string' && hp.trim() !== '') return send(res, 400, { ok: false, error: 'spam' }, 'honeypot');

  const nome = oneLine(clean(data.nome, LIMITS.nome));
  const tel = oneLine(clean(data.tel, LIMITS.tel));
  const email = oneLine(clean(data.email, LIMITS.email));
  const msg = clean(data.msg, LIMITS.msg);
  const assunto = SUBJECTS.includes(data.assunto) ? data.assunto : 'Outro assunto';

  if (!nome || !email || data.consent !== true) return send(res, 400, { ok: false, error: 'missing' });
  if (!EMAIL_RE.test(email)) return send(res, 400, { ok: false, error: 'email' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return send(res, 429, { ok: false, error: 'rate' });

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || 'RB Advocacia <onboarding@resend.dev>';
  if (!key || !to) {
    console.error('contact: RESEND_API_KEY or CONTACT_TO_EMAIL is not set');
    return send(res, 503, { ok: false, error: 'not_configured' });
  }

  const rows = [['Nome', nome], ['E-mail', email], ['Telefone', tel || '(não informado)'], ['Assunto', assunto]];
  const text = rows.map(r => r[0] + ': ' + r[1]).join('\n') + '\n\nMensagem:\n' + (msg || '(sem mensagem)') +
    '\n\nEnviado pelo formulário de contato do site. Responda a este e-mail para falar com ' + nome + '.';
  const html = '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222">' +
    '<h2 style="font-size:18px;margin:0 0 16px">Nova mensagem pelo site</h2>' +
    '<table style="border-collapse:collapse;margin-bottom:16px">' +
    rows.map(r => '<tr><td style="padding:4px 16px 4px 0;color:#666">' + r[0] + '</td><td style="padding:4px 0">' + esc(r[1]) + '</td></tr>').join('') +
    '</table><p style="margin:0 0 4px;color:#666">Mensagem</p>' +
    '<p style="margin:0 0 24px;white-space:pre-wrap">' + esc(msg || '(sem mensagem)') + '</p>' +
    '<p style="margin:0;color:#888;font-size:13px">Enviado pelo formulário de contato do site. Responda a este e-mail para falar com ' + esc(nome) + '.</p></div>';

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: to.split(',').map(s => s.trim()).filter(Boolean),
        reply_to: email,
        subject: 'Contato pelo site: ' + assunto + ' (' + nome + ')',
        text,
        html
      })
    });
    if (!r.ok) {
      console.error('contact: Resend error', r.status, (await r.text()).slice(0, 500));
      return send(res, 502, { ok: false, error: 'send_failed' });
    }
    return send(res, 200, { ok: true });
  } catch (err) {
    console.error('contact: request to Resend failed', err && err.message);
    return send(res, 502, { ok: false, error: 'send_failed' });
  }
};
