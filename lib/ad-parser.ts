export interface AdRange {
  start: number;
  end: number;
  duration: number;
  type?: 'commercial' | 'banner';
}

export interface ParsedAdData {
  commercialRanges: AdRange[]; // Standalone commercial clips to auto-skip / strip
  bannerRanges: AdRange[];     // Burned-in banner watermark ranges
}

export interface StrippedManifestResult {
  manifest: string;
  strippedCount: number;
  strippedDuration: number;
  commercialRanges: AdRange[];
}

// In-memory cache for parsed m3u8 ad ranges to prevent re-fetching
const adRangesCache = new Map<string, ParsedAdData>();

/**
 * Checks whether a given segment URL/filename is a re-encoded film segment with a burned-in banner.
 * These segments contain real film content with text overlays, so they must NOT be stripped or skipped.
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

const COMMERCIAL_KEYWORDS = [
  'advert',
  '/ad/',
  '/ads/',
  'adjump',
  'ad_clip',
  'adclip',
  'quangcao',
  'quang_cao',
  'commercial',
  'promo_clip',
  'sponsor_clip',
  'preroll',
  'midroll',
  '9922',
  'okvip',
  'shbet',
  '789bet',
  'f8bet',
  'jun88',
  'hi88',
  'kubet',
  'thabet',
  'w88',
  'fun88',
  'm88',
  'bk8',
  'fb88',
  'sin88',
  'may88',
  'yo88',
  'sunwin',
  'go88',
  'new88',
  'mb66',
  '8kbet',
  'qq88',
  'hitclub',
  'rikvip',
  'iwin',
  '789club',
  '188bet',
  'v9bet',
  's666',
  'ee88',
  'qh88',
  'oxbet',
  'five88',
  'debet',
  'zbet',
  'lucky88',
  'bong88',
  'sv388',
  'ae888',
];

/**
 * Checks whether a given segment URL/filename matches known standalone commercial video ad clips.
 * (e.g. 15s - 30s gambling/slot machine spliced commercials).
 */
