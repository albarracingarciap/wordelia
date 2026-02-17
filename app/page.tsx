import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { FeaturesIA } from "@/components/landing/FeaturesIA";
import { ClubsGrid } from "@/components/landing/ClubsGrid";
import { BookMonth } from "@/components/landing/BookMonth";
import { Testimonials } from "@/components/landing/Testimonials";
import { Footer } from "@/components/landing/Footer";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is logged in, redirect to app
  if (user) {
    redirect('/app/mi-lectura');
  }

  return (
    <main className="min-h-screen bg-cream selection:bg-teal selection:text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <FeaturesIA />
      <ClubsGrid />
      <BookMonth />
      <Testimonials />
      <Footer />
    </main>
  );
}
