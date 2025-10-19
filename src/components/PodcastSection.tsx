import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Headphones, Clock, Calendar } from "lucide-react"

interface Episode {
  id: string
  title: string
  description: string
  duration: string
  publishedAt: string
  embedUrl?: string
}

const featuredEpisodes: Episode[] = [
  {
    id: "1",
    title: "The Psychology of High Performance",
    description: "Discover the mental frameworks used by top performers to achieve extraordinary results in business and life.",
    duration: "32 min",
    publishedAt: "2024-01-15",
  },
  {
    id: "2", 
    title: "Building Habits That Stick",
    description: "Science-backed strategies for creating lasting behavioral change and breaking bad habits permanently.",
    duration: "28 min",
    publishedAt: "2024-01-08",
  },
  {
    id: "3",
    title: "The Future of Remote Work",
    description: "How leaders are adapting to distributed teams and the tools that make remote work actually work.",
    duration: "35 min",
    publishedAt: "2024-01-01",
  },
]

export function PodcastSection() {
  return (
    <section id="podcast" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 ">
              <Headphones className="w-4 h-4 mr-2" />
              Podcast
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900  mb-4">
              Listen & Learn On The Go
            </h2>
            <p className="text-lg text-gray-600  max-w-2xl mx-auto">
              Dive deeper into the concepts from our books with expert interviews, 
              case studies, and actionable insights you can apply immediately.
            </p>
          </div>

          {/* Featured Player */}
          <div className="mb-12">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-white/20 p-3 rounded-full">
                      <Play className="w-6 h-6" />
                    </div>
                    <div>
                      <Badge className="bg-white/20 text-white border-0 mb-2">
                        Latest Episode
                      </Badge>
                      <h3 className="text-xl font-semibold">
                        {featuredEpisodes[0].title}
                      </h3>
                    </div>
                  </div>
                  
                  <p className="text-white/90 mb-6 max-w-2xl">
                    {featuredEpisodes[0].description}
                  </p>

                  {/* Mock Audio Player */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <Button size="sm" className="bg-white text-purple-600 hover:bg-white/90">
                        <Play className="w-4 h-4" />
                      </Button>
                      <div className="flex-1">
                        <div className="bg-white/20 h-2 rounded-full">
                          <div className="bg-white h-2 rounded-full w-1/3"></div>
                        </div>
                      </div>
                      <div className="text-sm text-white/80 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {featuredEpisodes[0].duration}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Episode List */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {featuredEpisodes.map((episode, index) => (
              <Card key={episode.id} className="group hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="bg-purple-100  p-2 rounded-full group-hover:bg-purple-200  transition-colors">
                      <Play className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <Badge variant="outline" className="text-xs mb-2">
                        Episode {index + 1}
                      </Badge>
                      <h4 className="font-semibold text-gray-900  mb-2 leading-tight">
                        {episode.title}
                      </h4>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600  mb-4 line-clamp-3">
                    {episode.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(episode.publishedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {episode.duration}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button size="lg" variant="outline">
              View All Episodes
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}