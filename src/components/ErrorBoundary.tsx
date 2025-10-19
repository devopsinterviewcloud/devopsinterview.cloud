'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })
    
    // Log error to analytics in production
    if (typeof window !== 'undefined') {
      const w = window as Window & { gtag?: (...args: unknown[]) => void }
      if (w.gtag) {
        w.gtag('event', 'exception', {
          description: error.message,
          fatal: false,
        })
      }
    }
    
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <div className="bg-red-100  p-3 rounded-full">
                <AlertTriangle className="h-12 w-12 text-red-600" aria-hidden="true" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Oops! Something went wrong
              </h2>
              <p className="text-muted-foreground">
                We encountered an unexpected error. This has been logged and our team will investigate.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-muted p-4 rounded-lg text-sm">
                <summary className="cursor-pointer font-medium mb-2">
                  Error Details (Development)
                </summary>
                <pre className="whitespace-pre-wrap text-xs">
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                className="flex items-center gap-2"
                aria-label="Try again"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Try Again
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2"
                aria-label="Go to homepage"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useErrorHandler() {
  const handleError = (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo)

    if (typeof window !== 'undefined') {
      const w = window as Window & { gtag?: (...args: unknown[]) => void }
      if (w.gtag) {
        w.gtag('event', 'exception', {
          description: error.message,
          fatal: false,
        })
      }
    }
  }

  return handleError
}