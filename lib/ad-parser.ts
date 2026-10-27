export interface AdRange {
  start: number;
  end: number;
  duration: number;
  type?: 'commercial' | 'banner';
}

export interface ParsedAdData {
  commercialRanges: AdRange[]; // Standalone commercial clips to auto-skip
  bannerRanges: AdRange[];     // Burned-in banner watermark ranges to auto-mask
}

// In-memory cache for parsed m3u8 ad ranges to prevent re-fetching
const adRangesCache = new Map<string, ParsedAdData>();

/**
 * Checks whether a given segment URL/filename is a re-encoded film segment with a burned-in banner.
 * These segments contain real film content with gambling text overlays, so they must NOT be skipped.
 * Instead, they trigger the real-time banner shield mask.
 */
export function isBannerSegment(url: any): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  if (
    lower.includes('convertv8') ||
    lower.includes('banner_ad') ||
    lower.includes('sponsor') ||
    lower.includes('watermark') ||
    lower.includes('qc_banner')
  ) {
    return true;
  }
  return false;
}

/**
 * Checks whether a given segment URL/filename matches known standalone commercial video ad clips.
 * (e.g. 15s - 30s dancing girl/slot machine spliced commercials).
 */
export function isCommercialSegment(url: any, duration?: any): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();

  // Re-encoded film segments with banners are handled by isBannerSegment, do not skip film
  if (lower.includes('convertv8') || lower.includes('qc_banner')) return false;

  const numDur = typeof duration === 'number' && !isNaN(duration) ? duration : undefined;

  // Standalone spliced commercial video segments
  if (lower.includes('/v8/') && (lower.includes('segment_') || (numDur !== undefined && numDur < 6))) {
    return true;
  }
  if (
    lower.includes('advert') ||
    lower.includes('/ad/') ||
    lower.includes('quangcao') ||
    lower.includes('commercial') ||
    lower.includes('promo') ||
    lower.includes('sponsor_clip')
  ) {
    return true;
  }
  if (
    lower.includes('9922') ||
    lower.includes('okvip') ||
    lower.includes('shbet') ||
    lower.includes('789bet') ||
    lower.includes('f8bet') ||
    lower.includes('jun88') ||
    lower.includes('hi88') ||
    lower.includes('kubet') ||
    lower.includes('thabet') ||
    lower.includes('w88') ||
    lower.includes('fun88') ||
    lower.includes('m88') ||
    lower.includes('bk8') ||
    lower.includes('fb88') ||
    lower.includes('sin88') ||
    lower.includes('may88') ||
    lower.includes('yo88') ||
    lower.includes('sunwin') ||
    lower.includes('go88')
  ) {
    return true;
  }

  return false;
}

/**
 * Checks whether a segment is any kind of ad (commercial or banner).
 */
export function isAdSegment(url: any, duration?: any): boolean {
  return isCommercialSegment(url, duration) || isBannerSegment(url);
}

/**
 * Parses both commercial and banner ad ranges from m3u8 playlist text.
 */
export function parseAllAdRangesFromM3U8Text(m3u8Text: string): ParsedAdData {
  try {
    if (!m3u8Text || typeof m3u8Text !== 'string') return { commercialRanges: [], bannerRanges: [] };

    const lines = m3u8Text.split('\n');
    const segments: Array<{ start: number; end: number; dur: number; seg: string }> = [];
    let currentSec = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF:')) {
        const dur = parseFloat(line.substring(8));
        let seg = '';
        for (let j = i + 1; j < lines.length; j++) {
          const next = lines[j].trim();
          if (next && !next.startsWith('#')) {
            seg = next;
            break;
          }
        }
        if (!isNaN(dur) && dur > 0) {
          segments.push({
            start: currentSec,
            end: currentSec + dur,
            dur,
            seg,
          });
          currentSec += dur;
        }
      }
    }

    // 1. Group commercial ranges
    const commercialRanges: AdRange[] = [];
    let inComm = false;
    let commStart = 0;
    let commEnd = 0;

    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      const isComm = isCommercialSegment(s.seg, s.dur);

      if (isComm) {
        if (!inComm) {
          inComm = true;
          commStart = s.start;
        }
        commEnd = s.end;
      } else {
        if (inComm) {
          inComm = false;
          const dur = commEnd - commStart;
          if (dur >= 4 && dur <= 90) {
            commercialRanges.push({ start: commStart, end: commEnd, duration: dur, type: 'commercial' });
          }
        }
      }
    }
    if (inComm) {
      const dur = commEnd - commStart;
      if (dur >= 4 && dur <= 90) {
        commercialRanges.push({ start: commStart, end: commEnd, duration: dur, type: 'commercial' });
      }
    }

    // 2. Group banner ranges
    const bannerRanges: AdRange[] = [];
    let inBanner = false;
    let bannerStart = 0;
    let bannerEnd = 0;

    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      const isBanner = isBannerSegment(s.seg);

      if (isBanner) {
        if (!inBanner) {
          inBanner = true;
          bannerStart = s.start;
        }
        bannerEnd = s.end;
      } else {
        if (inBanner) {
          inBanner = false;
          const dur = bannerEnd - bannerStart;
          if (dur >= 3) {
            bannerRanges.push({ start: bannerStart, end: bannerEnd, duration: dur, type: 'banner' });
          }
        }
      }
    }
    if (inBanner) {
      const dur = bannerEnd - bannerStart;
      if (dur >= 3) {
        bannerRanges.push({ start: bannerStart, end: bannerEnd, duration: dur, type: 'banner' });
      }
    }

    return { commercialRanges, bannerRanges };
  } catch {
    return { commercialRanges: [], bannerRanges: [] };
  }
}

