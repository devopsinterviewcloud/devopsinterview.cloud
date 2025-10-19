import Link from "next/link"
import { Github, Linkedin, Twitter, Youtube, Cloud, Heart, Star, MessageCircle } from "lucide-react"
import { NewsletterSignup } from "@/components/NewsletterSignup"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-t from-slate-50 to-white border-t border-slate-200">
      <div className="container mx-auto px-4 py-16">
        {/* Newsletter Signup */}
        <div className="mb-16">
          <NewsletterSignup />
        </div>
        
        <div className="grid md:grid-cols-4 gap-12">
          {/* Enhanced Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full">
                  <Cloud className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black gradient-text">DevopsInterview.Cloud</h3>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                  ))}
                  <span className="text-xs text-slate-500 ml-2 font-semibold">15,000+ professionals</span>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md leading-relaxed text-lg">
              Master DevOps and Cloud technologies with expert-curated ebooks. 
              Advance your career with comprehensive guides on AWS, Azure, GCP, Kubernetes, and more.
            </p>
            <div className="flex space-x-4">
              <Link 
                href="https://linkedin.com/company/devopsinterviewcloud" 
                className="group relative p-3 bg-blue-100  rounded-xl hover:bg-blue-200  transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
              </Link>
              <Link 
                href="https://twitter.com/devopsinterviewcloud" 
                className="group relative p-3 bg-sky-100  rounded-xl hover:bg-sky-200  transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5 text-sky-600 group-hover:scale-110 transition-transform duration-300" />
              </Link>
              <Link 
                href="https://github.com/devopsinterviewcloud" 
                className="group relative p-3 bg-gray-100  rounded-xl hover:bg-gray-200  transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5 text-foreground group-hover:scale-110 transition-transform duration-300" />
              </Link>
              <Link 
                href="https://www.youtube.com/@DevOpsInterviewCloud/videos" 
                className="group relative p-3 bg-red-100 rounded-xl hover:bg-red-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5 text-red-600 group-hover:scale-110 transition-transform duration-300" />
              </Link>
              <Link 
                href="https://reddit.com/r/devopsinterviewcloud" 
                className="group relative p-3 bg-orange-100 rounded-xl hover:bg-orange-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                aria-label="Reddit"
              >
                <MessageCircle className="h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform duration-300" />
              </Link>
            </div>
          </div>

          {/* Enhanced Quick Links */}
          <div>
            <h4 className="font-bold text-slate-900  mb-6 text-lg">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link href="#ebooks" className="group flex items-center gap-2 text-muted-foreground hover:text-blue-600 transition-all duration-300 font-medium">
                  <div className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                  Ebooks
                </Link>
              </li>
              <li>
                <Link href="#categories" className="group flex items-center gap-2 text-muted-foreground hover:text-blue-600 transition-all duration-300 font-medium">
                  <div className="w-2 h-2 bg-purple-500 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                  Categories
                </Link>
              </li>
              <li>
                <Link href="#interview-prep" className="group flex items-center gap-2 text-muted-foreground hover:text-blue-600 transition-all duration-300 font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                  Interview Prep
                </Link>
              </li>
              <li>
                <Link href="#faq" className="group flex items-center gap-2 text-muted-foreground hover:text-blue-600 transition-all duration-300 font-medium">
                  <div className="w-2 h-2 bg-orange-500 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Enhanced Legal */}
          <div>
            <h4 className="font-bold text-slate-900  mb-6 text-lg">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="group flex items-center gap-2 text-muted-foreground hover:text-blue-600 transition-all duration-300 font-medium">
                  <div className="w-2 h-2 bg-red-500 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="group flex items-center gap-2 text-muted-foreground hover:text-blue-600 transition-all duration-300 font-medium">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="group flex items-center gap-2 text-muted-foreground hover:text-blue-600 transition-all duration-300 font-medium">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/refunds" className="group flex items-center gap-2 text-muted-foreground hover:text-blue-600 transition-all duration-300 font-medium">
                  <div className="w-2 h-2 bg-pink-500 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Enhanced Bottom */}
        <div className="border-t border-slate-200  pt-8 mt-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>© {currentYear} DevopsInterview.Cloud. All rights reserved.</span>
              <div className="flex items-center gap-1">
                <span>Made with</span>
                <Heart className="w-4 h-4 text-red-500 fill-current animate-pulse" />
                <span>for DevOps professionals</span>
              </div>
            </div>
            <div className="flex items-center gap-2 glass-effect px-4 py-2 rounded-full">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="text-sm font-semibold text-foreground">
                Trusted by 15,000+ professionals worldwide
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}