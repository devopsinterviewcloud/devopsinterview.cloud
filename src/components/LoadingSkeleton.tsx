'use client'

interface LoadingSkeletonProps {
  type: 'ebook-card' | 'search-results' | 'page-content'
  count?: number
}

export function LoadingSkeleton({ type, count = 1 }: LoadingSkeletonProps) {
  if (type === 'ebook-card') {
    return (
      <div className="space-y-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-card border rounded-lg p-6 animate-pulse">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Cover Image Skeleton */}
              <div className="w-full sm:w-32 h-40 bg-muted rounded-md"></div>
              
              {/* Content Skeleton */}
              <div className="flex-1 space-y-3">
                {/* Title */}
                <div className="h-6 bg-muted rounded w-3/4"></div>
                
                {/* Description */}
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                  <div className="h-4 bg-muted rounded w-4/6"></div>
                </div>
                
                {/* Tags */}
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-16"></div>
                  <div className="h-6 bg-muted rounded w-20"></div>
                  <div className="h-6 bg-muted rounded w-12"></div>
                </div>
                
                {/* Price and Button */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="h-6 bg-muted rounded w-16"></div>
                    <div className="h-4 bg-muted rounded w-12"></div>
                  </div>
                  <div className="h-10 bg-muted rounded w-32"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'search-results') {
    return (
      <div className="space-y-4">
        {/* Search Bar Skeleton */}
        <div className="h-10 bg-muted rounded-md animate-pulse"></div>
        
        {/* Filter Buttons Skeleton */}
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 bg-muted rounded w-20 animate-pulse"></div>
          ))}
        </div>
        
        {/* Results Count Skeleton */}
        <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
        
        {/* Ebook Cards Skeleton */}
        <LoadingSkeleton type="ebook-card" count={3} />
      </div>
    )
  }

  if (type === 'page-content') {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Hero Section Skeleton */}
        <div className="text-center space-y-4">
          <div className="h-12 bg-muted rounded w-3/4 mx-auto"></div>
          <div className="h-6 bg-muted rounded w-1/2 mx-auto"></div>
          <div className="h-10 bg-muted rounded w-40 mx-auto"></div>
        </div>
        
        {/* Content Sections Skeleton */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
              <div className="h-4 bg-muted rounded w-4/6"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return null
}