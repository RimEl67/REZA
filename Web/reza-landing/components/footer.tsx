import Link from "next/link"
import Image from "next/image"
import { Instagram, Facebook, Linkedin } from "lucide-react"
import AnimatedElement from "@/components/animations/animated-element"

export default function Footer() {
  return (
    <footer className="bg-[#002366] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8">
          <AnimatedElement animation="slideLeft" delay={100} triggerOnce={false}>
            <div>
              <Image
                src="/logo-white.png?height=40&width=140&query=REZA logo white"
                alt="REZA Logo"
                width={140}
                height={40}
                className="h-12 w-auto mb-4"
              />
              <p className="text-sm text-white/80 max-w-xs mb-4">
                La première plateforme beauté au Maroc qui connecte les clients aux meilleurs professionnels de beauté.
              </p>

              <div className="flex space-x-4">
                <Link
                  href="https://www.instagram.com/reza.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                  <span className="sr-only">Instagram</span>
                </Link>
                <Link
                  href="https://www.facebook.com/reza.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                  <span className="sr-only">Facebook</span>
                </Link>
                <Link
                  href="https://www.linkedin.com/company/reza-app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </Link>
              </div>
            </div>
          </AnimatedElement>

          <AnimatedElement animation="slideRight" delay={200} triggerOnce={false}>
            <div>
              <h3 className="text-lg font-semibold mb-4">Prêt à transformer la beauté au Maroc ?</h3>
              <div className="flex flex-col space-y-3">
                <Link
                  href="#clients"
                  className="btn-shine inline-flex justify-center items-center px-4 py-2 border border-white text-sm font-medium rounded-md text-white hover:bg-white/10 transition-colors"
                >
                  Rejoindre comme Client
                </Link>
                <Link
                  href="#professionnels"
                  className="btn-fill inline-flex justify-center items-center px-4 py-2 border border-white text-sm font-medium rounded-md text-white hover:bg-white/10 transition-colors"
                >
                  Rejoindre comme Professionnel
                </Link>
              </div>
            </div>
          </AnimatedElement>
        </div>

        <AnimatedElement animation="fadeIn" delay={400} triggerOnce={false}>
          <div className="mt-12 pt-8 border-t border-white/20 text-center text-sm text-white/60">
            <p>© {new Date().getFullYear()} REZA. Tous droits réservés.</p>
          </div>
        </AnimatedElement>
      </div>
    </footer>
  )
}
