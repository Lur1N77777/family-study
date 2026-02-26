// ========================================
// 响应工具
// ========================================

export function corsHeaders(env) {
    return {
        'Access-Control-Allow-Origin': env?.CORS_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
}

export function jsonResponse(data, env, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(env),
        },
    });
}

export function errorResponse(message, status = 400, env) {
    return jsonResponse({ error: message }, env, status);
}
