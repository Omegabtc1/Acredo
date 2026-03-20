export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function formatTxHash(txid: string) {
  if (!txid) return "0x000000…0000";
  const clean = txid.replace(/^0x/i, "");
  const head = clean.slice(0, 6);
  const tail = clean.slice(-4);
  return `0x${head}…${tail}`;
}

export function fakeTxid() {
  const bytes = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, "0")
  ).join("");
  return `0x${bytes}`;
}

