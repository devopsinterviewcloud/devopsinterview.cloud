import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Quote } from "lucide-react"
import Image from "next/image"

interface TestimonialCardProps {
  testimonial: {
    id: string
    name: string
    role: string
    company?: string
    avatar: string
    content: string
    rating: number
    bookPurchased?: string
  }
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        {/* Quote Icon */}
        <div className="mb-4">
          <div className="bg-blue-100 p-2 rounded-full w-fit">
            <Quote className="w-4 h-4 text-blue-600" />
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < testimonial.rating
                  ? "text-yellow-400 fill-current"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <blockquote className="text-gray-700 mb-6 leading-relaxed">
          "{testimonial.content}"
        </blockquote>

        {/* Book Reference */}
        {testimonial.bookPurchased && (
          <Badge variant="secondary" className="mb-4 text-xs">
            Purchased: {testimonial.bookPurchased}
          </Badge>
        )}

        {/* Author */}
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden">
            <Image
              src={testimonial.avatar}
              alt={testimonial.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {testimonial.name}
            </div>
            <div className="text-sm text-gray-600">
              {testimonial.role}
              {testimonial.company && (
                <span className="text-gray-400">
                  {" "}at {testimonial.company}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}