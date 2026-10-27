import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Hi Phim - Xem Phim HD Online';
    const originName = searchParams.get('origin_name') || '';
    const year = searchParams.get('year') || '';
    const quality = searchParams.get('quality') || 'Full HD';
    const ep = searchParams.get('ep') || '';
    const poster = searchParams.get('poster') || '';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#070b08',
            backgroundImage:
              'radial-gradient(circle at 85% 20%, rgba(32, 214, 107, 0.22) 0%, transparent 45%), radial-gradient(circle at 15% 85%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)',
            padding: '48px 56px',
            fontFamily: 'sans-serif',
            position: 'relative',
          }}
        >
          {/* Subtle Grid / Texture border frame */}
          <div
            style={{
              position: 'absolute',
              inset: '20px',
              border: '1px solid rgba(32, 214, 107, 0.25)',
              borderRadius: '24px',
              pointerEvents: 'none',
            }}
          />

          {/* Left: Movie Poster Card */}
          <div
            style={{
              width: '340px',
              height: '510px',
              borderRadius: '20px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#121814',
              border: '2px solid rgba(32, 214, 107, 0.4)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(32, 214, 107, 0.2)',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={poster}
                alt={title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#20d66b',
                  fontSize: '70px',
                }}
              >
                🎬
              </div>
            )}

            {/* Poster Overlay Badge */}
            {quality && (
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  backgroundColor: 'rgba(0, 0, 0, 0.85)',
                  color: '#20d66b',
                  border: '1px solid rgba(32, 214, 107, 0.6)',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  fontSize: '14px',
                  fontWeight: 900,
                  letterSpacing: '1px',
                }}
              >
                {quality}
              </div>
            )}
          </div>

          {/* Right: Cinema Info Stage */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '510px',
              flex: 1,
              marginLeft: '52px',
            }}
          >
            {/* Top Brand Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(32, 214, 107, 0.15)',
                  border: '1px solid rgba(32, 214, 107, 0.5)',
                  padding: '8px 18px',
                  borderRadius: '999px',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#20d66b',
                  }}
                />
                <span
                  style={{
                    color: '#20d66b',
                    fontSize: '16px',
                    fontWeight: 900,
                    letterSpacing: '2px',
                  }}
                >
                  HI PHIM
                </span>
              </div>
              <span
                style={{
                  color: 'rgba(255, 255, 255, 0.45)',
                  fontSize: '14px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                }}
              >
                RẠP PHIM TRỰC TUYẾN MIỄN PHÍ
              </span>
            </div>

            {/* Middle: Titles & Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h1
                style={{
                  color: '#ffffff',
                  fontSize: title.length > 30 ? '42px' : '52px',
                  fontWeight: 900,
                  lineHeight: 1.15,
                  letterSpacing: '-1px',
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textShadow: '0 4px 24px rgba(0,0,0,0.8)',
                }}
              >
                {title}
              </h1>

              {originName && (
                <p
                  style={{
                    color: '#20d66b',
                    fontSize: '22px',
                    fontWeight: 700,
                    margin: 0,
                    opacity: 0.9,
                    letterSpacing: '0.5px',
                  }}
                >
                  {originName}
                </p>
              )}

              {/* Badges List */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '12px',
                  flexWrap: 'wrap',
                }}
              >
                {year && (
                  <div
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: 'rgba(255, 255, 255, 0.85)',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '14px',
                      fontWeight: 700,
                    }}
                  >
                    Năm {year}
                  </div>
                )}
                {ep && (
                  <div
                    style={{
                      backgroundColor: 'rgba(32, 214, 107, 0.15)',
                      border: '1px solid rgba(32, 214, 107, 0.4)',
                      color: '#20d66b',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '14px',
                      fontWeight: 800,
                    }}
                  >
                    {ep}
                  </div>
                )}
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'rgba(255, 255, 255, 0.85)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '14px',
                    fontWeight: 700,
                  }}
                >
                  Vietsub HD
                </div>
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'rgba(255, 255, 255, 0.85)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '14px',
                    fontWeight: 700,
                  }}
                >
                  Tốc độ cao không giật
                </div>
              </div>
            </div>

            {/* Bottom: Play Action Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: '#20d66b',
                  color: '#000000',
                  padding: '12px 28px',
                  borderRadius: '16px',
                  fontWeight: 900,
                  fontSize: '18px',
                  boxShadow: '0 0 30px rgba(32, 214, 107, 0.45)',
                }}
              >
                <span>▶</span>
                <span>XEM PHIM NGAY</span>
              </div>
              <span
                style={{
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: '15px',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                }}
              >
                hiphim.one
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
        },
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate the image: ${e.message}`, {
      status: 500,
    });
  }
}
