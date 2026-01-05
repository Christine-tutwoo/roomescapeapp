import { NextResponse } from 'next/server';
import { fetchPromotions } from '@/lib/googleSheets';

export async function GET() {
  try {
    const sheetUrl = process.env.NEXT_PUBLIC_GS_SHEET_URL;
    
    if (!sheetUrl) {
      return NextResponse.json(
        { error: '配置錯誤' },
        { status: 500 }
      );
    }

    const promotions = await fetchPromotions(sheetUrl);
    return NextResponse.json(promotions);
  } catch (error: any) {
    return NextResponse.json(
      { error: '載入失敗' },
      { status: 500 }
    );
  }
}

