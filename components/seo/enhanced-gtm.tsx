'use client';

import Script from 'next/script';

// Enhanced GTM - SEO event helpers mounted after interaction
export default function EnhancedGTMTracking() {
  return (
    <Script
      id="gtm-enhanced-init"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            if (!window.dataLayer) return;
            var ric = window.requestIdleCallback || function(cb) { setTimeout(cb, 1) };
            window.trackMovieView = function(name, slug) {
              ric(function() {
                window.dataLayer.push({ event: 'movie_view', movie_name: name, movie_slug: slug });
              });
            };
            window.trackSearchQuery = function(query, count) {
              ric(function() {
                window.dataLayer.push({ event: 'search', search_term: query, results_count: count });
              });
            };
            window.trackCategoryView = function(name, slug) {
              ric(function() {
                window.dataLayer.push({ event: 'category_view', category_name: name, category_slug: slug });
              });
            };
          })();
        `,
      }}
    />
  );
}

// Type declarations
declare global {
  interface Window {
    dataLayer: any[];
    trackMovieView: (movieName: string, movieSlug: string) => void;
    trackSearchQuery: (searchQuery: string, resultsCount: number) => void;
    trackCategoryView: (categoryName: string, categorySlug: string) => void;
  }
}