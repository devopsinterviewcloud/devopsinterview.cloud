'use client'

import { useState } from "react"
import { Search, Filter, X } from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"

interface EbookSearchProps {
  onSearch: (query: string) => void
  onFilterCategory: (category: string | null) => void
  onFilterTag: (tag: string | null) => void
  searchQuery: string
  selectedCategory: string | null
  selectedTag: string | null
  categories: string[]
  tags: string[]
  totalResults: number
}

export function EbookSearch({
  onSearch,
  onFilterCategory,
  onFilterTag,
  searchQuery,
  selectedCategory,
  selectedTag,
  categories,
  tags,
  totalResults
}: EbookSearchProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const clearAllFilters = () => {
    onSearch("")
    onFilterCategory(null)
    onFilterTag(null)
  }

  const hasActiveFilters = searchQuery || selectedCategory || selectedTag

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search DevOps ebooks, AWS, Kubernetes, Docker..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Search ebooks"
            role="searchbox"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={isFilterOpen ? "Close filters" : "Open filters"}
          aria-expanded={isFilterOpen}
          aria-controls="filter-panel"
        >
          <Filter className="h-4 w-4" aria-hidden="true" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
              {[searchQuery, selectedCategory, selectedTag].filter(Boolean).length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalResults} {totalResults === 1 ? 'ebook' : 'ebooks'} found
        </p>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Clear all filters"
          >
            <X className="h-4 w-4 mr-1" aria-hidden="true" />
            Clear all
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{searchQuery}"
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => onSearch("")}
              />
            </Badge>
          )}
          {selectedCategory && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category: {selectedCategory}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => onFilterCategory(null)}
              />
            </Badge>
          )}
          {selectedTag && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Tag: {selectedTag}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => onFilterTag(null)}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="border border rounded-lg p-4 bg-muted/30" id="filter-panel" role="region" aria-label="Search filters">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Categories */}
            <fieldset>
              <legend className="font-medium text-foreground mb-3">Categories</legend>
              <div className="space-y-2" role="radiogroup" aria-label="Filter by category">
                {categories.map((category) => (
                  <label key={category} className="flex items-center space-x-2 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-1 rounded">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === category}
                      onChange={() => onFilterCategory(selectedCategory === category ? null : category)}
                      className="form-radio text-blue-600 focus:ring-blue-500"
                      aria-describedby={`category-${category.replace(/\s+/g, '-').toLowerCase()}`}
                    />
                    <span className="text-sm" id={`category-${category.replace(/\s+/g, '-').toLowerCase()}`}>{category}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Tags */}
            <fieldset>
              <legend className="font-medium text-foreground mb-3">Technologies</legend>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by technology tags">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    className="cursor-pointer hover:bg-blue-100  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    onClick={() => onFilterTag(selectedTag === tag ? null : tag)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedTag === tag}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onFilterTag(selectedTag === tag ? null : tag)
                      }
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      )}
    </div>
  )
}