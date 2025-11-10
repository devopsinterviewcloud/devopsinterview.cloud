import Image from "next/image";
import ebooksData from "@/data/ebooks.json";
import Script from "next/script";
import EbookPrice from "@/components/EbookPrice";
import { DynamicPriceText } from "@/components/DynamicPriceText";

export default function Home() {
  // Generate structured data for products
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "DevopsInterview.Cloud",
    "url": "https://devopsinterview.cloud",
    "description": "Master DevOps and Cloud technologies with expert-curated ebooks covering AWS, Azure, GCP, Kubernetes, Docker, Terraform, and CI/CD.",
    "publisher": {
      "@type": "Organization",
      "name": "DevopsInterview.Cloud",
      "logo": {
        "@type": "ImageObject",
        "url": "https://devopsinterview.cloud/logo.png"
      }
    }
  };

  const productsData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": ebooksData.map((ebook, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Book",
        "@id": `https://devopsinterview.cloud/ebooks/${ebook.slug}`,
        "name": ebook.title,
        "description": ebook.description,
        "image": `https://devopsinterview.cloud${ebook.coverUrl}`,
        "bookFormat": "EBook",
        "numberOfPages": ebook.pageCount,
        "inLanguage": "en-US",
        "offers": {
          "@type": "Offer",
          "price": ebook.price,
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "url": `https://devopsinterview.cloud/ebooks/${ebook.slug}`,
          "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": ebook.rating,
          "reviewCount": ebook.reviews,
          "bestRating": "5",
          "worstRating": "1"
        },
        "author": {
          "@type": "Organization",
          "name": "DevopsInterview.Cloud"
        },
        "publisher": {
          "@type": "Organization",
          "name": "DevopsInterview.Cloud"
        }
      }
    }))
  };

  return (
    <>
      <Script
        id="structured-data-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Script
        id="structured-data-products"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productsData) }}
      />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation Header */}
      <nav className="sticky top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h5v7l9-11h-5z"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-foreground">DevopsInterview.Cloud</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#ebooks" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Ebooks</a>
              <a href="#categories" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Categories</a>
              <a href="#interview-prep" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Interview Prep</a>
              <a href="#youtube" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">YouTube</a>
              <a href="#ebooks" className="btn-primary">Get Started</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-4 sm:px-6 lg:px-8 text-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="text-center animate-fade-in-up">
            {/* Trust Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold mb-8" style={{color: '#1e40af'}}>
              <svg className="w-4 h-4 mr-2 text-yellow-500 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Trusted by 15,000+ DevOps professionals worldwide
            </div>
            
            {/* Main Headline */}
            <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-8 text-foreground">
              Master DevOps &amp; Cloud
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Interview Success
              </span>
            </h1>

            {/* Value Proposition */}
            <p className="text-xl md:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed text-foreground">
              Expert-curated ebooks covering AWS, Azure, GCP, Kubernetes, Docker, Terraform, CI/CD, and more. 
              Pass certifications, ace interviews, and advance your career with comprehensive guides and practical examples.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20">
              <a href="#ebooks" className="btn-primary text-lg px-10 py-4 inline-flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Get Your First Ebook - Starting at{' '}<DynamicPriceText usdPrice={24.99} />
              </a>
              <a href="#ebooks" className="bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 text-lg px-10 py-4 rounded-xl font-semibold transition-all inline-flex items-center justify-center">
                View All Ebooks
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>

          {/* Trust Signals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Digital Delivery</h3>
              <p className="text-muted-foreground">Delivered within 12-24 hours</p>
            </div>

            <div className="text-center animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">PDF Format</h3>
              <p className="text-muted-foreground">PDF format included</p>
            </div>

            <div className="text-center animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Free Updates</h3>
              <p className="text-muted-foreground">Lifetime content updates</p>
            </div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Featured Ebooks Section */}
      <section id="ebooks" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold mb-6">
              Featured DevOps Ebooks
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-foreground">
              Master DevOps &amp; Cloud Interview Questions
            </h2>
            <p className="text-xl max-w-3xl mx-auto text-muted-foreground">
              Expert-curated guides covering AWS, Azure, GCP, Kubernetes, Docker, Terraform, CI/CD, and more.
              Perfect for DevOps engineers, cloud architects, and SRE professionals preparing for technical interviews.
            </p>
          </div>

          {/* Enhanced Ebook Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {ebooksData.map((ebook, index) => (
              <div key={index} className={`card group animate-fade-in-up ${ebook.isBundle ? 'ring-4 ring-yellow-400 shadow-2xl relative' : ''}`} style={{animationDelay: `${index * 0.1}s`}}>
                {ebook.isBundle && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      ⭐ BEST VALUE - SAVE 50% ⭐
                    </span>
                  </div>
                )}
                <div className="relative aspect-[3/4] rounded-lg mb-6 overflow-hidden bg-gray-100">
                  <Image
                    src={ebook.coverUrl}
                    alt={`${ebook.title} - DevOps ebook cover featuring ${ebook.category} concepts and ${ebook.tags.join(', ')} technologies for ${ebook.pageCount} pages of comprehensive learning`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  {ebook.isFeatured && (
                    <div className="absolute left-3 top-3">
                      <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        Featured
                      </span>
                    </div>
                  )}
                  {ebook.originalPrice && (
                    <div className="absolute right-3 top-3">
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        {Math.round(((ebook.originalPrice - ebook.price) / ebook.originalPrice) * 100)}% OFF
                      </span>
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {ebook.category}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-2 line-clamp-2 text-foreground">
                  {ebook.title}
                </h3>

                <p className="text-sm mb-4 line-clamp-3 text-muted-foreground">
                  {ebook.description}
                </p>

                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">{ebook.rating} ({ebook.reviews} reviews)</span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <EbookPrice
                    usdPrice={ebook.price}
                    originalUsdPrice={ebook.originalPrice}
                  />
                  <span className="text-sm text-muted-foreground">{ebook.pageCount} pages</span>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {ebook.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {tag}
                    </span>
                  ))}
                </div>

                <a href={`/checkout?ebook=${ebook.id}`} className="btn-primary w-full inline-flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Buy Now
                </a>
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="inline-flex flex-col items-center gap-4">
              <button className="btn-primary px-12 py-4 text-lg">
                🎁 Special Bundle Offer: Buy All 5 Books & Save 50%!
              </button>
              <p className="text-sm text-muted-foreground">
                💎 Individual books <DynamicPriceText usdPrice={24.99} /> each • Complete Bundle <DynamicPriceText usdPrice={62.99} /> • PDF format • Prices auto-convert to your currency
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-semibold mb-6">
              Browse by Category
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-foreground">
              Find Your Perfect DevOps Learning Path
            </h2>
            <p className="text-xl max-w-3xl mx-auto text-muted-foreground">
              Comprehensive collections organized by technology and skill level. Whether you're preparing for AWS certification,
              mastering Kubernetes, or diving into infrastructure automation, find the perfect learning path for your career goals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Cloud Certifications",
                description: "Complete certification guides for AWS Solutions Architect, Azure DevOps Engineer, and GCP Cloud Architect with practice exams and hands-on labs.",
                icon: "☁️",
                color: "bg-blue-100 text-blue-700"
              },
              {
                title: "Container Orchestration",
                description: "Master Kubernetes, Docker Swarm, and container management. Covers microservices architecture, service mesh, networking, and production deployment strategies.",
                icon: "📦",
                color: "bg-green-100 text-green-700"
              },
              {
                title: "Infrastructure as Code",
                description: "Automate infrastructure with Terraform, Ansible, CloudFormation, and other IaC tools. Learn provisioning, configuration management, and deployment best practices.",
                icon: "🏗️",
                color: "bg-orange-100 text-orange-700"
              },
              {
                title: "CI/CD Pipelines",
                description: "Build robust deployment pipelines with Jenkins, GitLab CI, GitHub Actions, and Azure DevOps. Covers automated testing, code quality, and release management.",
                icon: "🔄",
                color: "bg-purple-100 text-purple-700"
              },
              {
                title: "Monitoring & Observability",
                description: "Implement comprehensive monitoring with Prometheus, Grafana, ELK Stack, and distributed tracing. Master alerting, logging, and observability strategies.",
                icon: "📊",
                color: "bg-red-100 text-red-700"
              },
              {
                title: "Interview Preparation",
                description: "Comprehensive interview prep covering technical questions, system design, behavioral interviews, salary negotiation, and career advancement strategies.",
                icon: "💼",
                color: "bg-indigo-100 text-indigo-700"
              }
            ].map((category, index) => (
              <div key={index} className="card group hover:shadow-lg transition-all cursor-pointer">
                <div className="p-6">
                  <div className="text-4xl mb-4">{category.icon}</div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{category.title}</h3>
                  <p className="text-muted-foreground">{category.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interview Preparation Section */}
      <section id="interview-prep" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold mb-6">
              Career Advancement
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-foreground">
              Ace Your DevOps &amp; Cloud Interviews
            </h2>
            <p className="text-xl max-w-3xl mx-auto text-muted-foreground">
              Comprehensive interview preparation with 1000+ curated questions, hands-on scenarios, and practical examples.
              Covering system design, troubleshooting, behavioral questions, and salary negotiation strategies to help you land
              senior DevOps, SRE, and cloud architect roles.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="card">
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-foreground">500+ Technical Interview Questions</h3>
                <ul className="space-y-3 text-muted-foreground mb-6">
                  <li>✅ Docker & Kubernetes Container Orchestration</li>
                  <li>✅ CI/CD Jenkins, GitLab, GitHub Actions Pipeline Design</li>
                  <li>✅ AWS, Azure, GCP Cloud Architecture Solutions</li>
                  <li>✅ Terraform, Ansible Infrastructure as Code (IaC)</li>
                  <li>✅ Linux System Administration & Troubleshooting</li>
                  <li>✅ Prometheus, Grafana Monitoring & Observability</li>
                </ul>
                <button className="w-full px-8 py-3 bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed" disabled>Coming Soon</button>
              </div>
            </div>

            <div className="card">
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-foreground">DevOps Pipeline Mastery</h3>
                <ul className="space-y-3 text-muted-foreground mb-6">
                  <li>✅ CI/CD Pipeline Design: Jenkins, GitLab, GitHub Actions</li>
                  <li>✅ Infrastructure as Code: Terraform, Ansible, CloudFormation</li>
                  <li>✅ Container Orchestration: Kubernetes, Docker Swarm, ECS</li>
                  <li>✅ Monitoring & Observability: Prometheus, Grafana, ELK</li>
                  <li>✅ Cloud Architecture: AWS, Azure, GCP Multi-Cloud</li>
                  <li>✅ DevOps Security: DevSecOps, SAST, DAST, Compliance</li>
                </ul>
                <button className="w-full px-8 py-3 bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed" disabled>Coming Soon</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* YouTube Channel Section */}
      <section id="youtube" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-semibold mb-6">
              Free Learning Resources
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-foreground">
              DevOps &amp; Cloud YouTube Channel
            </h2>
            <p className="text-xl max-w-3xl mx-auto text-muted-foreground">
              Get free DevOps and cloud interview tips, tutorials, and career advice through our YouTube channel. 
              Learn from industry experts, get insider interview strategies, and stay updated with the latest technologies.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="card group hover:shadow-lg transition-all">
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">YouTube Channel</h3>
                <p className="text-muted-foreground mb-6">
                  Watch free DevOps and cloud interview tutorials, certification tips for AWS/Azure/GCP, hands-on Kubernetes and Docker demos,
                  Terraform guides, CI/CD pipelines, and real-world troubleshooting scenarios.
                </p>
                <ul className="text-left text-sm text-muted-foreground mb-6 space-y-2">
                  <li>✅ Weekly DevOps & Cloud interview tips</li>
                  <li>✅ Hands-on AWS, Azure, GCP tutorials</li>
                  <li>✅ Kubernetes & Docker deep dives</li>
                  <li>✅ Career advancement strategies</li>
                  <li>✅ Live Q&A sessions with experts</li>
                </ul>
                <a 
                  href="https://www.youtube.com/@DevOpsInterviewCloud/videos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full bg-red-600 hover:bg-red-700 text-white inline-block text-center"
                >
                  Subscribe to Channel
                </a>
              </div>
            </div>

            <div className="card group hover:shadow-lg transition-all">
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">DevOps Podcast</h3>
                <p className="text-muted-foreground mb-6">
                  Listen to interviews with senior DevOps engineers, cloud architects, and SRE professionals sharing their career journeys, 
                  interview experiences, salary negotiations, and expert advice on landing DevOps and cloud roles.
                </p>
                <ul className="text-left text-sm text-muted-foreground mb-6 space-y-2">
                  <li>✅ Expert interviews & career stories</li>
                  <li>✅ DevOps & Cloud industry insights</li>
                  <li>✅ Interview success strategies</li>
                  <li>✅ Salary negotiation tips</li>
                  <li>✅ Technology trend discussions</li>
                </ul>
                <a
                  href="https://www.podbean.com/pw/pbblog-323ju-143aa2b"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full bg-purple-600 hover:bg-purple-700 text-white inline-flex items-center justify-center"
                >
                  Listen to Podcast
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold mb-6">
              Success Stories
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-foreground">
              Trusted by DevOps &amp; Cloud Professionals Worldwide
            </h2>
            <p className="text-xl max-w-3xl mx-auto text-muted-foreground">
              Join over 15,000 DevOps engineers, cloud architects, and SRE professionals who have advanced their careers,
              landed senior roles, and passed major cloud certifications with our expert-curated guides and interview preparation resources.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah Chen",
                role: "Senior DevOps Engineer",
                content: "The AWS Solutions Architect interview questions guide helped me pass my certification and ace my DevOps interview on the first try! The hands-on labs, real-world scenarios, and cloud architecture interview prep were invaluable. Highly recommended for anyone serious about AWS interview preparation.",
                rating: 5,
                avatar: "SC"
              },
              {
                name: "Marcus Williams", 
                role: "Platform Engineering Lead",
                content: "The Kubernetes interview questions and mastery ebook is incredibly comprehensive. It covers everything from basic Kubernetes interview prep to advanced container orchestration interview questions like service mesh, GitOps, and Kubernetes troubleshooting scenarios. Saved me months of scattered research.",
                rating: 5,
                avatar: "MW"
              },
              {
                name: "Elena Rodriguez",
                role: "Site Reliability Engineer", 
                content: "The DevOps interview questions and answers collection is a goldmine! I got promoted to Senior SRE after acing my technical interviews, system design questions, and DevOps troubleshooting scenarios. The detailed explanations, practical examples, and real-world DevOps interview prep made all the difference.",
                rating: 5,
                avatar: "ER"
              }
            ].map((testimonial, index) => (
              <div key={index} className="card">
                <div className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-sm font-semibold mb-6">
              FAQ
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-foreground">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                question: "What formats are the ebooks available in?",
                answer: "All ebooks are delivered in PDF format, professionally designed for technical reading with code syntax highlighting, diagrams, and easy navigation. Compatible with all devices including computers, tablets, and smartphones."
              },
              {
                question: "How long does delivery take?",
                answer: "Digital delivery via email within 12-24 hours after payment confirmation. You'll receive download links directly to your registered email address. No physical shipping involved."
              },
              {
                question: "Do you offer bundle discounts?",
                answer: "Yes! Purchase all 5 comprehensive ebooks as a bundle and save 50%. Individual books are available separately, or get the complete DevOps Mastery Bundle at a significantly discounted price."
              },
              {
                question: "What currencies do you accept?",
                answer: "We support multiple currencies including INR (₹), USD ($), EUR (€), GBP (£), AUD, CAD, and SGD. Prices automatically convert based on your location for a seamless shopping experience."
              },
              {
                question: "Are the ebooks suitable for beginners?",
                answer: "Yes! Our ebooks cover everything from fundamentals to advanced topics. Each book includes step-by-step explanations, real-world examples, hands-on labs, and interview questions suitable for junior to senior engineer levels."
              },
              {
                question: "Do I get free updates?",
                answer: "Absolutely! All purchases include lifetime updates. When we add new content, update existing materials, or release new editions, you'll receive the updated versions completely free of charge."
              },
              {
                question: "What is your refund policy?",
                answer: "All sales are final due to the digital nature of our products. Once you receive the download links, the content cannot be returned. Please review the book descriptions and topics carefully before purchasing."
              },
              {
                question: "Can I purchase for my team?",
                answer: "Yes! We offer team pricing and volume discounts for organizations. Contact us at support@devopsinterview.cloud with the number of licenses needed, and we'll provide a custom quote."
              }
            ].map((faq, index) => (
              <div key={index} className="card">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Advance Your DevOps &amp; Cloud Career?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join 15,000+ professionals mastering cloud technologies, acing technical interviews, and advancing their careers
            with comprehensive guides covering AWS, Azure, GCP, Kubernetes, Terraform, and more.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="#ebooks" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl transition-all inline-flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Start Learning Now -{' '}<DynamicPriceText usdPrice={24.99} />
            </a>
            <a href="/contact" className="bg-purple-600 text-white hover:bg-purple-700 px-8 py-4 text-lg font-semibold rounded-xl transition-all inline-flex items-center justify-center">
              Team Pricing Available
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h5v7l9-11h-5z"/>
                  </svg>
                </div>
                <span className="text-xl font-bold text-white">DevopsInterview.Cloud</span>
              </div>
              <p className="text-white mb-4 max-w-md">
                Master DevOps and Cloud technologies with expert-curated ebooks, comprehensive interview preparation guides,
                and practical tutorials. Advance your career with the most trusted DevOps learning platform.
              </p>
              <p className="text-white mb-6">
                ⭐ Trusted by 15,000+ professionals worldwide
              </p>

              {/* Business Contact Information - Required for Payment Gateway Approval */}
              <div className="mt-6 pt-4 border-t border-slate-800 text-sm space-y-1">
                <p className="font-semibold text-white mb-2">Business Information</p>
                <p className="text-white font-semibold">PROSPERA ENTERPRISES</p>
                <p className="text-white text-xs italic mb-2">DBA: DevOpsInterview.Cloud</p>
                <p className="text-white">
                  <a href="mailto:support@devopsinterview.cloud" className="hover:text-blue-400 transition-colors">
                    Email: support@devopsinterview.cloud
                  </a>
                </p>
                <p className="text-white">Phone: Available upon request via email</p>
                <p className="text-white mt-2">34, Padmavathy Nagar, MMC</p>
                <p className="text-white">Chennai, Tamil Nadu 600051</p>
                <p className="text-white">India</p>
                <p className="text-white mt-2 text-xs">Hours: Monday - Friday, 9 AM - 6 PM IST</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#ebooks" className="text-white hover:text-blue-400 transition-colors">Featured Ebooks</a></li>
                <li><a href="#categories" className="text-white hover:text-blue-400 transition-colors">Browse Categories</a></li>
                <li><a href="#interview-prep" className="text-white hover:text-blue-400 transition-colors">Interview Prep</a></li>
                <li><a href="#youtube" className="text-white hover:text-blue-400 transition-colors">YouTube Channel</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="/privacy" className="text-white hover:text-blue-400 transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="text-white hover:text-blue-400 transition-colors">Terms of Service</a></li>
                <li><a href="/contact" className="text-white hover:text-blue-400 transition-colors">Contact Us</a></li>
                <li><a href="/refunds" className="text-white hover:text-blue-400 transition-colors">Refund Policy</a></li>
                <li><a href="/shipping" className="text-white hover:text-blue-400 transition-colors">Shipping &amp; Delivery</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-white">
                © 2025 PROSPERA ENTERPRISES (DevopsInterview.Cloud). All rights reserved.
              </p>
              <div className="flex items-center gap-2 mt-4 md:mt-0">
                <span className="text-white">Made with ❤️ for the DevOps community</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}