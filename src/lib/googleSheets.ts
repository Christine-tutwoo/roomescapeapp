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

async function fetchGvizTable(url: string) {
  try {
    const response = await fetch(url, {
      // 確保在 server-side 也能正確 fetch
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    
    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from Google Sheets');
    }
    
    return parseGvizResponse(text).table?.rows ?? [];
  } catch (error: any) {
    if (error.message.includes('Invalid Google Sheets gviz response')) {
      throw new Error(`Invalid Google Sheets response format. 請確認 URL 是 gviz JSON 格式: ${url}`);
    }
    throw error;
  }
}

/**
 * 從同一個 Google Sheet 讀取首頁輪播內容
 * 第一欄：圖片或 YouTube 影片 URL
 */
export async function fetchHomepageSlides(url: string): Promise<string[]> {
  const rows = await fetchGvizTable(url);
  
  return rows
    .map((row: any) => {
      const firstCell = row?.c?.[0]?.v;
      
      if (firstCell == null || typeof firstCell !== 'string') {
        return null;
      }
      
      // 如果是 base64 data URL，可能被分割到多個儲存格
      if (firstCell.startsWith('data:image/') || firstCell.startsWith('data:video/')) {
        let fullUrl = firstCell;
        
        // 如果第一個儲存格看起來不完整，嘗試合併後續儲存格
        if (firstCell.length < 100 && row?.c?.[1]?.v) {
          let cellIndex = 1;
          while (row?.c?.[cellIndex]?.v && typeof row.c[cellIndex].v === 'string') {
            const nextCell = row.c[cellIndex].v;
            if (!nextCell.startsWith('data:')) {
              fullUrl += nextCell;
              cellIndex++;
            } else {
              break;
            }
          }
        }
        
        return fullUrl;
      }
      
      return firstCell;
    })
    .filter((value: unknown): value is string => {
      if (typeof value !== 'string') return false;
      const trimmed = value.trim();
      return trimmed.length > 0 && (
        trimmed.startsWith('http://') || 
        trimmed.startsWith('https://') || 
        trimmed.startsWith('data:image/') ||
        trimmed.startsWith('data:video/')
      );
    });
}

export type PromotionEntry = {
  order: number;
  title: string;
  content: string;
  detailImageUrl?: string;
};

/**
 * 從同一個 Google Sheet 讀取優惠資訊
 * 第二欄：順序
 * 第三欄：標題
 * 第四欄：內容
 * 第五欄：圖片 URL
 */
export async function fetchPromotions(url: string): Promise<PromotionEntry[]> {
  const rows = await fetchGvizTable(url);
  return rows
    .map((row: any, index: number) => {
      const cells = row?.c ?? [];
      // 第二欄：順序（索引 1）
      const order = Number(cells?.[1]?.v) || index + 1;
      // 第三欄：標題（索引 2）
      const title = cells?.[2]?.v || '';
      // 第四欄：內容（索引 3）
      const content = cells?.[3]?.v || '';
      // 第五欄：圖片 URL（索引 4）
      const detailImageUrl = cells?.[4]?.v || undefined;
      
      return {
        order,
        title: title || '未命名優惠',
        content,
        detailImageUrl: detailImageUrl || undefined,
      };
    })
    .filter((promo) => {
      // 過濾空行：必須有標題或內容
      return promo.title.trim().length > 0 && promo.title !== '未命名優惠' || promo.content.trim().length > 0;
    })
    .sort((a, b) => a.order - b.order);
}

