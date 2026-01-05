import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// 強制使用環境變數，不允許預設值
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    // 檢查環境變數是否設定
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: '服務未配置' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // 生成簡單的 session token（生產環境建議使用更安全的方式）
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
      
      // 設置 cookie（httpOnly, secure, sameSite）
      const cookieStore = await cookies();
      cookieStore.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 小時
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: '帳號或密碼錯誤' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: '登入失敗' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // 檢查是否已登入
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  
  return NextResponse.json({
    authenticated: !!token,
  });
}

