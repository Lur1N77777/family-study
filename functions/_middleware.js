// Cloudflare Pages middleware - route preview deployments to the dev Worker
const PROD_HOSTS = new Set(['family-study.pages.dev', 'familystudy.lmhzeq.fun']);
const PROD_WORKER_ORIGIN = 'https://family-study-api.linminheng2518.workers.dev';
const DEV_WORKER_ORIGIN = 'https://family-study-api-dev.linminheng2518.workers.dev';

export async function onRequest(context) {
    const url = new URL(context.request.url);

    if (!url.pathname.startsWith('/api/')) {
        return context.next();
    }

    const workerOrigin = resolveWorkerOrigin(url.hostname);
    const workerUrl = `${workerOrigin}${url.pathname}${url.search}`;
    const headers = cloneProxyHeaders(context.request.headers);

    try {
        const response = await fetch(workerUrl, {
            method: context.request.method,
            headers,
            body: context.request.body
        });

        return new Response(response.body, {
            status: response.status,
            headers: cloneResponseHeaders(response.headers)
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

function resolveWorkerOrigin(hostname) {
    if (PROD_HOSTS.has(hostname)) {
        return PROD_WORKER_ORIGIN;
    }

    if (hostname.endsWith('.family-study.pages.dev')) {
        return DEV_WORKER_ORIGIN;
    }

    return PROD_WORKER_ORIGIN;
}

function cloneProxyHeaders(sourceHeaders) {
    const headers = new Headers();

    for (const [key, value] of sourceHeaders) {
        if (key.toLowerCase() !== 'host') {
            headers.set(key, value);
        }
    }

    return headers;
}

function cloneResponseHeaders(sourceHeaders) {
    const headers = new Headers();

    for (const [key, value] of sourceHeaders) {
        if (key.toLowerCase() !== 'transfer-encoding') {
            headers.set(key, value);
        }
    }

    headers.set('Cache-Control', 'no-store');
    return headers;
}
