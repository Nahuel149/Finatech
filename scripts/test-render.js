const base = 'https://finatech-qp5l.onrender.com';

async function post(path, body) {
  const r = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  console.log(`${path} status:`, r.status);
  console.log(`${path} body:`, data);
  return { status: r.status, body: data };
}

(async () => {
  const email = `renderfinatech+render_${Date.now()}@gmail.com`;

  await post('/api/auth/register', {
    fullName: 'Render Test',
    email,
    password: 'Password1!',
    confirmPassword: 'Password1!',
    acceptTerms: true,
  });

  await post('/api/auth/resend-verification', { email });
})().catch((e) => {
  console.error('Error', e);
  process.exitCode = 1;
});