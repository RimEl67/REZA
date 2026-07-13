import AnimatedElement from "@/components/animations/animated-element"
import StaggeredAnimation from "@/components/animations/staggered-animation"
import Image from "next/image"

export default function RevolutionSection() {
  const values = [
    {
      title: "Réservation instantanée",
      description:
        "Plus d'attente au téléphone ! Réservez en 30 secondes chrono, confirmez instantanément et recevez vos rappels automatiques.",
    },
    {
      title: "Confiance & Sécurité",
      description:
        "Profils vérifiés, paiements sécurisés et système d'évaluation transparent pour une expérience en toute sérénité côté clients et professionnels.",
    },
    {
      title: "Visibilité & Personnalisation",
      description:
        "Augmentez votre clientèle grâce à notre plateforme et bénéficiez de recommandations personnalisées basées sur vos préférences et besoins.",
    },
    {
      title: "Qualité garantie",
      description:
        "Rejoignez un réseau premium de professionnels qualifiés et découvrez les meilleurs services beauté de votre région.",
    },
  ]

  return (
    <section id="pourquoi-rejoindre" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <AnimatedElement animation="slideUp" delay={100} triggerOnce={false}>
            <div className="inline-block rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#002366] mb-4">
              Pourquoi rejoindre Reza
            </div>
          </AnimatedElement>
          <AnimatedElement animation="flipUp" delay={200} triggerOnce={false}>
            <h2 className="text-xl sm:text-3xl font-bold text-gray-900">La plateforme pensée pour tous</h2>
          </AnimatedElement>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <AnimatedElement animation="slideLeft" delay={300} triggerOnce={false}>
            <div className="relative h-[350px] md:h-[500px] rounded-lg overflow-hidden">
              <Image
                src="/section.png"
                alt="REZA Revolution"
                fill
                className="object-cover"
              />
            </div>
          </AnimatedElement>

          <div className="space-y-6">
            <AnimatedElement animation="slideUp" delay={200} triggerOnce={false}>
              <p className="text-sm sm:text-lg text-gray-600 mb-6">
                Découvrez la révolution dans l'expérience beauté au Maroc bientôt disponible
              </p>
            </AnimatedElement>
            <StaggeredAnimation
              staggerDelay={100}
              mobileStaggerDelay={50}
              animation="scaleIn"
              className="grid grid-cols-2 gap-4"
              triggerOnce={false}
            >
              {values.map((value, index) => (
                <div
                  key={index}
                  className="p-3 sm:p-6 border border-gray-200 rounded-lg hover:border-[#002366] hover:shadow-lg transition-all duration-300 text-center flex flex-col justify-start min-h-[160px] sm:min-h-[200px]"
                >
                  <h3 className="text-xs sm:text-lg font-bold text-gray-900 mb-2 sm:mb-4 flex-shrink-0">
                    {value.title}
                  </h3>
                  <p className="text-[10px] sm:text-sm text-gray-600 leading-tight sm:leading-relaxed flex-grow flex items-center justify-center">
                    {value.description}
                  </p>
                </div>
              ))}
            </StaggeredAnimation>
          </div>
        </div>
      </div>
    </section>
  )
}
