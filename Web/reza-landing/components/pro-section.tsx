"use client"

import Image from "next/image"
import Form from "@/components/form"
import AnimatedElement from "@/components/animations/animated-element"

export default function ProSection() {
  const proFields = [
    {
      id: "fullName",
      label: "Nom complet",
      type: "text",
      placeholder: "Entrez votre nom complet",
    },
    {
      id: "email",
      label: "Email professionnel",
      type: "email",
      placeholder: "Entrez votre email professionnel",
    },
    {
      id: "phone",
      label: "Numéro de téléphone",
      type: "tel",
      placeholder: "Entrez votre numéro de téléphone",
    },
    {
      id: "establishment",
      label: "Nom de l'établissement",
      type: "text",
      placeholder: "Entrez le nom de votre établissement",
    },
    {
      id: "city",
      label: "Ville de l'établissement",
      type: "text",
      placeholder: "Entrez la ville de votre établissement",
    },
  ]

  const handleSubmit = (data: Record<string, string>) => {
    console.log("Pro form submitted:", data)
    // Here you would handle the form submission
  }

  return (
    <section id="professionnels" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Image and content */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <AnimatedElement animation="slideLeft" delay={200} triggerOnce={false}>
            <div className="relative h-[350px] md:h-[500px] rounded-lg overflow-hidden">
              <Image
                src="/V2.svg?height=1000&width=800&query=professional hairstylist working in luxury salon"
                alt="Beauty Professional"
                fill
                className="object-cover"
              />
            </div>
          </AnimatedElement>

          <div className="space-y-6">
            <AnimatedElement animation="slideUp" delay={100} triggerOnce={false}>
              <div className="inline-block rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#002366] mb-4">
                Professionnels de la beauté
              </div>
            </AnimatedElement>

            <AnimatedElement animation="flipUp" delay={300} triggerOnce={false}>
              <div>
                <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-gray-900">
                  Transformez chaque opportunité en réservation
                </h2>
                <p className="mt-4 text-sm sm:text-lg text-gray-600">
                  Notre plateforme vous connecte directement avec une clientèle qui recherche vos services à travers le
                  Maroc. Augmentez votre visibilité, simplifiez votre gestion et boostez votre croissance.
                </p>
              </div>
            </AnimatedElement>
          </div>
        </div>

        <AnimatedElement animation="scaleIn" delay={400} triggerOnce={false}>
          <Form fields={proFields} buttonText="Je rejoins en avant-première" onSubmit={handleSubmit} />
        </AnimatedElement>
      </div>
    </section>
  )
}
