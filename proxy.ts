// Security & Performance Proxy for Next.js 16+
// Enterprise WAF, Anti-DDoS, CSRF Shield & Admin SSO Guard

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/admin-token';
import { verifyUserSessionToken } from '@/lib/user-token';

// Blocked user agents (common scraper bots & penetration scanners)
const BLOCKED_USER_AGENTS = [
    // Common scraper & automated bots
    'httrack',
    'wget',
    'curl',
    'scrapy',
    'python-requests',
    'python-urllib',
    'go-http-client',
    'java/',
    'libwww-perl',
    'apache-httpclient',
    'http.rb',
    'okhttp',
    // AI scrapers
    'gptbot',
    'chatgpt-user',
    'ccbot',
    'anthropic-ai',
    'claude-web',
    'bytespider',
    // Penetration & Attack Scanners
    'sqlmap',
    'nikto',
    'masscan',
    'nmap',
    'zgrab',
    'censys',
    'shodan',
    'acunetix',
    'dirbuster',
    'nuclei',
    'gobuster',
    'ffuf',
    'feroxbuster',
    'wpscan',
    'hydra',
    'metasploit',
    'havij',
    'pangolin',
    'nessus',
    'openvas',
    'burpsuite',
];

// Blocked paths - prevent access to sensitive files and vulnerability scanners
const BLOCKED_PATHS = [
    '/.env',
    '/.git',
    '/.svn',
    '/.hg',
    '/.aws',
    '/.ssh',
    '/.docker',
    '/wp-admin',
    '/wp-login',
    '/wp-content',
    '/wp-includes',
    '/phpmyadmin',
    '/pma',
    '/adminer',
    '/admin.php',
    '/.htaccess',
    '/config.php',
    '/xmlrpc.php',
    '/cgi-bin',
    '/vendor/phpunit',
    '/actuator',
    '/server-status',
    '/telescope',
    '/_profiler',
];

const BLOCKED_EXTENSIONS = /\.(?:sql|bak|old|orig|save|swp|tar\.gz|tgz|env|ini|log|conf|pem|key)$/i;

// Cache-friendly paths (static fonts and assets)
const CACHE_ASSET_PATHS = [
    /\.woff2?$/,
    /\.ttf$/,
    /\.eot$/,
];

const ALLOWED_ORIGINS = [
    'hiphim.one',
    'www.hiphim.one',
    'hiphim.biz',
    'www.hiphim.biz',
    'rapphimchill.app',
    'www.rapphimchill.app',
    'localhost',
    '127.0.0.1',
];

function isGoogleOrVerificationAgent(userAgent: string | null): boolean {
    if (!userAgent) return false;
    const lowerUA = userAgent.toLowerCase();
    return (
        lowerUA.includes('google') ||
        lowerUA.includes('googlebot') ||
        lowerUA.includes('tag-assistant') ||
        lowerUA.includes('tagassistant') ||
        lowerUA.includes('inspectiontool') ||
        lowerUA.includes('analytics') ||
        lowerUA.includes('mediapartners-google') ||
        lowerUA.includes('adsbot') ||
        lowerUA.includes('feedfetcher')
    );
}

function isBlockedUserAgent(userAgent: string | null): boolean {
    if (!userAgent) return false;
    if (isGoogleOrVerificationAgent(userAgent)) {
        return false;
    }
    const lowerUA = userAgent.toLowerCase();
    return BLOCKED_USER_AGENTS.some(blocked => lowerUA.includes(blocked));
}

function isBlockedPath(pathname: string): boolean {
    const lowerPath = pathname.toLowerCase();
    if (BLOCKED_EXTENSIONS.test(lowerPath)) return true;
    return BLOCKED_PATHS.some(blocked => lowerPath.startsWith(blocked));
}

function isCacheableAsset(pathname: string): boolean {
    return CACHE_ASSET_PATHS.some(pattern => pattern.test(pathname));
}

/**
 * Validates Origin / Referer on mutating API requests to prevent Cross-Site Request Forgery (CSRF).
 */
