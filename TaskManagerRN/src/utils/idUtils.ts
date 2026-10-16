/**
 * Generates an RFC4122 version 4 compliant UUID.
 * Works seamlessly in React Native, Node.js, and Jest environments without external native libraries.
 */
export function generateUUID(): string {
  const g: any = typeof globalThis !== 'undefined' ? globalThis : {};

  if (g.crypto && typeof g.crypto.randomUUID === 'function') {
    try {
      return g.crypto.randomUUID();
    } catch {
      // Fall through to fallback
    }
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