/**
 * Parses commercial ad ranges from m3u8 playlist text (backwards compatible).
 */
export function parseAdRangesFromM3U8Text(m3u8Text: string): AdRange[] {
  return parseAllAdRangesFromM3U8Text(m3u8Text).commercialRanges;
}

/**
 * Extracts all ad ranges directly from Hls.js fragment objects (zero network latency).
 */
export function extractAllAdRangesFromFragments(fragments: any[]): ParsedAdData {
  try {
    if (!Array.isArray(fragments) || fragments.length === 0) {
      return { commercialRanges: [], bannerRanges: [] };
    }

    const commercialRanges: AdRange[] = [];
    let inComm = false;
    let commStart = 0;
    let commEnd = 0;

    const bannerRanges: AdRange[] = [];
    let inBanner = false;
    let bannerStart = 0;
    let bannerEnd = 0;

    for (let i = 0; i < fragments.length; i++) {
      const f = fragments[i];
      if (!f || typeof f !== 'object') continue;

      const url = typeof f.relurl === 'string' && f.relurl 
        ? f.relurl 
        : (typeof f.url === 'string' && f.url ? f.url : '');
      const dur = typeof f.duration === 'number' && !isNaN(f.duration) ? f.duration : 0;
      const start = typeof f.start === 'number' && !isNaN(f.start) ? f.start : 0;

      // Commercial check
      if (isCommercialSegment(url, dur)) {
        if (!inComm) {
          inComm = true;
          commStart = start;
        }
        commEnd = start + dur;
      } else {
        if (inComm) {
          inComm = false;
          const duration = commEnd - commStart;
          if (duration >= 4 && duration <= 90) {
            commercialRanges.push({ start: commStart, end: commEnd, duration, type: 'commercial' });
          }
        }
      }

      // Banner check
      if (isBannerSegment(url)) {
        if (!inBanner) {
          inBanner = true;
          bannerStart = start;
        }
        bannerEnd = start + dur;
      } else {
        if (inBanner) {
          inBanner = false;
          const duration = bannerEnd - bannerStart;
          if (duration >= 3) {
            bannerRanges.push({ start: bannerStart, end: bannerEnd, duration, type: 'banner' });
          }
        }
      }
    }

    if (inComm) {
      const duration = commEnd - commStart;
      if (duration >= 4 && duration <= 90) {
        commercialRanges.push({ start: commStart, end: commEnd, duration, type: 'commercial' });
      }
    }

    if (inBanner) {
      const duration = bannerEnd - bannerStart;
      if (duration >= 3) {
        bannerRanges.push({ start: bannerStart, end: bannerEnd, duration, type: 'banner' });
      }
    }

    return { commercialRanges, bannerRanges };
  } catch {
    return { commercialRanges: [], bannerRanges: [] };
  }
}

/**
 * Extracts commercial ad ranges directly from Hls.js fragment objects (backwards compatible).
 */
export function extractAdRangesFromFragments(fragments: any[]): AdRange[] {
  return extractAllAdRangesFromFragments(fragments).commercialRanges;
}

/**
 * Fetches and parses all ad ranges (both commercial and banner) from an m3u8 playlist URL.
 */
export async function fetchAndParseAllAdRanges(videoUrl: string): Promise<ParsedAdData> {
  if (!videoUrl || typeof videoUrl !== 'string' || !videoUrl.includes('.m3u8')) {
    return { commercialRanges: [], bannerRanges: [] };
  }

  if (adRangesCache.has(videoUrl)) {
    return adRangesCache.get(videoUrl)!;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(videoUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return { commercialRanges: [], bannerRanges: [] };

    const text = await res.text();
    let targetText = text;

    // Check if master playlist contains sub-playlists
    if (text.includes('#EXT-X-STREAM-INF')) {
      const lines = text.split('\n');
      const streamLine = lines.find(
        (l) => l.trim().endsWith('.m3u8') || (!l.startsWith('#') && l.trim().length > 0)
      );
      if (streamLine) {
        try {
          const targetUrl = new URL(streamLine.trim(), videoUrl).href;
          const subRes = await fetch(targetUrl);
          if (subRes.ok) {
            targetText = await subRes.text();
          }
        } catch {}
      }
    }

    const data = parseAllAdRangesFromM3U8Text(targetText);
    adRangesCache.set(videoUrl, data);
    return data;
  } catch {
    return { commercialRanges: [], bannerRanges: [] };
  }
}

/**
 * Fetches and parses commercial ad ranges from an m3u8 playlist URL (backwards compatible).
 */
export async function fetchAndParseAdRanges(videoUrl: string): Promise<AdRange[]> {
  const data = await fetchAndParseAllAdRanges(videoUrl);
  return data.commercialRanges;
}
