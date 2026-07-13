import Image from "next/image";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import About from "../components/About";
import RDV from "../components/Rdv";
import Locations from "../components/Locations";
import Faq from "../components/Faq";
import Testimonials from "../components/Testimonials";




export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7f3] font-sans dark:bg-black">
      <Header />
      <Hero />
      <About />
      <RDV />
      <Locations />
      <Faq />
      <Testimonials />
      <Footer />
    </div>
  );
}
