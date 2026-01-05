function parseGvizResponse(text: string) {
  const marker = 'google.visualization.Query.setResponse(';
  const start = text.indexOf(marker);
  if (start === -1) {
    throw new Error('Invalid Google Sheets gviz response');
  }
  const jsonStart = start + marker.length;
  const jsonEnd = text.lastIndexOf(');');
  const payload = jsonEnd >= 0 ? text.slice(jsonStart, jsonEnd) : text.slice(jsonStart);
  return JSON.parse(payload);
}

async function fetchGvizTable(url?: string) {
  if (!url) {
    throw new Error('Missing sheet url');
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet: ${response.status}`);
  }
  const text = await response.text();
  return parseGvizResponse(text).table?.rows ?? [];
}

export async function fetchHomepageEntriesFromSheet() {
  const url = process.env.GS_HOME_JSON_URL || process.env.NEXT_PUBLIC_GS_HOME_JSON_URL;
  if (!url) {
    throw new Error('GS_HOME_JSON_URL is not configured');
  }
  const rows = await fetchGvizTable(url);
  return rows
    .map((row: any) => row?.c?.[0]?.v)
    .filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0);
}

export type PromotionEntry = {
  order: number;
  title: string;
  content: string;
  detailImageUrl?: string;
};

export async function fetchPromotionEntriesFromSheet(): Promise<PromotionEntry[]> {
  const url = process.env.GS_PROMO_JSON_URL || process.env.NEXT_PUBLIC_GS_PROMO_JSON_URL;
  if (!url) {
    throw new Error('GS_PROMO_JSON_URL is not configured');
  }
  const rows = await fetchGvizTable(url);
  return rows
    .map((row: any, index: number) => {
      const cells = row?.c ?? [];
      const order = Number(cells?.[0]?.v) || index + 1;
      return {
        order,
        title: cells?.[1]?.v || '未命名優惠',
        content: cells?.[2]?.v || '',
        detailImageUrl: cells?.[3]?.v || undefined,
      };
    })
    .sort((a, b) => a.order - b.order);
}

