import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// 檢查 admin 身份驗證
async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  return !!token;
}

// 簡單的記憶體儲存版本時間（在無伺服器環境中，每個實例獨立）
let versionTimestamp = Date.now();

function getVersion(): number {
  return versionTimestamp;
}

function setVersion(): number {
  versionTimestamp = Date.now();
  return versionTimestamp;
}

export async function POST() {
  // 檢查身份驗證
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    return NextResponse.json(
      { error: '未授權' },
      { status: 401 }
    );
  }

  const timestamp = setVersion();

  return NextResponse.json({
    success: true,
    timestamp,
    message: '發布成功',
  });
}

export async function GET() {
  const timestamp = getVersion();
  return NextResponse.json({
    timestamp,
  });
}

