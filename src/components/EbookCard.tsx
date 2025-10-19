import Image from "next/image"
import { CardContent, CardFooter } from "./ui/card"
import { Button } from "./ui/button"
import { Star, Download, BookOpen, Clock } from "lucide-react"
// Simple price formatting
const formatPrice = (price: number) => `$${price.toFixed(2)}`

interface EbookCardProps {
  ebook: {
    id: string
    slug: string
    title: string
    description: string
    price: number
    originalPrice?: number | null
    coverUrl: string
    format: string[]
    pageCount?: number | null
    fileSize: string
    tags: string[]
    isFeatured: boolean
  }
  onPurchase: (ebookId: string) => void
  isLoading?: boolean
}

export function EbookCard({ ebook, onPurchase, isLoading = false }: EbookCardProps) {
  const hasDiscount = ebook.originalPrice && ebook.originalPrice > ebook.price

  return (
    <div className="card-premium group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 animate-scale-in">
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-2xl">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
        
        <Image
          src={ebook.coverUrl}
          alt={ebook.title}
          fill
          className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Enhanced Badges */}
        {ebook.isFeatured && (
          <div className="absolute left-3 top-3 z-20">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              Featured
            </div>
          </div>
        )}
        
        {hasDiscount && (
          <div className="absolute right-3 top-3 z-20">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse">
              {Math.round(((ebook.originalPrice! - ebook.price) / ebook.originalPrice!) * 100)}% OFF
            </div>
          </div>
        )}
        
        {/* Quick Preview Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
          <Button 
            size="sm" 
            className="glass-effect border-white/30 text-white hover:bg-white/20 shadow-xl"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Quick Preview
          </Button>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="font-bold text-xl leading-tight mb-3 line-clamp-2 text-slate-900  group-hover:text-blue-600  transition-colors duration-300">
            {ebook.title}
          </h3>
          <p className="text-slate-600  line-clamp-3 leading-relaxed">
            {ebook.description}
          </p>
        </div>

        <div className="space-y-4">
          {/* Format Badges */}
          <div className="flex flex-wrap gap-2">
            {ebook.format.slice(0, 3).map((format) => (
              <div key={format} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                {format}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-slate-500">
            {ebook.pageCount && (
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span className="font-medium">{ebook.pageCount} pages</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              <span className="font-medium">{ebook.fileSize}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {ebook.tags.slice(0, 3).map((tag) => (
              <div key={tag} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium border border-slate-200">
                {tag}
              </div>
            ))}
          </div>

          {/* Rating Stars */}
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
            ))}
            <span className="text-sm text-slate-500  ml-2 font-medium">5.0 (142 reviews)</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <div className="w-full space-y-4">
          {/* Price Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-black text-2xl text-slate-900">
                {formatPrice(ebook.price)}
              </span>
              {hasDiscount && (
                <div className="flex flex-col">
                  <span className="text-sm text-slate-500  line-through">
                    {formatPrice(ebook.originalPrice!)}
                  </span>
                  <span className="text-xs text-red-600  font-semibold">
                    Save ${(ebook.originalPrice! - ebook.price).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Instant Access</span>
            </div>
          </div>
          
          {/* Enhanced Buy Button */}
          <Button 
            onClick={() => onPurchase(ebook.id)}
            className="w-full btn-premium h-12 text-base font-bold group relative overflow-hidden"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 relative z-10">
                <Download className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform duration-300" />
                <span>Buy Now - Instant Download</span>
              </div>
            )}
          </Button>
          
          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>30-Day Guarantee</span>
            </div>
          </div>
        </div>
      </CardFooter>
    </div>
  )
}