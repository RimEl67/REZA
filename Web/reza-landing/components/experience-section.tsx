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
import { CheckCircle, Clock, Gift } from "lucide-react"
import Link from "next/link"
import * as React from "react"

export default function ExperienceSection() {
  const benefits = [
    {
      icon: Clock,
      title: "Un moment pour soi de qualité",
      description:
        "Trouvez les meilleurs établissements de beauté proches de chez vous en quelques secondes grâce à des avis 100% certifiés.",
    },
    {
      icon: CheckCircle,
      title: "Réservation instantanée",
      description: "Prenez rendez-vous à tout moment, même en dehors des heures d'ouverture habituelles.",
    },
    {
      icon: Gift,
      title: "Bénéficiez d'offres exclusives",
      description: "Accédez à des promotions et réductions disponibles uniquement via notre plateforme.",
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <AnimatedElement animation="slideUp" delay={100} triggerOnce={false}>
          <div className="inline-block rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#002366] mb-4">
            Une nouvelle expérience beauté
          </div>
        </AnimatedElement>
        <AnimatedElement animation="flipUp" delay={200} triggerOnce={false}>
          <p className="text-sm sm:text-xl font-medium text-[#002366] mb-8">
            Rejoignez-nous en avant-première pour ne rien rater de nos actualités
          </p>
        </AnimatedElement>

        {/* Carousel for mobile screens */}
        {mounted && isMobile && (
          <Carousel
            className="w-full md:hidden mt-12"
            setApi={setEmblaApi}
            opts={{ loop: true }}
          >
            <CarouselContent>
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon
                return (
                  <CarouselItem key={index} className="px-4">
                    <div className="wave-card playing">
                      <div className="wave"></div>
                      <div className="wave"></div>
                      <div className="wave"></div>
                      <div className="card-content">
                        <IconComponent className="card-icon" />
                        <div className="card-title">{benefit.title}</div>
                        <div className="card-description">{benefit.description}</div>
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
          className="hidden md:grid md:grid-cols-3 gap-8 mt-12"
          triggerOnce={false}
        >
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon
            return (
              <div key={index} className="wave-card playing">
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="card-content">
                  <IconComponent className="card-icon" />
                  <div className="card-title">{benefit.title}</div>
                  <div className="card-description">{benefit.description}</div>
                </div>
              </div>
            )
          })}
        </StaggeredAnimation>

        <AnimatedElement animation="slideUp" delay={600} triggerOnce={false}>
          <div className="mt-12 text-center">
            <Link
              href="#clients"
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
