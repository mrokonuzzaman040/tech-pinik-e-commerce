'use client'

import { useEffect } from 'react'
import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals'

interface PerformanceData {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: string
}

// Performance thresholds based on Core Web Vitals
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
}

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS]
  if (!threshold) return 'good'
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

function sendToAnalytics(metric: PerformanceData) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔍 Web Vital: ${metric.name}`)
    console.log(`Value: ${metric.value}ms`)
    console.log(`Rating: ${metric.rating}`)
    console.log(`ID: ${metric.id}`)
    console.groupEnd()
  }

  // Send to analytics service (replace with your analytics provider)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      custom_map: {
        metric_rating: metric.rating,
        metric_delta: metric.delta,
        navigation_type: metric.navigationType,
      },
    })
  }

  // Send to custom analytics endpoint
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    }),
  }).catch(error => {
    console.warn('Failed to send web vitals to analytics:', error)
  })
}

function handleMetric(metric: Metric) {
  const performanceData: PerformanceData = {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType || 'unknown',
  }

  sendToAnalytics(performanceData)
}

// Performance observer for additional metrics
function observePerformance() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return
  }

  // Observe long tasks (> 50ms)
  try {
    const longTaskObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) {
          console.warn(`⚠️ Long task detected: ${entry.duration}ms`, entry)
          
          // Send to analytics
          fetch('/api/analytics/performance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'long-task',
              duration: entry.duration,
              startTime: entry.startTime,
              url: window.location.href,
              timestamp: Date.now(),
            }),
          }).catch(() => {})
        }
      })
    })
    longTaskObserver.observe({ entryTypes: ['longtask'] })
  } catch (error) {
    console.warn('Long task observer not supported:', error)
  }

  // Observe layout shifts
  try {
    const layoutShiftObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: any) => {
        if (entry.value > 0.1) {
          console.warn(`⚠️ Large layout shift detected: ${entry.value}`, entry)
        }
      })
    })
    layoutShiftObserver.observe({ entryTypes: ['layout-shift'] })
  } catch (error) {
    console.warn('Layout shift observer not supported:', error)
  }

  // Observe resource loading
  try {
    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 1000) {
          console.warn(`⚠️ Slow resource loading: ${entry.name} (${entry.duration}ms)`)
        }
      })
    })
    resourceObserver.observe({ entryTypes: ['resource'] })
  } catch (error) {
    console.warn('Resource observer not supported:', error)
  }
}

// Memory usage monitoring
function monitorMemoryUsage() {
  if (typeof window === 'undefined' || !('performance' in window) || !('memory' in (window.performance as any))) {
    return
  }

  const checkMemory = () => {
    const memory = (window.performance as any).memory
    const memoryInfo = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    }

    if (memoryInfo.usagePercentage > 80) {
      console.warn('⚠️ High memory usage detected:', memoryInfo)
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('💾 Memory usage:', {
        used: `${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
        usage: `${memoryInfo.usagePercentage.toFixed(2)}%`,
      })
    }
  }

  // Check memory usage every 30 seconds
  const interval = setInterval(checkMemory, 30000)
  
  // Initial check
  checkMemory()

  return () => clearInterval(interval)
}

// Network information monitoring
function monitorNetworkInfo() {
  if (typeof window === 'undefined' || !('navigator' in window) || !('connection' in navigator)) {
    return
  }

  const connection = (navigator as any).connection
  
  const logNetworkInfo = () => {
    console.log('🌐 Network info:', {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    })
  }

  if (process.env.NODE_ENV === 'development') {
    logNetworkInfo()
  }

  connection.addEventListener('change', logNetworkInfo)
  
  return () => connection.removeEventListener('change', logNetworkInfo)
}

export function PerformanceMonitor() {
  useEffect(() => {
    // Collect Core Web Vitals
    onCLS(handleMetric)
    onINP(handleMetric)
    onFCP(handleMetric)
    onLCP(handleMetric)
    onTTFB(handleMetric)

    // Start additional performance monitoring
    observePerformance()
    const cleanupMemory = monitorMemoryUsage()
    const cleanupNetwork = monitorNetworkInfo()

    // Performance timing information
    if (typeof window !== 'undefined' && window.performance && window.performance.timing) {
      const timing = window.performance.timing
      const navigationStart = timing.navigationStart
      
      const performanceMetrics = {
        domContentLoaded: timing.domContentLoadedEventEnd - navigationStart,
        windowLoad: timing.loadEventEnd - navigationStart,
        domInteractive: timing.domInteractive - navigationStart,
        domComplete: timing.domComplete - navigationStart,
      }

      if (process.env.NODE_ENV === 'development') {
        console.group('📊 Performance Timing')
        Object.entries(performanceMetrics).forEach(([key, value]) => {
          console.log(`${key}: ${value}ms`)
        })
        console.groupEnd()
      }
    }

    // Cleanup function
    return () => {
      cleanupMemory?.()
      cleanupNetwork?.()
    }
  }, [])

  // This component doesn't render anything
  return null
}

// Hook for manual performance tracking
export function usePerformanceTracking() {
  const trackEvent = (eventName: string, duration?: number, metadata?: Record<string, any>) => {
    const data = {
      event: eventName,
      duration,
      metadata,
      url: window.location.href,
      timestamp: Date.now(),
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`📈 Performance event: ${eventName}`, data)
    }

    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {})
  }

  const measureAsync = async function<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      trackEvent(name, duration, { success: true })
      return result
    } catch (error) {
      const duration = performance.now() - start
      trackEvent(name, duration, { success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    }
  }

  return { trackEvent, measureAsync }
}

// Declare global gtag function for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}