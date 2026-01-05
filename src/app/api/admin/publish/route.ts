import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { cookies } from 'next/headers';

// 檢查 admin 身份驗證
async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  return !!token;
}

// 版本時間檔案路徑
const DATA_DIR = join(process.cwd(), 'data');
const VERSION_FILE = join(DATA_DIR, 'version.json');

async function getVersion(): Promise<number> {
  try {
    const data = await readFile(VERSION_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.timestamp || 0;
  } catch {
    // 檔案不存在，返回 0
    return 0;
  }
}

async function setVersion(): Promise<number> {
  const timestamp = Date.now();
  const data = {
    timestamp,
    updatedAt: new Date().toISOString(),
  };

  // 確保目錄存在
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }

  await writeFile(VERSION_FILE, JSON.stringify(data, null, 2), 'utf-8');
  return timestamp;
}

export async function POST() {
  try {
    // 檢查身份驗證
    const isAuthenticated = await checkAdminAuth();
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: '未授權' },
        { status: 401 }
      );
    }

    const timestamp = await setVersion();

    return NextResponse.json({
      success: true,
      timestamp,
      message: '發布成功',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: '發布失敗' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const timestamp = await getVersion();
    return NextResponse.json({
      timestamp,
    });
  } catch (error: any) {
    console.error('[API /api/admin/publish] Error:', error);
    return NextResponse.json(
      { error: '獲取版本失敗', details: error?.message },
      { status: 500 }
    );
  }
}

