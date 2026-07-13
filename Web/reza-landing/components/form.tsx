"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Phone, Building, MapPin } from "lucide-react"
import AnimatedElement from "@/components/animations/animated-element"
import StaggeredAnimation from "@/components/animations/staggered-animation"

interface FormProps {
  fields: {
    id: string
    label: string
    type: string
    placeholder: string
  }[]
  buttonText: string
  onSubmit: (data: Record<string, string>) => void
}

const getIconForField = (fieldId: string) => {
  switch (fieldId) {
    case "fullName":
      return <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
    case "email":
      return <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
    case "phone":
      return <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
    case "establishment":
      return <Building className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
    case "city":
      return <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
    default:
      return <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
  }
}

export default function Form({ fields, buttonText, onSubmit }: FormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    onSubmit(formData)
    setIsLoading(false)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatedElement animation="scaleIn" delay={100} triggerOnce={false}>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-br from-[#002366] to-[#003d99] p-4 sm:p-8">
            <h4 className="text-base sm:text-xl font-semibold text-white text-center mb-2">
              Rejoignez l'Avant-Première
            </h4>
            <p className="text-white/80 text-xs sm:text-sm text-center">
              Complétez le formulaire ci-dessous pour obtenir un accès prioritaire
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-4">
            <StaggeredAnimation
              staggerDelay={50}
              mobileStaggerDelay={25}
              animation="slideUp"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              triggerOnce={false}
            >
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className={`space-y-1 ${field.id === "fullName" || field.id === "email" ? "sm:col-span-2" : ""}`}
                >
                  <Label
                    htmlFor={field.id}
                    className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2"
                  >
                    {getIconForField(field.id)}
                    {field.label}
                  </Label>
                  <div className="relative">
                    <Input
                      id={field.id}
                      type={field.type}
                      placeholder={field.placeholder}
                      onChange={handleChange}
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002366] focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-sm sm:text-base"
                    />
                  </div>
                </div>
              ))}
            </StaggeredAnimation>

            <AnimatedElement animation="slideUp" delay={400} triggerOnce={false}>
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#002366] to-[#003d99] hover:from-[#001c52] hover:to-[#002d7a] text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 text-sm sm:text-base"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="text-xs sm:text-sm">Inscription en cours...</span>
                    </div>
                  ) : (
                    buttonText
                  )}
                </Button>
              </div>
            </AnimatedElement>
          </form>
        </div>
      </AnimatedElement>

      <AnimatedElement animation="fadeIn" delay={500} triggerOnce={false}>
        <div className="flex items-center justify-center gap-4 sm:gap-6 mt-6 text-[10px] sm:text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
            Sécurisé
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
            Gratuit
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full"></div>
            Accès Prioritaire
          </div>
        </div>
      </AnimatedElement>
    </div>
  )
}
