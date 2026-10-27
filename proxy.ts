// Security & Performance Proxy for Next.js 16+
// Protects against common attacks and optimizes performance

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/admin-token';
import { verifyUserSessionToken } from '@/lib/user-token';

// Blocked user agents (common scraper bots)
const BLOCKED_USER_AGENTS = [
    // Common scraper & automated bots
    'httrack',
    'wget',
    'curl',
    'scrapy',
    'python-requests',
    'go-http-client',
    'java/',
    'libwww-perl',
    'apache-httpclient',
    'http.rb',
    // AI scrapers
    'gptbot',
    'chatgpt-user',
    'ccbot',
    'anthropic-ai',
    'claude-web',
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
    'wpscan',
    'hydra',
    'metasploit',
    'havij',
    'pangolin',
    'nessus',
    'openvas',
];

// Blocked paths - prevent access to sensitive files
const BLOCKED_PATHS = [
    '/.env',
    '/.git',
    '/wp-admin',
    '/wp-login',
    '/phpmyadmin',
    '/admin.php',
    '/.htaccess',
    '/config.php',
    '/xmlrpc.php',
];

// Cache-friendly paths (static fonts and assets)
const CACHE_ASSET_PATHS = [
    /\.woff2?$/,
    /\.ttf$/,
    /\.eot$/,
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

    // Never block Google bots, Google Tag Assistant, or Google Analytics verification
    if (isGoogleOrVerificationAgent(userAgent)) {
        return false;
    }

    const lowerUA = userAgent.toLowerCase();
    return BLOCKED_USER_AGENTS.some(blocked => lowerUA.includes(blocked));
}

function isBlockedPath(pathname: string): boolean {
    const lowerPath = pathname.toLowerCase();
    return BLOCKED_PATHS.some(blocked => lowerPath.startsWith(blocked));
}

function isCacheableAsset(pathname: string): boolean {
    return CACHE_ASSET_PATHS.some(pattern => pattern.test(pathname));
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
  auth: { windowMs: 30_000, maxRequests: 30 }, // 30 req / 30s for Auth/OTP endpoints (brute-force & email flood shield)
  api_proxy: { windowMs: 10_000, maxRequests: 600 }, // 600 req / 10s (60 req/s) for movie API & search (scraping shield, NAT/4G carrier friendly)
  general: { windowMs: 10_000, maxRequests: 1200 }, // 1200 req / 10s (120 req/s) for normal browsing (NAT / 4G shared IP friendly)
};

