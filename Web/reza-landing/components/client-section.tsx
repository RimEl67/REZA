"use client"

import Image from "next/image"
import Form from "@/components/form"
import AnimatedElement from "@/components/animations/animated-element"

export default function ClientSection() {
  const clientFields = [
    {
      id: "fullName",
      label: "Nom complet",
      type: "text",
      placeholder: "Entrez votre nom complet",
    },
    {
      id: "email",
      label: "Email",
      type: "email",
      placeholder: "Entrez votre email",
    },
    {
      id: "phone",
      label: "Numéro de téléphone",
      type: "tel",
      placeholder: "Entrez votre numéro de téléphone",
    },
    {
      id: "city",
      label: "Ville",
      type: "text",
      placeholder: "Entrez la ville",
    },
  ]

  const handleSubmit = (data: Record<string, string>) => {
    console.log("Client form submitted:", data)
    // Here you would handle the form submission
  }

  return (
    <section id="clients" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Image and content */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6">
            <AnimatedElement animation="slideUp" delay={100} triggerOnce={false}>
              <div className="inline-block rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#002366] mb-4">
                POUR LES CLIENTS
              </div>
            </AnimatedElement>

            <AnimatedElement animation="flipUp" delay={200} triggerOnce={false}>
              <div>
                <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-gray-900">
                  La beauté à portée de main
                </h2>
                <p className="mt-4 text-sm sm:text-lg text-gray-600">
                  Trouvez et réservez instantanément vos prestations beauté préférées, 24h/24 et 7j/7. Accédez aux
                  meilleurs professionnels du Maroc sans attente et profitez de promotions exclusives sur vos
                  prestations.
                </p>
              </div>
            </AnimatedElement>
          </div>

          <AnimatedElement animation="slideRight" delay={300} triggerOnce={false}>
            <div className="relative h-[350px] md:h-[500px] rounded-lg overflow-hidden">
              <Image
                src="/V3.svg?height=1000&width=800&query=happy client receiving beauty treatment in luxury salon"
                alt="Beauty Client"
                fill
                className="object-cover"
              />
            </div>
          </AnimatedElement>
        </div>

        <AnimatedElement animation="scaleIn" delay={400} triggerOnce={false}>
          <Form fields={clientFields} buttonText="Je rejoins en avant-première" onSubmit={handleSubmit} />
        </AnimatedElement>
      </div>
    </section>
  )
}
