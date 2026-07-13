'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQAccordion = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Qu'est-ce que Reza ?",
      answer: "Reza est une entreprise marocaine spécialisée dans le bien-être et la beauté. Nous proposons une plateforme innovante pour faciliter la prise de rendez-vous dans les salons de coiffure, instituts de beauté, spas et centres de bien-être partout au Maroc. Notre mission est d'améliorer l'accès aux services de bien-être pour tous."
    },
    {
      question: "Comment prendre rendez-vous sur Reza ?",
      answer: "Pour prendre rendez-vous sur Reza, recherchez votre établissement préféré, choisissez la prestation souhaitée, sélectionnez un créneau disponible et confirmez votre réservation. Vous recevrez une confirmation instantanée par email et SMS."
    },
    {
      question: "Dois-je payer en ligne sur Reza ?",
      answer: "Le paiement en ligne n'est pas obligatoire sur Reza. Vous pouvez régler directement sur place après votre prestation. Certains établissements proposent le paiement en ligne, mais la plupart acceptent le règlement sur place en espèces ou par carte bancaire."
    },
    {
      question: "Comment gérer mes rendez-vous sur Reza ?",
      answer: "Vous pouvez gérer vos rendez-vous depuis votre espace personnel Reza. Connectez-vous à votre compte pour consulter, modifier ou annuler vos réservations. Des rappels automatiques vous seront envoyés avant chaque rendez-vous."
    },
    {
      question: "Comment inscrire mon établissement sur Reza ?",
      answer: "Pour inscrire votre salon ou institut sur Reza, rendez-vous sur notre page dédiée aux professionnels et remplissez le formulaire d'inscription. Notre équipe vous accompagnera pour configurer votre profil et vous former à l'utilisation de notre plateforme."
    }
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#f5f7f3] py-20 px-6 -mt-32 lg:-mt-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block">
            <p className="text-sm font-semibold text-gray-900 tracking-wide uppercase mb-3">
              FAQ
            </p>
            <div className="h-0.5 bg-[#8b7260] w-12 mx-auto mb-6"></div>
          </div>
          <h1 className="text-4xl md:text-5xl font-light text-gray-900">
            Les questions fréquentes
          </h1>
        </div>

        {/* Accordion */}
        <div className="space-y-0">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border-b border-gray-200 bg-[#f5f7f3]"
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full text-left py-6 px-6 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 group"
              >
                <span className="text-lg text-gray-900 font-normal pr-8">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-600 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-6 pt-2">
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default FAQAccordion;