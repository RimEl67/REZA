"use client"

import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface AnimatedElementProps {
  children: ReactNode
  animation?: "slideUp" | "slideDown" | "slideLeft" | "slideRight" | "fadeIn" | "flipUp" | "scaleIn" | "rotateIn"
  delay?: number
  duration?: number
  className?: string
  triggerOnce?: boolean
}

export default function AnimatedElement({
  children,
  animation = "slideUp",
  delay = 0,
  duration = 600,
  className,
  triggerOnce = false,
}: AnimatedElementProps) {
  const { ref, isVisible } = useScrollAnimation({ triggerOnce })

  const getAnimationClasses = () => {
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
        case "flipUp":
          return `${baseClasses} transform rotateX-90 opacity-0`
        case "scaleIn":
          return `${baseClasses} transform scale-95 opacity-0`
        case "rotateIn":
          return `${baseClasses} transform rotate-12 scale-95 opacity-0`
        default:
          return `${baseClasses} transform translate-y-8 opacity-0`
      }
    }

    return `${baseClasses} transform translate-y-0 translate-x-0 rotate-0 scale-100 opacity-100`
  }

  return (
    <div
      ref={ref}
      className={cn(getAnimationClasses(), className)}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  )
}