export function isCommercialSegment(url: any, duration?: any): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();

  // Re-encoded film segments with banners are handled by isBannerSegment, do not skip film
  if (lower.includes('convertv8') || lower.includes('qc_banner')) return false;

  const numDur = typeof duration === 'number' && !isNaN(duration) ? duration : undefined;

  // Standalone spliced commercial video segments in /v8/ directory
  if (lower.includes('/v8/') && (lower.includes('segment_') || (numDur !== undefined && numDur < 6))) {
    return true;
  }

  for (let i = 0; i < COMMERCIAL_KEYWORDS.length; i++) {
    if (lower.includes(COMMERCIAL_KEYWORDS[i])) {
      return true;
    }
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
 * Extracts a normalized structural signature (directory prefix + filename stem pattern)
 * for a segment URI so spliced ad islands from a different folder or numbering scheme can be spotted.
 */
function getSegmentSignature(rawUri: string): { dirPrefix: string; stemPattern: string; seqNum: number | null } {
  const clean = rawUri.split('?')[0].split('#')[0].trim();
  const lastSlash = clean.lastIndexOf('/');
  const dirPrefix = lastSlash >= 0 ? clean.substring(0, lastSlash).toLowerCase() : '';
  const fileName = lastSlash >= 0 ? clean.substring(lastSlash + 1) : clean;
  const dotIdx = fileName.lastIndexOf('.');
  const baseName = dotIdx >= 0 ? fileName.substring(0, dotIdx) : fileName;

  // Check if filename is a long hex/MD5 hash (e.g. 32 hex chars) vs sequential (e.g. index001.ts, seg-12.ts)
  if (/^[a-f0-9]{20,}$/i.test(baseName)) {
    return { dirPrefix, stemPattern: `${dirPrefix}/__hexhash__`, seqNum: null };
  }

  const numMatch = baseName.match(/(\d+)$/);
  const seqNum = numMatch ? parseInt(numMatch[1], 10) : null;
  const stem = baseName.replace(/\d+$/, '#').toLowerCase();

  return {
    dirPrefix,
    stemPattern: `${dirPrefix}/${stem}`,
    seqNum: Number.isFinite(seqNum) ? seqNum : null,
  };
}

interface RawM3u8Segment {
  index: number;
  start: number;
  end: number;
  dur: number;
  uri: string;
  blockId: number;
  inCueOut: boolean;
  extinfLineIdx: number;
  uriLineIdx: number;
  metaLineIndices: number[];
}

/**
 * Analyzes an M3U8 media playlist to identify commercial ad segments using:
 * 1. Explicit keyword matching (isCommercialSegment)
 * 2. SCTE-35 / #EXT-X-CUE-OUT ... #EXT-X-CUE-IN markers
 * 3. #EXT-X-DISCONTINUITY Ad Island heuristics (short 3s-80s spliced blocks whose
 *    directory prefix, filename pattern, or reset sequence numbering diverges from the main movie)
 */
function identifyCommercialSegmentsInM3U8(lines: string[]): {
  segments: RawM3u8Segment[];
  adSegmentIndices: Set<number>;
  commercialRanges: AdRange[];
} {
  const segments: RawM3u8Segment[] = [];
  let currentSec = 0;
  let currentBlockId = 0;
  let inCueOut = false;
  let pendingMetaLines: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXT-X-DISCONTINUITY') && !line.startsWith('#EXT-X-DISCONTINUITY-SEQUENCE')) {
      currentBlockId++;
      pendingMetaLines = [];
      continue;
    }

    if (line.startsWith('#EXT-X-CUE-OUT') || (line.startsWith('#EXT-X-DATERANGE') && line.includes('SCTE35-OUT'))) {
      inCueOut = true;
      pendingMetaLines.push(i);
      continue;
    }

    if (line.startsWith('#EXT-X-CUE-IN') || (line.startsWith('#EXT-X-DATERANGE') && line.includes('SCTE35-IN'))) {
      inCueOut = false;
      pendingMetaLines.push(i);
      continue;
    }

    if (
      line.startsWith('#EXT-X-BYTERANGE') ||
      line.startsWith('#EXT-X-PROGRAM-DATE-TIME') ||
      line.startsWith('#EXT-X-BITRATE')
    ) {
      pendingMetaLines.push(i);
      continue;
    }

    if (line.startsWith('#EXTINF:')) {
      const dur = parseFloat(line.substring(8));
      let uri = '';
      let uriLineIdx = -1;
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j].trim();
        if (!next) continue;
        if (
          next.startsWith('#EXT-X-BYTERANGE') ||
          next.startsWith('#EXT-X-PROGRAM-DATE-TIME') ||
          next.startsWith('#EXT-X-BITRATE')
        ) {
          pendingMetaLines.push(j);
          continue;
        }
        if (!next.startsWith('#')) {
          uri = next;
          uriLineIdx = j;
          break;
        }
        if (next.startsWith('#EXTINF:') || next.startsWith('#EXT-X-DISCONTINUITY')) {
          break;
        }
      }

      if (!isNaN(dur) && dur > 0 && uri && uriLineIdx !== -1) {
        const segIdx = segments.length;
        segments.push({
          index: segIdx,
          start: currentSec,
          end: currentSec + dur,
          dur,
          uri,
          blockId: currentBlockId,
          inCueOut,
          extinfLineIdx: i,
          uriLineIdx,
          metaLineIndices: [...pendingMetaLines],
        });
        currentSec += dur;
        pendingMetaLines = [];
        i = uriLineIdx;
      }
    }
  }

  const adSegmentIndices = new Set<number>();
  if (segments.length === 0) {
    return { segments, adSegmentIndices, commercialRanges: [] };
  }

  const totalDuration = currentSec;

  // Group segments by discontinuity blockId
  const blocks = new Map<number, RawM3u8Segment[]>();
  const patternDuration = new Map<string, number>();
  const dirDuration = new Map<string, number>();

  for (const seg of segments) {
    const list = blocks.get(seg.blockId) || [];
    list.push(seg);
    blocks.set(seg.blockId, list);

    const sig = getSegmentSignature(seg.uri);
    patternDuration.set(sig.stemPattern, (patternDuration.get(sig.stemPattern) || 0) + seg.dur);
    dirDuration.set(sig.dirPrefix, (dirDuration.get(sig.dirPrefix) || 0) + seg.dur);
  }

  // Find dominant stemPattern and dirPrefix of the main movie
  let dominantPattern = '';
  let maxPatternDur = 0;
  for (const [pat, dur] of patternDuration.entries()) {
    if (dur > maxPatternDur) {
      maxPatternDur = dur;
      dominantPattern = pat;
    }
  }

  let dominantDir = '';
  let maxDirDur = 0;
  for (const [dir, dur] of dirDuration.entries()) {
    if (dur > maxDirDur) {
      maxDirDur = dur;
      dominantDir = dir;
    }
  }

  // Pass 1: Direct segment checks (keyword match or SCTE-35 CUE-OUT)
  for (const seg of segments) {
    if (isBannerSegment(seg.uri)) continue;
    if (seg.inCueOut || isCommercialSegment(seg.uri, seg.dur)) {
      adSegmentIndices.add(seg.index);
    }
  }

  // Pass 2: Discontinuity Block Analysis (when movie has multiple discontinuity blocks & totalDuration >= 180s)
  if (blocks.size > 1 && totalDuration >= 180) {
    const blockEntries = Array.from(blocks.entries());
    for (let bIdx = 0; bIdx < blockEntries.length; bIdx++) {
      const [, blockSegs] = blockEntries[bIdx];
      if (blockSegs.length === 0) continue;

      // Skip if any segment in this block is a burned-in banner film segment
      if (blockSegs.some((s) => isBannerSegment(s.uri))) continue;

      const blockDur = blockSegs.reduce((acc, s) => acc + s.dur, 0);

      // If any segment in a short discontinuity block (<= 90s) matched commercial keyword, taint the whole block
      if (blockDur <= 90 && blockSegs.some((s) => adSegmentIndices.has(s.index))) {
        for (const s of blockSegs) adSegmentIndices.add(s.index);
        continue;
      }

      // Heuristic for unlabeled spliced commercial islands between #EXT-X-DISCONTINUITY tags:
      // Spliced ads are short islands (3.5s to 75s, <= 20 segments) in a movie >= 180s
      if (blockDur >= 3.5 && blockDur <= 75 && blockSegs.length <= 20 && blockDur < totalDuration * 0.25) {
        const firstSig = getSegmentSignature(blockSegs[0].uri);
        const differsFromDominantDir = dominantDir !== '' && firstSig.dirPrefix !== dominantDir;
        const differsFromDominantPattern = dominantPattern !== '' && firstSig.stemPattern !== dominantPattern;

        // Check if sequence number resets to 0 or 1 in the middle of the stream (classic spliced ad clip trait)
        const isMiddleBlock = bIdx > 0;
        const prevBlock = bIdx > 0 ? blockEntries[bIdx - 1][1] : null;
        const prevLastSig = prevBlock && prevBlock.length > 0 ? getSegmentSignature(prevBlock[prevBlock.length - 1].uri) : null;
        const hasSequenceReset =
          isMiddleBlock &&
          firstSig.seqNum !== null &&
          (firstSig.seqNum === 0 || firstSig.seqNum === 1) &&
          prevLastSig !== null &&
          prevLastSig.seqNum !== null &&
          prevLastSig.seqNum > 5;

        // Check if segment average duration inside the block is anomalously uniform/short compared to movie
        if (differsFromDominantDir || differsFromDominantPattern || hasSequenceReset) {
          for (const s of blockSegs) {
            adSegmentIndices.add(s.index);
          }
        }
      }
    }
  }

  // Build contiguous commercialRanges from adSegmentIndices
  const commercialRanges: AdRange[] = [];
  let inComm = false;
  let commStart = 0;
  let commEnd = 0;

  for (const seg of segments) {
    if (adSegmentIndices.has(seg.index)) {
      if (!inComm) {
        inComm = true;
        commStart = seg.start;
      }
      commEnd = seg.end;
    } else if (inComm) {
      inComm = false;
      const dur = commEnd - commStart;
      if (dur >= 2 && dur <= 120) {
        commercialRanges.push({ start: commStart, end: commEnd, duration: dur, type: 'commercial' });
      }
    }
  }
  if (inComm) {
    const dur = commEnd - commStart;
    if (dur >= 2 && dur <= 120) {
      commercialRanges.push({ start: commStart, end: commEnd, duration: dur, type: 'commercial' });
    }
  }

  return { segments, adSegmentIndices, commercialRanges };
}

