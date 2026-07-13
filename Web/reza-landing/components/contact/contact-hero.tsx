import AnimatedElement from "@/components/animations/animated-element"

export default function ContactHero() {
  return (
    <section className="relative h-[60vh] flex items-center overflow-hidden">
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover z-0">
        <source src="/V1.mp4" type="video/mp4" />
        {/* Fallback image if video doesn't load */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/placeholder.svg?height=1080&width=1920')",
          }}
        />
      </video>
      <div className="absolute inset-0 bg-black/40 z-10"></div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-2xl">
          <AnimatedElement animation="slideUp" delay={200}>
            <div className="inline-block rounded-full mt-5 px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white bg-[#002366] mb-6">
              CONTACTEZ-NOUS
            </div>
          </AnimatedElement>

          <AnimatedElement animation="flipUp" delay={400}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-6">
              Parlons de votre projet
            </h1>
          </AnimatedElement>
        </div>
      </div>
    </section>
  )
}
