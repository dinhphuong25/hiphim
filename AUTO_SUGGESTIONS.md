# Auto Search Suggestions - Features Documentation

## 🔍 Auto Search Suggestions Components

This document details all the new auto-suggestion components added to the Phimánh movie website.

---

## 1. 📝 Search AutoComplete Component

### Location
`components/search/search-autocomplete.tsx`

### Features
✅ **Real-Time Search Suggestions**
- Debounced API calls (300ms) for performance
- Movies with thumbnails, year, quality, episode info
- Category suggestions with icons
- Keyboard navigation (Arrow keys, Enter, Escape)
- Cache system to avoid duplicate API calls

✅ **Trending Searches**
- Quick access to popular searches
- One-click trending search activation
- Default trending: "Tình yêu", "Hành động", "Hoạt ảnh", etc.

✅ **UI Features**
- Loading spinner while fetching
- Search icon indicator
- Rounded dropdown with smooth animations
- Mobile-responsive design
- Touch-friendly interface

✅ **Smart Navigation**
- Arrow Up/Down to navigate results
- Enter to select highlighted item
- Escape to close
- Click any suggestion to navigate

### Usage Example
```tsx
<SearchAutoComplete
  categories={categories}
  maxResults={8}
  onSuggestionSelect={(suggestion) => {
    if (suggestion.type === "movie") {
      router.push(`/watch?slug=${suggestion.slug}`);
    }
  }}
/>
```

### Cache System
- Stores up to 20 search queries
- Prevents redundant API calls
- Automatically cleared when component unmounts

---

## 2. 🔥 Trending Suggestions Component

### Location
`components/search/trending-suggestions.tsx`

### Features
✅ **Trending Movies Display**
- Fetches hot/trending movies based on view count
- Tab switching: "Trending" vs "Hot" modes
- Responsive grid: 2, 3, 4, 6, 8 columns
- Animated staggered entrance

✅ **Performance**
- Lazy loads on mount
- Shows skeleton loading state
- Error handling with graceful fallback
- Uses optimized API filtering

✅ **UI/UX**
- Red/orange gradient accent
- Tab selector with active state
- Movie cards with hover effects
- Real-time animation delays

### Usage Example
```tsx
<TrendingSuggestions 
  limit={8}
  title="🔥 Phim Hot Nhất"
/>
```

### API Integration
```typescript
api.getFilteredList({
  typeList: "phim-bo",
  sortField: "view",
  sortType: "desc",
  limit: 8
})
```

---

## 3. 📂 Category Suggestions Component

### Location
`components/search/category-suggestions.tsx`

### Features
✅ **Category Grid Display**
- Shows 6 categories by default (configurable)
- Color-coded boxes with gradients
- Emoji icons for visual recognition
- Hover animations and scale effects

✅ **Category Icons**
Auto-mapped emojis for popular categories:
- 🔥 Action (hành động)
- 💕 Romance (tình cảm)
- 😂 Comedy (hài hước)
- 👻 Horror (kinh dị)
- 🗺️ Adventure (phiêu lưu)
- 🚀 Sci-Fi (khoa học viễn tưởng)
- 🧠 Psychology (tâm lý)
- 🔍 Crime (tội phạm)
- 🎨 Anime
- 📺 Series (phim bộ)
- 🎬 Movie (phim lẻ)

✅ **Hover Effects**
- Glowing border effect
- Scale up animation
- Arrow indicator appears
- Background shimmer effect

✅ **Responsive Design**
- 2 columns on mobile
- 3 columns on tablet
- 6 columns on desktop

### Usage Example
```tsx
<CategorySuggestions 
  categories={categoriesArray}
  limit={6}
  title="📂 Khám Phá Thể Loại"
/>
```

---

## 4. 💡 Personalized Suggestions Component

### Location
`components/search/personalized-suggestions.tsx`

### Features
✅ **Watch History Analysis**
- Analyzes recently watched movies from cookies
- Extracts primary category from last watched
- Fetches similar movies from that category

✅ **Smart Fallback**
- Falls back to trending if no watch history
- Handles API errors gracefully
- Shows loading skeleton while fetching

✅ **UI Indicators**
- Shows "Dựa trên lịch sử xem" badge
- Cyan/blue gradient accent
- Animated entrance with stagger effect
- Responsive grid layout

✅ **Data Storage**
- Uses browser cookies for watch history
- 30-day expiry for stored data
- Stores last 10 watched movies

### Usage Example
```tsx
<PersonalizedSuggestions 
  limit={6}
  title="💡 Dành Cho Bạn"
/>
```

### Smart Logic Flow
```
1. Get recently watched from cookies
2. Fetch details of last watched movie
3. Extract its primary category
4. Fetch movies from same category
5. Filter out current movie
6. Display results (or fallback to trending)
```

---

## 5. 🔗 Integration Points

### Header Component
- Imports `SearchAutoComplete`
- Integrated in search modal
- Replaced old search suggestion system
- Shows trending searches when input empty

### Homepage (HomeClient)
- Displays `PersonalizedSuggestions` section
- Shows `TrendingSuggestions` section  
- Shows `CategorySuggestions` section
- Positioned strategically between sections:
  1. Hero Section
  2. New Updates
  3. **→ Personalized Suggestions**
  4. **→ Trending Suggestions**
  5. Recently Watched
  6. **→ Category Suggestions**
  7. Topic Sections