/**
 * Directly strips commercial ad segments from an M3U8 media playlist text.
 * Used by Hls.js custom playlist loader so ad .ts segments are NEVER downloaded or buffered.
 */
export function stripAdsFromM3u8Manifest(m3u8Text: string): StrippedManifestResult {
  if (!m3u8Text || typeof m3u8Text !== 'string' || !m3u8Text.includes('#EXTINF:')) {
    return { manifest: m3u8Text, strippedCount: 0, strippedDuration: 0, commercialRanges: [] };
  }

  // Do not modify master playlists
  if (m3u8Text.includes('#EXT-X-STREAM-INF')) {
    return { manifest: m3u8Text, strippedCount: 0, strippedDuration: 0, commercialRanges: [] };
  }

  try {
    const rawLines = m3u8Text.split(/\r?\n/);
    const { segments, adSegmentIndices, commercialRanges } = identifyCommercialSegmentsInM3U8(rawLines);

    if (adSegmentIndices.size === 0) {
      return { manifest: m3u8Text, strippedCount: 0, strippedDuration: 0, commercialRanges: [] };
    }

    // Safety guard: Never strip if more than 40% of total segments were flagged (protects against malformed playlists)
    if (adSegmentIndices.size >= segments.length * 0.4) {
      return { manifest: m3u8Text, strippedCount: 0, strippedDuration: 0, commercialRanges };
    }

    const linesToRemove = new Set<number>();
    let strippedDuration = 0;

    for (const seg of segments) {
      if (adSegmentIndices.has(seg.index)) {
        strippedDuration += seg.dur;
        linesToRemove.add(seg.extinfLineIdx);
        linesToRemove.add(seg.uriLineIdx);
        for (const metaIdx of seg.metaLineIndices) {
          linesToRemove.add(metaIdx);
        }
      }
    }

    // Rebuild playlist and collapse redundant / consecutive / leading / trailing #EXT-X-DISCONTINUITY tags
    const cleanedLines: string[] = [];
    let hasSeenMediaSegment = false;
    let pendingDiscontinuity = false;

    for (let i = 0; i < rawLines.length; i++) {
      if (linesToRemove.has(i)) continue;
      const trimmed = rawLines[i].trim();

      if (trimmed.startsWith('#EXT-X-DISCONTINUITY') && !trimmed.startsWith('#EXT-X-DISCONTINUITY-SEQUENCE')) {
        if (hasSeenMediaSegment) {
          pendingDiscontinuity = true;
        }
        continue;
      }

      if (trimmed.startsWith('#EXT-X-CUE-OUT') || trimmed.startsWith('#EXT-X-CUE-IN')) {
        continue;
      }

      if (trimmed.startsWith('#EXTINF:')) {
        if (pendingDiscontinuity) {
          cleanedLines.push('#EXT-X-DISCONTINUITY');
          pendingDiscontinuity = false;
        }
        hasSeenMediaSegment = true;
      }

      cleanedLines.push(rawLines[i]);
    }

    return {
      manifest: cleanedLines.join('\n'),
      strippedCount: adSegmentIndices.size,
      strippedDuration,
      commercialRanges,
    };
  } catch {
    return { manifest: m3u8Text, strippedCount: 0, strippedDuration: 0, commercialRanges: [] };
  }
}

