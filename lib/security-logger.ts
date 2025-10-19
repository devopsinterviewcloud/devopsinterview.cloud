interface SecurityEvent {
  type: 'rate_limit' | 'auth_failure' | 'suspicious_activity' | 'api_access' | 'error'
  timestamp: string
  ip?: string
  userAgent?: string
  path?: string
  method?: string
  details?: Record<string, unknown>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

class SecurityLogger {
  private events: SecurityEvent[] = []
  private maxEvents = 1000 // Keep last 1000 events in memory

  log(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    }

    // Add to in-memory storage
    this.events.push(securityEvent)
    
    // Keep only the last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Console logging with appropriate level
    const logLevel = this.getLogLevel(event.severity)
    const message = `[SECURITY] ${event.type.toUpperCase()}: ${JSON.stringify(securityEvent)}`

    // eslint-disable-next-line no-console
    console[logLevel](message)

    // In production, you would send to external monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(securityEvent)
    }
  }

  private getLogLevel(severity: SecurityEvent['severity']): 'log' | 'warn' | 'error' {
    switch (severity) {
      case 'low': return 'log'
      case 'medium': return 'warn'
      case 'high':
      case 'critical': return 'error'
      default: return 'log'
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async sendToMonitoringService(_event: SecurityEvent) {
    // Placeholder for external monitoring service integration
    // Examples: DataDog, New Relic, Sentry, CloudWatch, etc.
    try {
      // Example integration:
      // await fetch('https://api.monitoring-service.com/events', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(_event)
      // })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to send security event to monitoring service:', error)
    }
  }

  getRecentEvents(limit = 50): SecurityEvent[] {
    return this.events.slice(-limit)
  }

  getEventsByType(type: SecurityEvent['type'], limit = 20): SecurityEvent[] {
    return this.events
      .filter(event => event.type === type)
      .slice(-limit)
  }

  getEventsBySeverity(severity: SecurityEvent['severity'], limit = 20): SecurityEvent[] {
    return this.events
      .filter(event => event.severity === severity)
      .slice(-limit)
  }

  // Security metrics
  getMetrics(hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
    const recentEvents = this.events.filter(event => event.timestamp >= since)

    return {
      totalEvents: recentEvents.length,
      eventsByType: recentEvents.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      eventsBySeverity: recentEvents.reduce((acc, event) => {
        acc[event.severity] = (acc[event.severity] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      topIPs: this.getTopIPs(recentEvents),
      suspiciousActivity: recentEvents.filter(e => 
        e.severity === 'high' || e.severity === 'critical'
      ).length
    }
  }

  private getTopIPs(events: SecurityEvent[]): Array<{ip: string, count: number}> {
    const ipCounts = events
      .filter(event => event.ip)
      .reduce((acc, event) => {
        const ip = event.ip!
        acc[ip] = (acc[ip] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    return Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }
}

export const securityLogger = new SecurityLogger()

// Helper functions for common security events
export const logRateLimit = (ip: string, path: string) => {
  securityLogger.log({
    type: 'rate_limit',
    severity: 'medium',
    ip,
    path,
    details: { reason: 'Rate limit exceeded' }
  })
}

export const logAuthFailure = (ip: string, userAgent: string, details?: Record<string, unknown>) => {
  securityLogger.log({
    type: 'auth_failure',
    severity: 'high',
    ip,
    userAgent,
    details
  })
}

export const logSuspiciousActivity = (
  ip: string, 
  path: string, 
  reason: string, 
  severity: SecurityEvent['severity'] = 'high'
) => {
  securityLogger.log({
    type: 'suspicious_activity',
    severity,
    ip,
    path,
    details: { reason }
  })
}

export const logApiAccess = (
  method: string,
  path: string,
  ip: string,
  userAgent: string,
  statusCode?: number
) => {
  securityLogger.log({
    type: 'api_access',
    severity: 'low',
    method,
    path,
    ip,
    userAgent,
    details: { statusCode }
  })
}

export const logSecurityError = (error: Error, context?: Record<string, unknown>) => {
  securityLogger.log({
    type: 'error',
    severity: 'high',
    details: {
      message: error.message,
      stack: error.stack,
      ...context
    }
  })
}