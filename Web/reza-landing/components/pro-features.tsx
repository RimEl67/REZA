"use client"

import AnimatedElement from "@/components/animations/animated-element"
import StaggeredAnimation from "@/components/animations/staggered-animation"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { useIsMobile } from "@/hooks/use-mobile"
import { Calendar, Eye, TrendingUp } from "lucide-react"
import Link from "next/link"
import * as React from "react"

export default function ProFeatures() {
  const features = [
    {
      icon: TrendingUp,
      title: "Boostez votre chiffre d'affaires",
      description: "Gagnez de nouveaux clients tous les mois et augmentez rapidement votre chiffre d'affaires.",
    },
    {
      icon: Eye,
      title: "Soyez encore plus visible",
      description: "Profitez d'une page dédiée à votre établissement et d'un accompagnement dans votre communication.",
    },
    {
      icon: Calendar,
      title: "Évitez les no shows",
      description:
        "Réduisez drastiquement les absences aux rendez-vous grâce à notre système de rappel automatique et d'acompte.",
    },
  ]

  const isMobile = useIsMobile()
  const [mounted, setMounted] = React.useState(false)
  const [emblaApi, setEmblaApi] = React.useState<CarouselApi | null>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // autoplay every 4s
  React.useEffect(() => {
    if (!mounted || !isMobile || !emblaApi) return

    const id = setInterval(() => {
      if (!emblaApi) return
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext()
      } else {
        emblaApi.scrollTo(0)
      }
    }, 4000)

    return () => clearInterval(id)
  }, [mounted, isMobile, emblaApi])

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <AnimatedElement animation="slideUp" delay={100} triggerOnce={false}>
            <div className="inline-block rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#002366] mb-4">
              Pour les professionnels
            </div>
          </AnimatedElement>
          <AnimatedElement animation="flipUp" delay={200} triggerOnce={false}>
            <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-4">
              Transformez et faites décoller votre business
            </h2>
          </AnimatedElement>
          <AnimatedElement animation="slideUp" delay={300} triggerOnce={false}>
            <p className="mt-4 max-w-3xl mx-auto text-sm sm:text-lg text-gray-600">
              Boostez votre chiffre d'affaires, soyez encore plus visible, évitez les no shows.
            </p>
          </AnimatedElement>
        </div>

        {/* Carousel for mobile screens (only rendered client-side) */}
        {mounted && isMobile && (
          <Carousel
            className="w-full md:hidden"
            setApi={setEmblaApi}
            opts={{ loop: true }}
          >
            <CarouselContent>
              {features.map((feature, index) => {
                const IconComponent = feature.icon
                return (
                  <CarouselItem key={index} className="px-4">
                    <div className="wave-card playing">
                      <div className="wave"></div>
                      <div className="wave"></div>
                      <div className="wave"></div>
                      <div className="card-content">
                        <IconComponent className="card-icon" />
                        <div className="card-title">{feature.title}</div>
                        <div className="card-description">{feature.description}</div>
                      </div>
                    </div>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
          </Carousel>
        )}

        {/* Grid for medium and larger screens */}
        <StaggeredAnimation
          staggerDelay={150}
          mobileStaggerDelay={75}
          animation="scaleIn"
          className="hidden md:grid md:grid-cols-3 gap-8"
          triggerOnce={false}
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <div key={index} className="wave-card playing">
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="card-content">
                  <IconComponent className="card-icon" />
                  <div className="card-title">{feature.title}</div>
                  <div className="card-description">{feature.description}</div>
                </div>
              </div>
            )
          })}
        </StaggeredAnimation>

        <AnimatedElement animation="slideUp" delay={600} triggerOnce={false}>
          <div className="mt-12 text-center">
            <div className="mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Une expérience privilégiée</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Inscrivez-vous pour un accès prioritaire et des avantages exclusifs dès le lancement.
              </p>
            </div>
            <Link
              href="#professionnels"
              className="btn-flip inline-flex justify-center items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-[#002366] hover:bg-[#001c52] transition-colors"
            >
              <span className="btn-text-original">
                <span className="hidden sm:inline">Je rejoins en avant-première</span>
                <span className="sm:hidden">Rejoindre</span>
              </span>
              <span className="btn-text-hover">
                <span className="hidden sm:inline">Commencer maintenant</span>
                <span className="sm:hidden">Commencer</span>
              </span>
            </Link>
          </div>
        </AnimatedElement>
      </div>
    </section>
  )
}