function getRateLimitCategory(pathname: string): 'auth' | 'api_proxy' | 'general' {
  if (pathname.startsWith('/api/auth/') || pathname === '/api/admin/login') {
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

  // Flush expired cache entries when map grows
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

// Common malicious URL patterns (Path traversal, SQLi, XSS, Remote File Inclusion)
const SUSPICIOUS_PATTERNS = [
  /\.\.\//, // Directory traversal ../
  /%2e%2e%2f/i, // Encoded ../
  /(?:union\s+select|select\s+.*\s+from|information_schema)/i, // SQL injection
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i, // Script injection
  /javascript:/i, // JavaScript URI scheme
  /\b(?:etc\/passwd|win\.ini|boot\.ini)\b/i, // Sensitive local files
];

function containsSuspiciousPayload(urlStr: string): boolean {
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(urlStr));
}

let maintenanceCache = {
  enabled: false,
  lastChecked: 0,
};

async function getIsMaintenanceActive(request: NextRequest): Promise<boolean> {
  const now = Date.now();
  if (now - maintenanceCache.lastChecked < 2500) {
    return maintenanceCache.enabled;
  }

  try {
    const origin = request.nextUrl.origin;
    const res = await fetch(`${origin}/api/system/maintenance`, {
      cache: 'no-store',
      headers: { 'x-proxy-check': '1' },
    });
    if (res.ok) {
      const data = await res.json();
      maintenanceCache = {
        enabled: Boolean(data?.enabled),
        lastChecked: now,
      };
      return maintenanceCache.enabled;
    }
  } catch {
    // Ignore fetch error, keep cached
  }
  return maintenanceCache.enabled;
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const userAgent = request.headers.get('user-agent');
    const ip =
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown';

    // 1. Restrict HTTP Methods to standard safe methods (Block TRACE, TRACK, CONNECT)
    const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    if (!ALLOWED_METHODS.includes(request.method.toUpperCase())) {
        return new NextResponse('Method Not Allowed', { 
            status: 405,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    // Require User-Agent on mutating requests (automated attack scripts often omit User-Agent)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method.toUpperCase()) && (!userAgent || userAgent.trim() === '')) {
        return new NextResponse('Forbidden - User Agent Required', { 
            status: 403,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    // Canonical host normalization: redirect www to apex, and redirect old domain (hiphim.biz) to hiphim.one
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

    // Block suspicious paths
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

    // Multi-tier Anti-DDoS Rate Limiting (Soft limit per window, no persistent IP jail)
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
    // 2. ADMIN PANEL AUTHENTICATION GUARD
    // -------------------------------------------------------------
    if (pathname.startsWith('/admin')) {
        let hasAdminAccess = false;

        // 1. Check admin session cookie
        const adminSessionCookie = request.cookies.get('hiphim_admin_session')?.value;
        if (adminSessionCookie) {
            hasAdminAccess = await verifySessionToken(adminSessionCookie);
        }

        // 2. If not verified via admin cookie, check Super Admin user session
        if (!hasAdminAccess) {
            const userSessionCookie = request.cookies.get('hiphim_user_session')?.value;
            if (userSessionCookie) {
                const userPayload = await verifyUserSessionToken(userSessionCookie);
                if (userPayload?.email?.toLowerCase() === 'kimdinhphuong205@gmail.com') {
                    hasAdminAccess = true;
                }
            }
        }

        // Public login page
        if (pathname === '/admin/login') {
            if (hasAdminAccess) {
                return NextResponse.redirect(new URL('/admin', request.url));
            }
            return NextResponse.next();
        }

        // All other /admin routes require valid authenticated session
        if (!hasAdminAccess) {
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // -------------------------------------------------------------
    // 3. AUTOMATIC & ON-DEMAND MAINTENANCE MODE
    // -------------------------------------------------------------
    const bypassToken = request.nextUrl.searchParams.get('bypass');
    const bypassCookie = request.cookies.get('hiphim_maintenance_bypass')?.value;
    const maintenanceCookie = request.cookies.get('hiphim_maintenance_active')?.value;
    const secretToken = process.env.SYSTEM_MAINTENANCE_TOKEN || "hiphim_secret_2026";
    
    // Check if bypass token in query or cookie is valid, or if logged in as admin
    const hasAdminSession = Boolean(
        request.cookies.get('hiphim_admin_session')?.value ||
        request.cookies.get('hiphim_user_session')?.value
    );
    const hasValidBypass = 
        bypassToken === secretToken || 
        bypassCookie === secretToken ||
        hasAdminSession;

    // Paths exempt from maintenance redirection:
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

    // Check if maintenance is currently active
    let isMaintenanceActive = 
        process.env.MAINTENANCE_MODE === 'true' || 
        process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true' ||
        maintenanceCookie === 'true' ||
        (globalThis as any).__HIPHIM_MAINTENANCE__?.enabled === true;

    // If not flagged by env/cookie, query internal system status (cached 2s) for HTML pages
    if (!isMaintenanceActive && !isExemptPath) {
        try {
            isMaintenanceActive = await getIsMaintenanceActive(request);
        } catch {
            // fallback
        }
    }

    // A. When Maintenance is ON: Redirect all non-exempt visitors to /maintenance
    if (isMaintenanceActive && !hasValidBypass && !isExemptPath) {
        const maintenanceUrl = new URL('/maintenance', request.url);
        return NextResponse.redirect(maintenanceUrl, 307);
    }

    // B. When Maintenance is OFF: If visitor navigates to /maintenance, redirect back to /
    if (pathname === '/maintenance' && !isMaintenanceActive && !request.nextUrl.searchParams.has('preview')) {
        const homeUrl = new URL('/', request.url);
        return NextResponse.redirect(homeUrl, 307);
    }

    // If valid bypass token was passed in query, set cookie and redirect to clean URL
    if (bypassToken === secretToken) {
        const cleanUrl = request.nextUrl.clone();
        cleanUrl.searchParams.delete('bypass');
        const response = NextResponse.redirect(cleanUrl);
        response.cookies.set('hiphim_maintenance_bypass', secretToken, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 86400 * 7, // 7 days bypass
        });
        return response;
    }

    // 2. Open Redirect Mitigation: Sanitize suspicious redirect parameters (Exclude /api/ routes which proxy internal/external APIs)
    const url = request.nextUrl.clone();
    let hasModifiedParams = false;
    
    if (!pathname.startsWith('/api/')) {
        const redirectParams = ['url', 'redirect', 'next', 'goto', 'target', 'dest'];
        redirectParams.forEach(param => {
            const value = url.searchParams.get(param);
            if (value) {
                // If the redirect parameter points to an absolute external domain, strip it to prevent open redirect
                if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//')) {
                    try {
                        const parsed = new URL(value, request.nextUrl.origin);
                        const isAllowedHost = 
                            parsed.hostname === request.nextUrl.hostname ||
                            parsed.hostname === 'hiphim.one' ||
                            parsed.hostname === 'hiphim.biz' ||
                            parsed.hostname === 'rapphimchill.app' ||
                            parsed.hostname.endsWith('phimapi.com');
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

    // Strip URL tracking parameters to ensure ISR cache hit (Facebook fbclid issue)
    // EXEMPT Google verification and Google Tag Assistant debug sessions
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
            // Redirect to the clean URL so it hits the static Next.js cache and prevents open redirect
            return NextResponse.redirect(url, 307);
        }
    }

    // Continue with request
    const response = NextResponse.next();

    // Add security headers (Resolves Security Headers Audit P1 findings)
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
    
    // Add compression headers for better performance
    response.headers.set('Vary', 'Accept-Encoding');
    
    // Add cache headers for static assets
    if (isCacheableAsset(pathname)) {
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    // Add performance timing header for monitoring
    response.headers.set('X-Response-Time', new Date().getTime().toString());

    return response;
}

// Configure which paths the proxy runs on
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder assets
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
};
