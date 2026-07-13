"use client"

import AnimatedElement from "@/components/animations/animated-element"
import { cn } from "@/lib/utils"
import { Facebook, Instagram, Linkedin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
      // Close mobile menu on scroll
      if (mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [mobileMenuOpen])

  // Lock/unlock body scroll when mobile menu opens/closes
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [mobileMenuOpen])

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled ? "bg-white shadow-sm" : "bg-transparent",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn("flex items-center transition-all duration-300", scrolled ? "h-16" : "h-20")}>
            <AnimatedElement animation="slideUp" delay={100} triggerOnce={false}>
              <div className="flex-shrink-0">
                <Link href="/" className="flex items-center relative">
                  {/* Logo for transparent header (white logo) */}
                  <Image
                    src="/logo-white.png?height=40&width=140&query=REZA logo white"
                    alt="REZA Logo"
                    width={140}
                    height={40}
                    className={cn(
                      "h-12 w-auto transition-opacity duration-300",
                      scrolled ? "opacity-0" : "opacity-100",
                    )}
                    priority
                  />
                  {/* Logo for scrolled header (dark logo) */}
                  <Image
                    src="/logo-blue.png?height=40&width=140&query=REZA logo dark"
                    alt="REZA Logo"
                    width={140}
                    height={40}
                    className={cn(
                      "h-12 w-auto absolute top-0 left-0 transition-opacity duration-300",
                      scrolled ? "opacity-100" : "opacity-0",
                    )}
                    priority
                  />
                </Link>
              </div>
            </AnimatedElement>

            <div className="flex-1"></div>

            <AnimatedElement animation="slideUp" delay={200} triggerOnce={false}>
              <nav className="hidden md:flex space-x-8">
                {[
                  { label: "Accueil", href: "/" },
                  { label: "Professionnels", href: "#professionnels" },
                  { label: "Clients", href: "#clients" },
                  { label: "Pourquoi nous rejoindre?", href: "#pourquoi-rejoindre" },
                  { label: "Nos packs", href: "#nos-packs" },
                  { label: "Contact", href: "/contact" },
                ].map((item, index) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "text-base font-medium transition-colors relative group inline-block",
                      scrolled ? "text-gray-800 hover:text-[#002366]" : "text-white hover:text-gray-200",
                    )}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    {item.label}
                    <span
                      className={cn(
                        "absolute bottom-0 left-1/2 w-0 h-0.5 transition-all duration-300 group-hover:w-full group-hover:left-0",
                        scrolled ? "bg-[#002366]" : "bg-white",
                      )}
                    ></span>
                  </Link>
                ))}
              </nav>
            </AnimatedElement>

            <AnimatedElement animation="slideUp" delay={300} triggerOnce={false}>
              <div className="md:hidden">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className={cn(
                    "inline-flex items-center justify-center p-2 rounded-md",
                    scrolled ? "text-gray-800" : "text-white",
                  )}
                  aria-label="Main menu"
                >
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </AnimatedElement>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden transition-opacity duration-300",
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      >
        <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)}></div>
        <div
          className={cn(
            "fixed top-0 right-0 h-full w-[min(80vw,320px)] bg-white shadow-xl transition-transform duration-300 ease-in-out",
            mobileMenuOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex flex-col h-full">
            {/* Header with logo and close button */}
            <div className="flex items-center justify-between p-6 border-b">
              <Image
                src="/logo-blue.png?height=40&width=140&query=REZA logo dark"
                alt="REZA Logo"
                width={140}
                height={40}
                className="h-12 w-auto"
              />
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-gray-600 hover:text-gray-900">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 px-6 py-8">
              <div className="space-y-6">
                {[
                  { label: "Accueil", href: "#" },
                  { label: "Professionnels", href: "#professionnels" },
                  { label: "Clients", href: "#clients" },
                  { label: "Pourquoi nous rejoindre?", href: "#pourquoi-rejoindre" },
                  { label: "Nos packs", href: "#nos-packs" },
                  { label: "Contact", href: "/contact" },
                ].map((item) => (
                  <div key={item.label} className="block">
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium text-gray-900 hover:text-[#002366] transition-colors relative group inline-block"
                    >
                      {item.label}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#002366] transition-all duration-300 group-hover:w-full"></span>
                    </Link>
                  </div>
                ))}
              </div>
            </nav>

            {/* Social media at bottom */}
            <div className="p-6 border-t">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Suivez-nous</h4>
              <div className="flex space-x-4">
                <Link
                  href="https://www.instagram.com/reza.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-[#002366] transition-colors"
                >
                  <Instagram className="h-6 w-6" />
                </Link>
                <Link
                  href="https://www.facebook.com/reza.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-[#002366] transition-colors"
                >
                  <Facebook className="h-6 w-6" />
                </Link>
                <Link
                  href="https://www.linkedin.com/company/reza-app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-[#002366] transition-colors"
                >
                  <Linkedin className="h-6 w-6" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
