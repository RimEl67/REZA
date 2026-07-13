import Header from "@/components/header"
import ContactHero from "@/components/contact/contact-hero"
import ContactForm from "@/components/contact/contact-form"
import Footer from "@/components/footer"
import FloatingContact from "@/components/floating-contact"

export default function ContactPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Header />
      <ContactHero />
      <div className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8">
          <ContactForm />
        </div>
      </div>
      <Footer />
      <FloatingContact />
    </main>
  )
}
