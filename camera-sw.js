/**
 * camera-sw.js
 * Service Worker：为所有响应注入 COOP/COEP 响应头，
 * 使页面进入 crossOriginIsolated 模式，解决 GitHub Pages
 * 等不支持自定义响应头的静态托管平台无法调用摄像头的问题。
 *
 * 原理：SharedArrayBuffer 和部分 Web API（包括某些摄像头场景）
 * 需要页面处于跨域隔离状态，必须同时满足：
 *   Cross-Origin-Opener-Policy: same-origin
 *   Cross-Origin-Embedder-Policy: require-corp
 * GitHub Pages 无法自定义响应头，通过 SW 拦截 fetch 来注入。
 */

const CACHE_NAME = 'camera-sw-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 只处理成功的同源响应，跨域资源不注入（避免 CORS 问题）
        if (!response || response.status === 0) {
          return response;
        }

        const newHeaders = new Headers(response.headers);

        // 注入跨域隔离必需的响应头
        newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
        newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
        newHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      })
      .catch(() => fetch(event.request))
  );
});
