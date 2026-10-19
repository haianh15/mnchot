/** Only for the standalone offline browser demonstration. NEVER use this
 * authentication adapter as server-side protection for real data. */
const base64ToBytes = (value: string): Uint8Array => Uint8Array.from(atob(value), c => c.charCodeAt(0));
const bytesToBase64 = (value: Uint8Array): string => btoa(Array.from(value, v => String.fromCharCode(v)).join(''));

async function derive(password: string, salt: Uint8Array, rounds: number): Promise<Uint8Array> {
  if (!globalThis.crypto?.subtle) throw new Error('Cần HTTPS hoặc localhost để xác thực bản xem thử.');
  const input = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt as BufferSource, iterations: rounds, hash: 'SHA-256' }, input, 256);
  return new Uint8Array(bits);
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [method, roundsRaw, saltRaw, digestRaw] = stored.split(':');
  if (method !== 'pbkdf2-sha256' || !roundsRaw || !saltRaw || !digestRaw) return false;
  const digest = await derive(password, base64ToBytes(saltRaw), Number(roundsRaw));
  const reference = base64ToBytes(digestRaw);
  let diff = digest.length ^ reference.length;
  for (let i = 0; i < digest.length; i++) diff |= digest[i] ^ (reference[i] ?? 0);
  return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const rounds = 210000;
  const digest = await derive(password, salt, rounds);
  return `pbkdf2-sha256:${rounds}:${bytesToBase64(salt)}:${bytesToBase64(digest)}`;
}
