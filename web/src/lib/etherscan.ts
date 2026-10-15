const ETHERSCAN_KEY = import.meta.env.VITE_ETHERSCAN_KEY ?? "";

/**
 * Etherscan v2 getLogs with a retry: the free key allows 3 calls a second, and the page makes
 * several at once. A rate-limited reply is a 200 whose `result` is a string, not an array.
 */
export async function etherscanLogs<T = unknown>(params: string, attempts = 4): Promise<T[]> {
  const url = `https://api.etherscan.io/v2/api?chainid=1&module=logs&action=getLogs&${params}&apikey=${ETHERSCAN_KEY}`;
  let last = "";
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 600 * i + Math.random() * 400));
    try {
      const data = (await (await fetch(url)).json()) as { result: unknown };
      if (Array.isArray(data.result)) return data.result as T[];
      last = String(data.result);
    } catch (e) {
      last = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(`Etherscan logs failed: ${last}`);
}