/**
 * Creates a custom Hls.js loader class that intercepts media playlists (.m3u8)
 * and strips spliced commercial ad segments in-memory before Hls.js parses them.
 */
export function createAdStrippingHlsLoader(
  BaseLoader: any,
  onAdsStripped?: (info: { strippedCount: number; strippedDuration: number; commercialRanges: AdRange[] }) => void
): any {
  if (!BaseLoader) return undefined;

  return class AdStrippingLoader extends BaseLoader {
    load(context: any, config: any, callbacks: any) {
      const originalOnSuccess = callbacks.onSuccess;
      callbacks.onSuccess = (response: any, stats: any, ctx: any, networkDetails: any) => {
        try {
          if (
            response &&
            typeof response.data === 'string' &&
            response.data.includes('#EXTINF:') &&
            !response.data.includes('#EXT-X-STREAM-INF')
          ) {
            const result = stripAdsFromM3u8Manifest(response.data);
            if (result.strippedCount > 0) {
              response.data = result.manifest;
              onAdsStripped?.({
                strippedCount: result.strippedCount,
                strippedDuration: result.strippedDuration,
                commercialRanges: result.commercialRanges,
              });
            }
          }
        } catch {}
        originalOnSuccess(response, stats, ctx, networkDetails);
      };
      super.load(context, config, callbacks);
    }
  };
}

