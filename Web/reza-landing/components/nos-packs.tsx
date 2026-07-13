"use client"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { useIsMobile } from "@/hooks/use-mobile"
import clsx from "clsx"
import { Check, Star, X } from "lucide-react"
import * as React from "react"

interface Row {
  feature: string
  essentiel: CellValue
  basic: CellValue
  premium: CellValue
}

type CellValue = "check" | "cross" | string

export default function NosPacksSection() {
  const rows: Row[] = [
    {
      feature: "Outil gestion interne (automatisation réservation, fichier client, espace RH)",
      essentiel: "check",
      basic: "check",
      premium: "check",
    },
    {
      feature: "Tableau de bord avec suivi des performances",
      essentiel: "cross",
      basic: "check",
      premium: "check",
    },
    {
      feature: "Rappel RDV client (whatsapp, mail)",
      essentiel: "cross",
      basic: "jusqu'à 300/mois",
      premium: "Illimité",
    },
    {
      feature: "Paiement en ligne (acompte ou totalité)",
      essentiel: "cross",
      basic: "check",
      premium: "check",
    },
    {
      feature: "Rapport mensuel des performances (acquisition, CA..)",
      essentiel: "cross",
      basic: "cross",
      premium: "check",
    },
    {
      feature: "Fiche établissement dédiée (+ avis vérifiés)",
      essentiel: "check",
      basic: "check",
      premium: "check",
    },
    {
      feature: "Boost de visibilité / Mise en avant sur la plateforme",
      essentiel: "cross",
      basic: "cross",
      premium: "check",
    },
    {
      feature: "Formation à l'outil Reza - OFFERTE",
      essentiel: "1 employé",
      basic: "Jusqu'à 3 employés",
      premium: "Jusqu'à 10 employés",
    },
    {
      feature: "Support client / Assistance",
      essentiel: "En ligne",
      basic: "Multi-canal 5/7j",
      premium: "Multi-canal 7/7j",
    },
  ]

  const renderCell = (value: CellValue) => {
    if (value === "check") return <Check className="mx-auto h-5 w-5 text-black" />
    if (value === "cross") return <X className="mx-auto h-5 w-5 text-black" />
    return <span className="text-sm md:text-base text-center block px-2">{value}</span>
  }

  const isMobile = useIsMobile()
  const [mounted, setMounted] = React.useState(false)
  const [emblaApi, setEmblaApi] = React.useState<CarouselApi | null>(null)

  React.useEffect(() => setMounted(true), [])

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

  const plans = [
    { key: "essentiel", name: "Essentiel", stars: 1, bg: "bg-gray-100" },
    { key: "basic", name: "Basic", stars: 2, bg: "bg-gray-100" },
    { key: "premium", name: "Premium", stars: 3, bg: "bg-sky-100" },
  ] as const

  return (
    <section id="nos-packs" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold uppercase tracking-wider text-gray-900 mb-2">
            Offres Reza Pro
          </h2>
          <p className="text-sm sm:text-lg uppercase tracking-widest text-gray-500">
            Des offres adaptées à tous les besoins
          </p>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-1/2" />
                {plans.map(({ name, stars, bg }) => (
                  <th key={name} className={clsx("py-4 px-2 text-center font-semibold", bg)}>
                    <div className="flex justify-center mb-1">
                      {Array.from({ length: stars }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-black text-black" />
                      ))}
                    </div>
                    <span className="uppercase text-sm">{name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-t border-gray-200">
                  <td className="py-4 px-3 text-sm font-medium text-gray-800">{row.feature}</td>
                  <td className="py-4 px-2 text-center">{renderCell(row.essentiel)}</td>
                  <td className="py-4 px-2 text-center">{renderCell(row.basic)}</td>
                  <td className="py-4 px-2 text-center">{renderCell(row.premium)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile carousel cards */}
        {mounted && isMobile && (
          <Carousel className="w-full md:hidden" setApi={setEmblaApi} opts={{ loop: true }}>
            <CarouselContent>
              {plans.map((plan, index) => (
                <CarouselItem key={plan.key} className="px-4">
                  <div className="rounded-lg shadow-xl border bg-white p-6">
                    <div className={clsx("rounded-md py-2 text-center mb-4", plan.bg)}>
                      <div className="flex justify-center mb-1">
                        {Array.from({ length: plan.stars }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-black text-black" />
                        ))}
                      </div>
                      <h3 className="font-semibold uppercase text-lg">{plan.name}</h3>
                    </div>

                    <ul className="space-y-3">
                      {rows.map((row) => {
                        const value = row[plan.key as keyof Row] as CellValue
                        return (
                          <li key={row.feature} className="flex items-start gap-3 text-sm">
                            {value === "check" ? (
                              <Check className="h-4 w-4 mt-0.5 text-green-700" />
                            ) : value === "cross" ? (
                              <X className="h-4 w-4 mt-0.5 text-red-700" />
                            ) : (
                              <span className="h-4 w-4 mt-0.5" />
                            )}
                            <span className="flex-1">
                              {typeof value === "string" && value !== "check" && value !== "cross" ? (
                                <span className="font-semibold text-gray-900">{value}</span>
                              ) : (
                                row.feature
                              )}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        )}
      </div>
    </section>
  )
}
