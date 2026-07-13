import Link from "next/link"
import AnimatedElement from "@/components/animations/animated-element"

export default function HeroSection() {
  return (
    <section className="relative h-[100dvh] flex items-center overflow-hidden">
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover z-0">
        <source src="/V1.mp4" type="video/mp4" />
        {/* Fallback image if video doesn't load */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/placeholder.svg?height=1080&width=1920&query=luxury beauty salon with soft lighting and elegant decor')",
          }}
        />
      </video>
      <div className="absolute inset-0 bg-black/40 z-10"></div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-2xl">
          <AnimatedElement animation="slideUp" delay={400}>
            <div className="inline-block rounded-full px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white bg-[#002366] mb-6">
              La première plateforme beauté au Maroc
            </div>
          </AnimatedElement>

          <AnimatedElement animation="flipUp" delay={600}>
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white tracking-tight mb-6">
              La beauté simplifiée
            </h1>
          </AnimatedElement>

          <AnimatedElement animation="slideUp" delay={800}>
            <p className="text-sm sm:text-lg lg:text-xl text-white/90 mb-8 max-w-xl">
              Réservez vos prestations beauté en quelques clics. À tout moment. Chez les meilleurs professionnels.
            </p>
          </AnimatedElement>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <AnimatedElement animation="slideRight" delay={1000}>
              <Link
                href="#professionnels"
                className="btn-shine w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium border-[#002366] rounded-md text-white bg-[#002366] hover:bg-[#001c52] transition-colors"
              >
                Je suis un professionnel
              </Link>
            </AnimatedElement>
            <AnimatedElement animation="slideLeft" delay={1200}>
              <Link
                href="#clients"
                className="btn-fill w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white/10 transition-colors"
              >
                Je suis un client
              </Link>
            </AnimatedElement>
          </div>
        </div>
      </div>
    </section>
  )
}
