import { NextResponse } from 'next/server';
import { fetchHomepageEntriesFromSheet } from '@/lib/googleSheets';

export async function GET() {
  try {
    const data = await fetchHomepageEntriesFromSheet();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('[api/sheets/home] failed', error);
    return NextResponse.json({ error: 'failed_to_fetch_homepage' }, { status: 500 });
  }
}