/**
 * Parses both commercial and banner ad ranges from m3u8 playlist text.
 */
export function parseAllAdRangesFromM3U8Text(m3u8Text: string): ParsedAdData {
  try {
    if (!m3u8Text || typeof m3u8Text !== 'string') return { commercialRanges: [], bannerRanges: [] };
    const lines = m3u8Text.split(/\r?\n/);
    const { commercialRanges } = identifyCommercialSegmentsInM3U8(lines);
    return { commercialRanges, bannerRanges: [] };
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
 * Extracts commercial ad ranges directly from Hls.js fragment objects (zero network latency).
 */
export function extractAllAdRangesFromFragments(fragments: any[]): ParsedAdData {
  try {
    if (!Array.isArray(fragments) || fragments.length === 0) {
      return { commercialRanges: [], bannerRanges: [] };
    }

    // Reconstruct synthetic lines for discontinuity + pattern + keyword analysis
    const syntheticLines: string[] = ['#EXTM3U'];
    let lastCC = fragments[0]?.cc ?? 0;

    for (let i = 0; i < fragments.length; i++) {
      const f = fragments[i];
      if (!f || typeof f !== 'object') continue;
      const cc = typeof f.cc === 'number' ? f.cc : lastCC;
      if (cc !== lastCC) {
        syntheticLines.push('#EXT-X-DISCONTINUITY');
        lastCC = cc;
      }
      const dur = typeof f.duration === 'number' && !isNaN(f.duration) ? f.duration : 0;
      const url =
        typeof f.relurl === 'string' && f.relurl
          ? f.relurl
          : typeof f.url === 'string' && f.url
          ? f.url
          : '';
      if (dur > 0 && url) {
        syntheticLines.push(`#EXTINF:${dur.toFixed(3)},`);
        syntheticLines.push(url);
      }
    }

    const { commercialRanges } = identifyCommercialSegmentsInM3U8(syntheticLines);
    return { commercialRanges, bannerRanges: [] };
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
    if (adRangesCache.size >= 60) {
      const oldestKey = adRangesCache.keys().next().value;
      if (oldestKey) adRangesCache.delete(oldestKey);
    }
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
