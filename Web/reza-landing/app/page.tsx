import ClientSection from "@/components/client-section"
import ExperienceSection from "@/components/experience-section"
import FloatingContact from "@/components/floating-contact"
import Footer from "@/components/footer"
import Header from "@/components/header"
import HeroSection from "@/components/hero-section"
import NosPacksSection from "@/components/nos-packs"
import ProFeatures from "@/components/pro-features"
import ProSection from "@/components/pro-section"
import RevolutionSection from "@/components/revolution-section"

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Header />
      <HeroSection />
      <ProSection />
      <ProFeatures />
      <ClientSection />
      <ExperienceSection />
      <RevolutionSection />
      <NosPacksSection />
      <Footer />
      <FloatingContact />
    </main>
  )
}
