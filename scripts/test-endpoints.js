require('dotenv').config();

const BASE = process.env.APP_URL || 'http://localhost:' + (process.env.PORT || 4100);

async function postJson(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let text;
  try { text = await res.text(); } catch (_) { text = ''; }
  let json;
  try { json = JSON.parse(text); } catch (_) { json = text; }
  return { status: res.status, body: json };
}

(async () => {
  const email = `renderfinatech+local_${Date.now()}@gmail.com`;
  console.log('Testing with email:', email);

  const registerBody = {
    fullName: 'Local Test',
    email,
    password: 'Password1!',
    confirmPassword: 'Password1!',
    acceptTerms: true,
  };

  const reg = await postJson('/api/auth/register', registerBody);
  console.log('Register status:', reg.status);
  console.log('Register body:', reg.body);

  const resend = await postJson('/api/auth/resend-verification', { email });
  console.log('Resend status:', resend.status);
  console.log('Resend body:', resend.body);
})();