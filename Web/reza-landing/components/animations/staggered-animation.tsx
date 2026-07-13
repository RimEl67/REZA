"use client"

import type React from "react"

import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import type { ReactNode } from "react"

interface StaggeredAnimationProps {
  children: ReactNode[]
  animation?: "slideUp" | "slideDown" | "slideLeft" | "slideRight" | "fadeIn" | "scaleIn"
  staggerDelay?: number
  mobileStaggerDelay?: number
  duration?: number
  className?: string
  triggerOnce?: boolean
}

export default function StaggeredAnimation({
  children,
  animation = "slideUp",
  staggerDelay = 100,
  mobileStaggerDelay,
  duration = 600,
  className,
  triggerOnce = false,
}: StaggeredAnimationProps) {
  const { ref, isVisible } = useScrollAnimation({ triggerOnce })

  const getAnimationClasses = (index: number) => {
    const baseClasses = "transition-all ease-out"

    if (!isVisible) {
      switch (animation) {
        case "slideUp":
          return `${baseClasses} transform translate-y-8 opacity-0`
        case "slideDown":
          return `${baseClasses} transform -translate-y-8 opacity-0`
        case "slideLeft":
          return `${baseClasses} transform translate-x-8 opacity-0`
        case "slideRight":
          return `${baseClasses} transform -translate-x-8 opacity-0`
        case "fadeIn":
          return `${baseClasses} opacity-0`
        case "scaleIn":
          return `${baseClasses} transform scale-95 opacity-0`
        default:
          return `${baseClasses} transform translate-y-8 opacity-0`
      }
    }

    return `${baseClasses} transform translate-y-0 translate-x-0 scale-100 opacity-100`
  }

  const getStaggerDelay = (index: number) => {
    // Use mobile delay if provided and screen is small, otherwise use regular delay
    const effectiveDelay =
      mobileStaggerDelay !== undefined && typeof window !== "undefined" && window.innerWidth < 768
        ? mobileStaggerDelay
        : staggerDelay
    return index * effectiveDelay
  }

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={getAnimationClasses(index)}
          style={{
            transitionDelay: `${getStaggerDelay(index)}ms`,
            transitionDuration: `${duration}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
