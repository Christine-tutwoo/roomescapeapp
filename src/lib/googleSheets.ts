import { google } from 'googleapis';

type SheetsClient = {
  sheets: ReturnType<typeof google.sheets>;
};

const DEFAULT_HOME_RANGE = process.env.GS_HOME_RANGE || 'Homepage!A2:A';
const DEFAULT_PROMO_RANGE = process.env.GS_PROMO_RANGE || 'Promotions!A2:D';

function assertEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

let cachedClient: SheetsClient | null = null;

async function getSheetsClient(scopes: string[] = ['https://www.googleapis.com/auth/spreadsheets.readonly']) {
  if (cachedClient) return cachedClient;

  const clientEmail = assertEnv(process.env.GS_CLIENT_EMAIL, 'GS_CLIENT_EMAIL');
  const privateKey = assertEnv(process.env.GS_PRIVATE_KEY, 'GS_PRIVATE_KEY').replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes,
  });
  const sheets = google.sheets({ version: 'v4', auth });

  cachedClient = { sheets };
  return cachedClient;
}

export async function fetchHomepageSlides() {
  try {
    const spreadsheetId = assertEnv(process.env.GS_SHEET_ID, 'GS_SHEET_ID');
    const { sheets } = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: DEFAULT_HOME_RANGE,
    });

    const rows = res.data.values ?? [];
    return rows
      .map((row) => row[0])
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  } catch (error) {
    console.error('[googleSheets] fetchHomepageSlides failed', error);
    return [];
  }
}

export type PromotionEntry = {
  order: number;
  title: string;
  content: string;
  detailImageUrl?: string;
};

export async function fetchPromotionEntries(): Promise<PromotionEntry[]> {
  try {
    const spreadsheetId = assertEnv(process.env.GS_SHEET_ID, 'GS_SHEET_ID');
    const { sheets } = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: DEFAULT_PROMO_RANGE,
    });

    const rows = res.data.values ?? [];
    return rows
      .map((row, index) => {
        const [order, title, content, detailImageUrl] = row;
        return {
          order: Number(order) || index + 1,
          title: title || '未命名優惠',
          content: content || '',
          detailImageUrl: detailImageUrl || undefined,
        };
      })
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('[googleSheets] fetchPromotionEntries failed', error);
    return [];
  }
}

