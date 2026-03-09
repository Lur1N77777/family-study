// Cloudflare Pages Middleware - proxy API requests to Worker
export async function onRequest(context) {
    const url = new URL(context.request.url);
    const workerOrigin = 'https://family-study-api.linminheng2518.workers.dev';

    if (url.pathname.startsWith('/api/')) {
        const workerUrl = `${workerOrigin}${url.pathname}${url.search}`;
        const headers = new Headers();

        for (const [key, value] of context.request.headers) {
            if (key.toLowerCase() !== 'host') {
                headers.set(key, value);
            }
        }

        try {
            const response = await fetch(workerUrl, {
                method: context.request.method,
                headers,
                body: context.request.body
            });

            const responseHeaders = new Headers();
            for (const [key, value] of response.headers) {
                if (key.toLowerCase() !== 'transfer-encoding') {
                    responseHeaders.set(key, value);
                }
            }
            responseHeaders.set('Cache-Control', 'no-store');

            return new Response(response.body, {
                status: response.status,
                headers: responseHeaders
            });
        } catch {
            return new Response(JSON.stringify({ error: '服务暂时不可用，请稍后重试' }), {
                status: 502,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-store'
                }
            });
        }
    }

    return context.next();
}
