'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Mail, CheckCircle, AlertCircle } from "lucide-react"

export function NewsletterSignup() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setStatus("error")
      setMessage("Please enter your email address")
      return
    }

    if (!email.includes("@")) {
      setStatus("error")
      setMessage("Please enter a valid email address")
      return
    }

    setStatus("loading")
    
    try {
      // Simple API call to store newsletter signup
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setStatus("success")
        setMessage("Thanks for subscribing! You'll receive our latest DevOps insights.")
        setEmail("")
      } else {
        setStatus("error")
        setMessage("Something went wrong. Please try again.")
      }
    } catch {
      setStatus("error")
      setMessage("Something went wrong. Please try again.")
    }
  }

  if (status === "success") {
    return (
      <div className="bg-green-50  border border-green-200  rounded-lg p-6 text-center">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-800  mb-2">
          Successfully Subscribed!
        </h3>
        <p className="text-green-700">
          {message}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-100 p-2 rounded-full">
          <Mail className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Stay Updated</h3>
          <p className="text-sm text-muted-foreground">Get latest DevOps insights and new ebook releases</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-3 py-2 border border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={status === "loading"}
          />
          <Button 
            type="submit" 
            disabled={status === "loading"}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {status === "loading" ? "Subscribing..." : "Subscribe"}
          </Button>
        </div>
        
        {status === "error" && (
          <div className="flex items-center gap-2 text-red-600  text-sm">
            <AlertCircle className="h-4 w-4" />
            {message}
          </div>
        )}
        
        <p className="text-xs text-muted-foreground">
          No spam, unsubscribe anytime. We respect your privacy.
        </p>
      </form>
    </div>
  )
}