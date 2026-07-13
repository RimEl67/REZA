'use client';

import { Facebook, Instagram, Twitter, Mail, MapPin, Phone, ArrowRight } from 'lucide-react';
import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const LoadingOverlay = dynamic(() => import('@/components/ui/LoadingOverlay'), { ssr: false });

export default function Footer() {
  const [navLoading, setNavLoading] = useState(false);

  return (
    <footer className="w-full bg-[#f5f7f3] text-[#2F2E2C] pt-16 pb-8 px-6 relative overflow-hidden">
      {/* Decorative Elements */}
       <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
              <img src="/logos/logo-2.svg" alt="Reza Logo" className="w-12 h-12 self-start" />
              <div className="flex flex-col">
                <span className="font-thin text-2xl tracking-widest">REZA</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-6 h-px bg-gradient-to-r from-[#C57B57] to-transparent" />
                  <span className="text-[7px] tracking-[0.5em] uppercase text-[#8B7260] opacity-50">BEAUTY</span>
                </div>
              </div>
            </div>
           
            <p className="text-sm text-[#2F2E2C]/70 font-light max-w-xs">
              Votre destination premium pour la beauté et le bien-être. Découvrez l'excellence, l'élégance et l'innovation dans chaque expérience.
            </p>
            <div className="flex gap-3 mt-2">
              <a href="#" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#2f2e2c11] transition-colors">
                <Instagram className="w-5 h-5 text-[#8b7260]" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#2f2e2c11] transition-colors">
                <Facebook className="w-5 h-5 text-[#8b7260]" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#2f2e2c11] transition-colors">
                <Twitter className="w-5 h-5 text-[#8b7260]" />
              </a>
            </div>
          </div>

          {/* Navigation Section */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/coiffeur" className="hover:underline">Coiffeur</a></li>
              <li><a href="/barbier" className="hover:underline">Barbier</a></li>
              <li><a href="/manucure" className="hover:underline">Manucure</a></li>
              <li><a href="/institut-de-beaute" className="hover:underline">Etablissement</a></li>
              <li>
                <a
                  href="/pro-info"
                  className="hover:underline"
                  onClick={e => {
                    e.preventDefault();
                    setNavLoading(true);
                    setTimeout(() => {
                      window.location.href = "/pro-info";
                    }, 2200);
                  }}
                >
                  Espace Pro
                </a>
              </li>
              <li>
                <a
                  href="/login"
                  className="hover:underline"
                  onClick={e => {
                    e.preventDefault();
                    setNavLoading(true);
                    setTimeout(() => {
                      window.location.href = "/login";
                    }, 2200);
                  }}
                >
                  Mon Compte
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> contact@reza.com</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +212 6 00 00 00 00</li>
            </ul>
          </div>

          {/* Newsletter Section */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Newsletter</h4>
            <p className="text-sm text-[#2F2E2C]/70 mb-3">Recevez nos offres exclusives et conseils beauté.</p>
            <form className="flex gap-2">
              <input type="email" placeholder="Votre email" className="px-4 py-2 rounded-full border border-[#8b7260]/30 focus:border-[#8b7260] focus:outline-none text-[#2F2E2C] bg-transparent" />
              <button type="submit" className="px-4 py-2 text-sm rounded-full bg-[#8b7260] text-white font-medium flex items-center gap-1 hover:bg-[#2F2E2C] transition-colors">
                S'inscrire <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Legal & Copyright */}
        <div className="border-t border-[#8b7260]/20 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-[#2F2E2C]/60 gap-2">
          <div>
            &copy; {new Date().getFullYear()} REZA. Tous droits réservés.
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Mentions légales</a>
            <a href="#" className="hover:underline">Politique de confidentialité</a>
            <a href="#" className="hover:underline">Cookies</a>
            <a href="#" className="hover:underline">Conditions d'utilisation</a>
          </div>
        </div>
      </div>
      {navLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#f5f7f3]">
          <LoadingOverlay />
        </div>
      )}
    </footer>
  );
}