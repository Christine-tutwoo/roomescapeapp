import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// 檢查 admin 身份驗證
async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  return !!token;
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
    
    return NextResponse.json({ 
      success: true,
      message: '快取已清除，請重新載入頁面以查看最新內容'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: '清除快取失敗' },
      { status: 500 }
    );
  }
}