---

## 6. 🎯 User Experience Enhancements

### Search Flow
```
User opens search
    ↓
SearchAutoComplete component loads
    ↓
User types query (with debounce)
    ↓
Real-time suggestions appear with:
  - Movies (with thumbnails)
  - Categories
  - Trending searches
    ↓
User selects suggestion
    ↓
Navigation to movie/category
    ↓
No search history needed
```

### Homepage Discovery
```
User lands on homepage
    ↓
Sees personalized suggestions
(based on watch history)
    ↓
Sees trending hot movies
    ↓
Recently watched section
    ↓
Category buttons for exploration
    ↓
Topic sections for browsing
```

---

## 7. 🚀 Performance Optimizations

✅ **Debouncing**
- Search requests debounced 300ms
- Prevents excessive API calls
- Reduces server load

✅ **Caching**
- Search results cached client-side
- Map-based cache storage
- Memory efficient with automatic cleanup

✅ **Lazy Loading**
- Components load only when needed
- Skeleton loaders while fetching
- Graceful error handling

✅ **Responsive Images**
- Images optimized with CDN parameters
- Lazy-loaded poster thumbnails
- Blur placeholders for smooth UX

---

## 8. 📱 Mobile Responsiveness

All components fully responsive:
- ✅ Touch-friendly tap targets
- ✅ Vertical layout on mobile
- ✅ Horizontal scrolling on small grids
- ✅ Large enough buttons (44px minimum)
- ✅ Proper spacing and padding

---

## 9. ♿ Accessibility

- ✅ Keyboard navigation support
- ✅ ARIA labels for screen readers
- ✅ Semantic HTML structure
- ✅ Color contrast compliance
- ✅ Focus indicators visible

---

## 10. 🎨 Styling Features

### CSS Classes Used
```css
.animate-fade-in-scale      /* Smooth scale entrance */
.animate-shimmer            /* Loading effect */
.hover-lift                /* Hover elevation */
.glass-effect               /* Frosted glass look */
.transition-smooth          /* Smooth transitions */
.backdrop-blur-sm           /* Background blur */
```

### Color Palette
- **Primary**: Rose/Pink (#e11d48)
- **Accents**: Blue, Purple, Red, Orange, Green, Amber, Cyan
- **Dark**: #000000 with white rgba overlays
- **Backgrounds**: #1a1a1a / #0a0a0a

---

## 11. 🔧 Configuration

### Customizable Props

**SearchAutoComplete**
```typescript
interface SearchAutoCompleteProps {
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  categories?: any[];
  maxResults?: number;  // Default: 8
}
```

**TrendingSuggestions**
```typescript
interface TrendingSuggestionsProps {
  limit?: number;      // Default: 8
  title?: string;      // Default: "🔥 Phim Hot Nhất"
}
```

**CategorySuggestions**
```typescript
interface CategorySuggestionsProps {
  categories: Category[];
  limit?: number;      // Default: 6
  title?: string;      // Default: "📂 Khám Phá Thể Loại"
}
```

**PersonalizedSuggestions**
```typescript
interface PersonalizedSuggestionsProps {
  limit?: number;      // Default: 6
  title?: string;      // Default: "💡 Dành Cho Bạn"
}
```

---

## 12. 📊 API Methods Used

```typescript
// PhimApi methods utilized:
api.search(query, page)                    // SearchAutoComplete
api.getFilteredList(params)               // TrendingSuggestions
api.byCategory(slug, page)                // PersonalizedSuggestions
api.get(slug)                             // PersonalizedSuggestions detail

// Browser APIs:
localStorage                   // Rating storage
Cookies (js-cookie)           // Watch history
Performance API               // Monitoring
PerformanceObserver           // Metrics
```

---

## 13. 🐛 Error Handling

All components include:
- ✅ Try-catch blocks for API calls
- ✅ Graceful fallbacks
- ✅ Skeleton loaders during errors
- ✅ Console error logging (dev only)
- ✅ Silent failures for non-critical features

---

## 14. 🧪 Testing Checklist

- [ ] Search autocomplete works with keyboard nav
- [ ] Trending suggestions load and display
- [ ] Categories show with proper icons
- [ ] Personalized suggestions work with watch history
- [ ] Mobile layout is responsive
- [ ] All links navigate correctly
- [ ] Loading states appear and disappear
- [ ] Caching prevents duplicate API calls
- [ ] Debouncing limits requests
- [ ] No console errors

---

## 15. 🚀 Future Enhancements

1. **Advanced Analytics**
   - Track suggestion clicks
   - Measure conversion rates
   - Optimize suggestions based on data

2. **Machine Learning**
   - Implement recommendation algorithm
   - Personalized scoring
   - Trending prediction

3. **Social Features**
   - Popular among friends
   - Trending in region
   - User ratings influence

4. **Performance**
   - Server-side caching
   - CDN for static suggestions
   - Progressive loading

---

## 📝 Notes

- All components follow React best practices
- TypeScript types properly defined
- Mobile-first responsive design
- Dark theme optimized
- No external UI library dependencies
- Uses existing shadcn/ui components where applicable

---

Generated: April 2026
Version: 2.1 (Auto Suggestions Release)
