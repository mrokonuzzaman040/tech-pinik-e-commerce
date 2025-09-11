'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * Logo component for TechPinik application
 * Automatically handles background removal and clean rendering
 * 
 * @param width - Logo width in pixels (default: 120)
 * @param height - Logo height in pixels (default: 40)
 * @param className - Additional CSS classes
 * @param priority - Next.js Image priority loading (default: false)
 * @param variant - Logo variant: 'light' for light backgrounds, 'dark' for dark backgrounds, 'auto' for responsive (default: 'auto')
 */
interface LogoProps {
  width?: number
  height?: number
  className?: string
  priority?: boolean
  variant?: 'light' | 'dark' | 'auto'
}

export function Logo({ 
  width = 120, 
  height = 40, 
  className = '', 
  priority = false,
  variant = 'auto'
}: LogoProps) {
  const getLogoStyles = () => {
    switch (variant) {
      case 'light':
        return 'logo-clean'
      case 'dark':
        return 'logo-clean-dark'
      case 'auto':
      default:
        return 'logo-clean dark:logo-clean-dark'
    }
  }

  return (
    <div className="relative">
      <Image
        src="/logo.jpeg"
        alt="TechPinik Logo"
        width={width}
        height={height}
        className={cn(
          "w-auto object-contain",
          getLogoStyles(),
          className
        )}
        priority={priority}
        style={{
          filter: 'drop-shadow(0 0 0 transparent)',
          background: 'transparent'
        }}
      />
    </div>
  )
}