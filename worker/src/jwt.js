// JWT utility using native Web Crypto API for Cloudflare Workers compatibility

export async function signJWT(payload, secretStr) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretStr),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const header = { alg: 'HS256', typ: 'JWT' };
  const b64Header = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const b64Payload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const dataToSign = `${b64Header}.${b64Payload}`;
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(dataToSign));
  const b64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${dataToSign}.${b64Signature}`;
}

export async function verifyJWT(token, secretStr) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [b64Header, b64Payload, b64Signature] = parts;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretStr),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const dataToVerify = `${b64Header}.${b64Payload}`;
    const sigStr = atob(b64Signature.replace(/-/g, '+').replace(/_/g, '/'));
    const sigBuf = new Uint8Array([...sigStr].map(c => c.charCodeAt(0)));

    const isValid = await crypto.subtle.verify('HMAC', key, sigBuf, encoder.encode(dataToVerify));
    if (!isValid) return null;

    const payloadStr = atob(b64Payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payloadStr);
  } catch (e) {
    return null;
  }
}

export async function hashPassword(password) {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
