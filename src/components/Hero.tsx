import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, Download, Star } from "lucide-react"

export function Hero() {
  const scrollToEbooks = () => {
    document.getElementById('ebooks')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex items-center gradient-bg overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-blue-400 rounded-full opacity-60 animate-bounce" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-32 right-20 w-3 h-3 bg-purple-400 rounded-full opacity-40 animate-bounce" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute bottom-40 left-20 w-5 h-5 bg-indigo-400 rounded-full opacity-50 animate-bounce" style={{animationDelay: '2.5s'}}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Enhanced Badge */}
          <div className="inline-flex items-center gap-3 glass-effect px-6 py-3 rounded-full text-sm font-semibold mb-8 animate-bounce-in border border-blue-200/50">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
            </div>
            <span className="text-slate-700">Trusted by 15,000+ DevOps professionals worldwide</span>
          </div>

          {/* Enhanced Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight animate-fade-in">
            <span className="text-slate-900">Master DevOps &</span>
            <br />
            <span className="text-slate-900">Cloud Computing with</span>
            <br />
            <span className="gradient-text text-glow">Expert-Curated Ebooks</span>
          </h1>

          {/* Enhanced Subheadline */}
          <p className="text-xl md:text-2xl lg:text-3xl text-slate-600  mb-12 max-w-4xl mx-auto leading-relaxed animate-slide-in font-light">
            Ace your DevOps interviews, pass cloud certifications, and advance your career with comprehensive guides covering
            <span className="font-semibold text-blue-600"> AWS, Azure, GCP, Kubernetes, Docker, Terraform, CI/CD</span>, and more.
          </p>

          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-scale-in">
            <Button 
              size="lg" 
              onClick={scrollToEbooks}
              className="btn-premium group relative overflow-hidden text-lg font-bold px-10 py-5 rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
            >
              <span className="relative z-10 flex items-center gap-3">
                Browse DevOps Ebooks
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => document.getElementById('interview-prep')?.scrollIntoView({ behavior: 'smooth' })}
              className="glass-effect hover:bg-white/80  px-10 py-5 text-lg font-bold rounded-2xl border-2 border-slate-300/50  hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl"
            >
              <span className="flex items-center gap-3">
                <BookOpen className="w-5 h-5" />
                Interview Preparation
              </span>
            </Button>
          </div>

          {/* Enhanced Trust Signals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="card-premium p-8 text-center group stagger-animation">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                  <Download className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <h3 className="font-bold text-xl text-slate-900  mb-2">Instant Download</h3>
              <p className="text-slate-600  font-medium">Get your ebooks immediately after purchase</p>
            </div>

            <div className="card-premium p-8 text-center group stagger-animation">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-violet-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <h3 className="font-bold text-xl text-slate-900  mb-2">Multiple Formats</h3>
              <p className="text-slate-600  font-medium">PDF, EPUB, MOBI for all devices</p>
            </div>

            <div className="card-premium p-8 text-center group stagger-animation">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <h3 className="font-bold text-xl text-slate-900  mb-2">Lifetime Updates</h3>
              <p className="text-slate-600  font-medium">Free updates when content is added</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-8 h-12 border-2 border-slate-400  rounded-full flex justify-center">
          <div className="w-1 h-3 bg-slate-400  rounded-full mt-2 animate-pulse"></div>
        </div>
        <p className="text-xs text-slate-500  mt-2 font-medium">Scroll to explore</p>
      </div>
    </section>
  )
}