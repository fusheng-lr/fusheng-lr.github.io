'use strict';

/**
 * camera-sw.js
 * 为同源响应注入 COOP/COEP 响应头，使页面进入 crossOriginIsolated 模式。
 * 仅处理同源请求，跨域请求直接透传，避免破坏 CORS。
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 只拦截同源请求（同域名），跨域资源直接放行
  if (url.origin !== self.location.origin) {
    return;
  }

  // 非 GET 请求直接放行
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request).then((response) => {
      // 响应异常直接返回
      if (!response || !response.ok && response.status !== 0) {
        return response;
      }

      const newHeaders = new Headers(response.headers);
      newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
      newHeaders.set('Cross-Origin-Embedder-Policy', 'credentialless');
      newHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }).catch(() => fetch(event.request))
  );
});
