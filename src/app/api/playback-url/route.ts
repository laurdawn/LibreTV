import { NextResponse } from 'next/server';
import { guardRequest, jsonError } from '@/lib/api-guard';
import { signPlayback } from '@/lib/auth';
import { isValidProxyUrl } from '@/lib/ssrf';

/**
 * 给已登录浏览器换一张可隔空播放的地址。
 * Apple TV 不会带上 httpOnly cookie，只能凭查询参数里的限时票据拉本站代理。
 */
export async function GET(req: Request) {
  const guarded = guardRequest(req);
  if (guarded) return guarded;

  const current = new URL(req.url);
  const target = current.searchParams.get('url') || '';
  if (!isValidProxyUrl(target)) return jsonError('无效的 URL', 400);

  const live = current.searchParams.get('live') === '1';
  const path = live ? '/api/live/stream' : '/api/proxy';
  // 返回站内相对地址。容器里 req.url 的 origin 是 0.0.0.0:8080，
  // 拼成绝对地址后浏览器和 Apple TV 都无法打开。
  const params = new URLSearchParams();
  params.set('url', target);
  params.set('pt', signPlayback(target));
  return NextResponse.json({ url: `${path}?${params.toString()}` });
}
