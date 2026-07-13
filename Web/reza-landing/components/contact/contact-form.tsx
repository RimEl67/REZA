"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { User, Mail, Phone, MessageSquare, Building } from "lucide-react"
import AnimatedElement from "@/components/animations/animated-element"
import StaggeredAnimation from "@/components/animations/staggered-animation"

export default function ContactForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    subject: "",
    message: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    console.log("Contact form submitted:", formData)
    setIsLoading(false)
    setIsSubmitted(true)

    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false)
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        company: "",
        subject: "",
        message: "",
      })
    }, 3000)
  }

  if (isSubmitted) {
    return (
      <AnimatedElement animation="scaleIn" delay={100}>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-8 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Message Envoyé !</h3>
          <p className="text-sm sm:text-base text-gray-600">
            Merci pour votre message. Notre équipe vous contactera dans les plus brefs délais.
          </p>
        </div>
      </AnimatedElement>
    )
  }

  return (
    <AnimatedElement animation="slideLeft" delay={200}>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-br from-[#002366] to-[#003d99] p-3 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2">Envoyez-nous un message</h3>
          <p className="text-white/80 text-xs sm:text-sm">
            Remplissez le formulaire ci-dessous et nous vous répondrons rapidement.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-6 space-y-3 sm:space-y-4">
          <StaggeredAnimation
            staggerDelay={50}
            mobileStaggerDelay={25}
            animation="slideUp"
            className="space-y-3 sm:space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <Label
                  htmlFor="fullName"
                  className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1 sm:gap-2"
                >
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  Nom complet *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Votre nom complet"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-2 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002366] focus:border-transparent transition-all duration-200 text-xs sm:text-base"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1 sm:gap-2"
                >
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-2 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002366] focus:border-transparent transition-all duration-200 text-xs sm:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1 sm:gap-2"
                >
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  Téléphone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+212 6XX XXX XXX"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-2 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002366] focus:border-transparent transition-all duration-200 text-xs sm:text-base"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label
                  htmlFor="company"
                  className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1 sm:gap-2"
                >
                  <Building className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  Entreprise/Salon
                </Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="Nom de votre entreprise"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-2 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002366] focus:border-transparent transition-all duration-200 text-xs sm:text-base"
                />
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label
                htmlFor="subject"
                className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1 sm:gap-2"
              >
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                Sujet *
              </Label>
              <Input
                id="subject"
                type="text"
                placeholder="Sujet de votre message"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-2 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002366] focus:border-transparent transition-all duration-200 text-xs sm:text-base"
              />
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="message" className="text-xs sm:text-sm font-medium text-gray-700">
                Message *
              </Label>
              <Textarea
                id="message"
                placeholder="Décrivez votre demande en détail..."
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full px-2 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002366] focus:border-transparent transition-all duration-200 resize-none text-xs sm:text-base"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#002366] to-[#003d99] hover:from-[#001c52] hover:to-[#002d7a] text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 text-xs sm:text-base"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-xs sm:text-base">Envoi en cours...</span>
                </div>
              ) : (
                "Envoyer le Message"
              )}
            </Button>
          </StaggeredAnimation>
        </form>
      </div>
    </AnimatedElement>
  )
}