function isValidCsrfOrigin(request: NextRequest): boolean {
    const originHeader = request.headers.get('origin');
    const refererHeader = request.headers.get('referer');
    const currentHost = request.nextUrl.hostname.toLowerCase();

    const checkUrlHost = (rawUrl: string): boolean => {
        try {
            const parsed = new URL(rawUrl);
            const h = parsed.hostname.toLowerCase();
            return (
                h === currentHost ||
                ALLOWED_ORIGINS.includes(h) ||
                h.endsWith('.workers.dev') ||
                h.endsWith('.pages.dev') ||
                h.endsWith('.vercel.app')
            );
        } catch {
            return false;
        }
    };

    if (originHeader && originHeader !== 'null') {
        return checkUrlHost(originHeader);
    }
    if (refererHeader) {
        return checkUrlHost(refererHeader);
    }
    // Same-origin fetch from modern browsers with Sec-Fetch-Site
    const secFetchSite = request.headers.get('sec-fetch-site');
    if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'same-site' && secFetchSite !== 'none') {
        return false;
    }
    return true;
}

// -------------------------------------------------------------
// MULTI-TIER ANTI-DDOS RATE LIMITER (NAT & 4G FRIENDLY, NO IP JAIL)
// -------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  auth: { windowMs: 30_000, maxRequests: 25 }, // 25 req / 30s for Auth/Admin endpoints
  api_proxy: { windowMs: 10_000, maxRequests: 600 }, // 600 req / 10s for movie API & search
  general: { windowMs: 10_000, maxRequests: 1200 }, // 1200 req / 10s for normal browsing
};

function getRateLimitCategory(pathname: string): 'auth' | 'api_proxy' | 'general' {
  if (pathname.startsWith('/api/auth/') || pathname.startsWith('/api/admin/')) {
    return 'auth';
  }
  if (pathname.startsWith('/api/phim') || pathname.startsWith('/search') || pathname.startsWith('/new-updates')) {
    return 'api_proxy';
  }
  return 'general';
}

function checkRateLimit(ip: string, category: 'auth' | 'api_proxy' | 'general'): {
  allowed: boolean;
  retryAfter: number;
  limit: number;
} {
  if (ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') {
    return { allowed: true, retryAfter: 0, limit: 999 };
  }
  const now = Date.now();
  const config = RATE_LIMITS[category];
  const key = `${category}:${ip}`;

  if (rateLimitMap.size > 8000) {
    const entriesToDelete: string[] = [];
    rateLimitMap.forEach((data, k) => {
      if (data.resetTime < now) entriesToDelete.push(k);
    });
    entriesToDelete.forEach((k) => rateLimitMap.delete(k));
    if (rateLimitMap.size > 8000) rateLimitMap.clear();
  }

  const requestData = rateLimitMap.get(key);
  if (!requestData || requestData.resetTime < now) {
    rateLimitMap.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, retryAfter: 0, limit: config.maxRequests };
  }

  if (requestData.count >= config.maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((requestData.resetTime - now) / 1000));
    return { allowed: false, retryAfter, limit: config.maxRequests };
  }

  requestData.count++;
  rateLimitMap.set(key, requestData);
  return { allowed: true, retryAfter: 0, limit: config.maxRequests };
}

