export default function WatchLoading() {
  return (
    <div className="w-full min-h-screen bg-black pt-20 px-4 md:px-8 py-8 animate-in fade-in duration-500">
      <div className="max-w-[1450px] mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8">
        
        {/* Main Content Area */}
        <div className="flex-1 w-full lg:w-[70%] flex flex-col gap-6">
          {/* Video Player Skeleton */}
          <div className="w-full aspect-video bg-zinc-900/50 rounded-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-primary/50 animate-spin" />
            </div>
          </div>
          
          {/* Movie Details Skeleton */}
          <div className="w-full bg-zinc-900/40 rounded-2xl border border-white/5 p-6 space-y-6">
            <div className="space-y-3">
              <div className="h-10 w-3/4 bg-white/5 rounded-lg skeleton-shimmer relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
              </div>
              <div className="h-6 w-1/3 bg-white/5 rounded-md skeleton-shimmer relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="h-8 w-24 bg-white/5 rounded-full skeleton-shimmer relative overflow-hidden" />
              <div className="h-8 w-24 bg-white/5 rounded-full skeleton-shimmer relative overflow-hidden" />
              <div className="h-8 w-16 bg-white/5 rounded-full skeleton-shimmer relative overflow-hidden" />
            </div>
            
            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="h-4 w-full bg-white/5 rounded skeleton-shimmer relative overflow-hidden" />
              <div className="h-4 w-[90%] bg-white/5 rounded skeleton-shimmer relative overflow-hidden" />
              <div className="h-4 w-[95%] bg-white/5 rounded skeleton-shimmer relative overflow-hidden" />
              <div className="h-4 w-[60%] bg-white/5 rounded skeleton-shimmer relative overflow-hidden" />
            </div>
          </div>
        </div>

        {/* Sidebar Space Skeleton */}
        <div className="w-full lg:w-[30%] min-w-[300px] xl:min-w-[380px] bg-zinc-900/40 rounded-2xl border border-white/5 p-5">
          <div className="h-6 w-1/2 bg-white/5 rounded-md mb-6 skeleton-shimmer relative overflow-hidden" />
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex gap-3 items-center">
                <div className="w-12 h-10 bg-white/5 rounded-md skeleton-shimmer relative overflow-hidden" />
                <div className="flex-1 h-10 bg-white/5 rounded-md skeleton-shimmer relative overflow-hidden" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
