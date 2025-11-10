'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Cloud, Menu, X, Sparkles } from "lucide-react"
import CurrencySelector from "@/components/CurrencySelector"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const navLinks = [
    { href: "#ebooks", label: "Ebooks" },
    { href: "#categories", label: "Categories" },
    { href: "#interview-prep", label: "Interview Prep" },
    { href: "#faq", label: "FAQ" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full glass-effect border-b border-slate-200/50">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Enhanced Logo */}
          <div className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-full">
                <Cloud className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black gradient-text">DevopsInterview.Cloud</span>
              <span className="text-xs text-slate-500  font-medium">Master DevOps & Cloud</span>
            </div>
          </div>
          
          {/* Enhanced Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8" aria-label="Main navigation">
            {navLinks.map((link) => (
              <a 
                key={link.href}
                href={link.href} 
                className="relative text-sm font-semibold text-slate-600  hover:text-blue-600  transition-all duration-300 px-3 py-2 rounded-lg hover:bg-blue-50  group"
              >
                <span className="relative z-10">{link.label}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </a>
            ))}
          </nav>

          {/* Enhanced Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <CurrencySelector />
            <Button size="lg" className="btn-premium group relative overflow-hidden px-6 py-3 font-bold">
              <span className="relative z-10 flex items-center gap-2">
                <Sparkles className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                Start Learning
              </span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </Button>
          </div>
        </div>

        {/* Enhanced Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden glass-effect border-t border-slate-200/50  animate-slide-in" id="mobile-menu">
            <nav className="flex flex-col space-y-2 px-4 py-6" aria-label="Mobile navigation">
              {navLinks.map((link, index) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-semibold text-slate-600  hover:text-blue-600  transition-all duration-300 px-4 py-3 rounded-xl hover:bg-blue-50  stagger-animation"
                  onClick={() => setIsMenuOpen(false)}
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4">
                <Button 
                  size="lg" 
                  className="btn-premium w-full font-bold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Start Learning
                  </span>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}