// Common malicious URL patterns (Path traversal, SQLi, XSS, Remote File Inclusion, Null Byte)
const SUSPICIOUS_PATTERNS = [
  /\.\.\//, // Directory traversal ../
  /%2e%2e%2f/i, // Encoded ../
  /%00/, // Null byte injection
  /(?:union\s+all\s+select|union\s+select|select\s+.*\s+from|information_schema|benchmark\s*\(|sleep\s*\()/i, // SQL injection
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i, // Script injection
  /javascript:/i, // JavaScript URI scheme
  /\b(?:etc\/passwd|etc\/shadow|win\.ini|boot\.ini|proc\/self\/environ)\b/i, // Sensitive local files
];

function containsSuspiciousPayload(urlStr: string): boolean {
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(urlStr));
}

async function checkVerifiedAdminCookies(request: NextRequest): Promise<boolean> {
  const userSessionCookie = request.cookies.get('hiphim_user_session')?.value;
  if (userSessionCookie) {
    const userPayload = await verifyUserSessionToken(userSessionCookie);
    if (
      userPayload?.role === 'superadmin' ||
      userPayload?.role === 'admin'
    ) {
      return true;
    }
  }

  const adminSessionCookie = request.cookies.get('hiphim_admin_session')?.value;
  if (adminSessionCookie && (await verifySessionToken(adminSessionCookie))) {
    return true;
  }

  return false;
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const method = request.method.toUpperCase();
    const userAgent = request.headers.get('user-agent');
    const ip =
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown';

    // 1. Restrict HTTP Methods to standard safe methods (Block TRACE, TRACK, CONNECT)
    const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    if (!ALLOWED_METHODS.includes(method)) {
        return new NextResponse('Method Not Allowed', { 
            status: 405,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    // Require User-Agent on mutating requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && (!userAgent || userAgent.trim() === '')) {
        return new NextResponse('Forbidden - User Agent Required', { 
            status: 403,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    // CSRF Protection on mutating API calls
    if (pathname.startsWith('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        if (!isValidCsrfOrigin(request)) {
            return new NextResponse(
                JSON.stringify({ success: false, error: 'Forbidden - Cross-Origin Request Blocked (CSRF Shield)' }),
                {
                    status: 403,
                    headers: { 'Content-Type': 'application/json; charset=utf-8' },
                }
            );
        }
    }

    // Canonical host normalization
    if (
        request.nextUrl.hostname === 'www.hiphim.one' ||
        request.nextUrl.hostname === 'hiphim.biz' ||
        request.nextUrl.hostname === 'www.hiphim.biz' ||
        request.nextUrl.hostname === 'www.rapphimchill.app'
    ) {
        const canonicalUrl = request.nextUrl.clone();
        canonicalUrl.hostname = request.nextUrl.hostname.includes('rapphimchill') ? 'rapphimchill.app' : 'hiphim.one';
        return NextResponse.redirect(canonicalUrl, 308);
    }

    // Malicious payload in URL or Query string
    if (containsSuspiciousPayload(request.url)) {
        return new NextResponse('Forbidden - Malicious Payload Detected', { 
            status: 403,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    // Block suspicious paths & sensitive file extensions
    if (isBlockedPath(pathname)) {
        return new NextResponse('Forbidden', { 
            status: 403,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    // Block known scraper bots & attack tools (exempt DMCA validation)
    if (isBlockedUserAgent(userAgent) && pathname !== '/dmca-validation.html') {
        return new NextResponse('Forbidden - Automated Scraper / Scanner Blocked', { 
            status: 403,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    // Multi-tier Anti-DDoS Rate Limiting
    const category = getRateLimitCategory(pathname);
    const rateCheck = checkRateLimit(ip, category);
    if (!rateCheck.allowed) {
        return new NextResponse('Too Many Requests - Anti-DDoS Protection Active', { 
            status: 429,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Retry-After': rateCheck.retryAfter.toString(),
                'X-RateLimit-Limit': rateCheck.limit.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Category': category,
            }
        });
    }

    // -------------------------------------------------------------
    // 2. ADMIN PANEL AUTHENTICATION GUARD (WEB SSO ONLY - NO PUBLIC ADMIN LOGIN)
    // -------------------------------------------------------------
    if (pathname.startsWith('/admin')) {
        const hasAdminAccess = await checkVerifiedAdminCookies(request);

        // Disable /admin/login completely: redirect to /admin if authorized, otherwise to /
        if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
            return NextResponse.redirect(new URL(hasAdminAccess ? '/admin' : '/', request.url));
        }

        // Require authenticated admin session from main website; otherwise bounce to homepage
        if (!hasAdminAccess) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // -------------------------------------------------------------
    // 3. AUTOMATIC & ON-DEMAND MAINTENANCE MODE
    // -------------------------------------------------------------
    const bypassToken = request.nextUrl.searchParams.get('bypass');
    const bypassCookie = request.cookies.get('hiphim_maintenance_bypass')?.value;
    const maintenanceCookie = request.cookies.get('hiphim_maintenance_active')?.value;
    const configuredSecret = process.env.SYSTEM_MAINTENANCE_TOKEN;
    const hasCustomSecret = Boolean(configuredSecret && configuredSecret !== 'hiphim_secret_2026');

    const isExemptPath = 
        pathname === '/maintenance' ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/static/') ||
        pathname === '/favicon.ico' ||
        pathname === '/robots.txt' ||
        pathname === '/sitemap.xml' ||
        pathname === '/dmca-validation.html';

    const isMaintenanceActive = 
        process.env.MAINTENANCE_MODE === 'true' || 
        process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true' ||
        maintenanceCookie === 'true' ||
        (globalThis as any).__HIPHIM_MAINTENANCE__?.enabled === true ||
        (globalThis as any).__HIPHIM_SITE_CONFIG__?.maintenance?.enabled === true;

    if (isMaintenanceActive && !isExemptPath) {
        const isVerifiedAdmin = await checkVerifiedAdminCookies(request);
        const hasValidBypass =
            isVerifiedAdmin ||
            (hasCustomSecret && (bypassToken === configuredSecret || bypassCookie === configuredSecret));

        if (!hasValidBypass) {
            const maintenanceUrl = new URL('/maintenance', request.url);
            return NextResponse.redirect(maintenanceUrl, 307);
        }
    }


    // If valid custom bypass token was passed in query, set cookie and redirect to clean URL
    if (hasCustomSecret && bypassToken === configuredSecret) {
        const cleanUrl = request.nextUrl.clone();
        cleanUrl.searchParams.delete('bypass');
        const response = NextResponse.redirect(cleanUrl);
        response.cookies.set('hiphim_maintenance_bypass', configuredSecret!, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 86400 * 7,
        });
        return response;
    }

    // 4. Open Redirect Mitigation: Sanitize suspicious redirect parameters
    const url = request.nextUrl.clone();
    let hasModifiedParams = false;
    
    if (!pathname.startsWith('/api/')) {
        const redirectParams = ['url', 'redirect', 'next', 'goto', 'target', 'dest'];
        redirectParams.forEach(param => {
            const value = url.searchParams.get(param);
            if (value) {
                if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//')) {
                    try {
                        const parsed = new URL(value, request.nextUrl.origin);
                        const isAllowedHost = 
                            parsed.hostname === request.nextUrl.hostname ||
                            parsed.hostname === 'hiphim.one' ||
                            parsed.hostname === 'hiphim.biz' ||
                            parsed.hostname === 'rapphimchill.app' ||
                            parsed.hostname.endsWith('.phimapi.com') ||
                            parsed.hostname === 'phimapi.com';
                        if (!isAllowedHost) {
                            url.searchParams.delete(param);
                            hasModifiedParams = true;
                        }
                    } catch {
                        url.searchParams.delete(param);
                        hasModifiedParams = true;
                    }
                }
            }
        });
    }

    // Strip URL tracking parameters to ensure ISR cache hit
    const isGoogleTesting = isGoogleOrVerificationAgent(userAgent) || url.searchParams.has('gtm_debug') || url.searchParams.has('_gl');
    if (!isGoogleTesting) {
        const trackingParams = [
            'fbclid', 'gclid', 'wbraid', 'gbraid', 'ref', 'source',
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'
        ];
        
        trackingParams.forEach(param => {
            if (url.searchParams.has(param)) {
                url.searchParams.delete(param);
                hasModifiedParams = true;
            }
        });

        if (hasModifiedParams) {
            // Rewrite internally to the normalized clean URL to preserve edge cache hits without a costly 307 round-trip
            return NextResponse.rewrite(url);
        }
    }

    const response = NextResponse.next();

    // 5. Cloudflare Edge CDN Caching Strategy (Zero-Worker Invocations on CDN Hits)
    if (method === 'GET' && !pathname.startsWith('/admin')) {
        const isPublicCacheableApi =
            pathname === '/api/announcement' ||
            pathname === '/api/rating' ||
            (pathname === '/api/system/maintenance' && !url.search);

        if (!pathname.startsWith('/api/') || isPublicCacheableApi) {
            const hasAuthCookie = request.cookies.has('hiphim_user_session') || request.cookies.has('hiphim_admin_session');
            if (!hasAuthCookie) {
                const maxAge = isPublicCacheableApi ? 600 : 300;
                response.headers.set('Cloudflare-CDN-Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=3600`);
                response.headers.set('CDN-Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=3600`);
            }
        }
    }

    // 6. Enterprise Security Headers (Defense-in-Depth)
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()');
    response.headers.set(
        'Content-Security-Policy',
        "frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self';"
    );
    response.headers.set('Vary', 'Accept-Encoding');
    
    if (isCacheableAsset(pathname)) {
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next|favicon.*|icon.*|apple-icon.*|manifest.*|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|css|js|map|json|xml|txt|plist|webmanifest)$).*)',
    ],
};
