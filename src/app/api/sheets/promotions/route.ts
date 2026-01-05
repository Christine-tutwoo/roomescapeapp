import { NextResponse } from 'next/server';
import { fetchPromotionEntriesFromSheet } from '@/lib/googleSheets';

export async function GET() {
  try {
    const data = await fetchPromotionEntriesFromSheet();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('[api/sheets/promotions] failed', error);
    return NextResponse.json({ error: 'failed_to_fetch_promotions' }, { status: 500 });
  }
}

