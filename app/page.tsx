import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { ClubsGrid } from "@/components/landing/ClubsGrid";
import {
  HomeAdnSection,
  HomeBetaSection,
  HomeExploreSection,
  HomeWishlistSection,
} from "@/components/landing/HomeSections";
import { Footer } from "@/components/landing/Footer";
import { createClient } from "@/utils/supabase/server";
import { getOfficialClubs } from "@/app/actions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const DEFAULT_FOUNDER_COUNT = 38;

type FounderMembershipStats = {
  founder_count: number;
};

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is logged in, redirect to app
  if (user) {
    redirect('/app/mi-lectura');
  }

  const [officialClubs, founderStatsResult] = await Promise.all([
    getOfficialClubs(),
    supabase.rpc("get_founder_membership_stats").maybeSingle(),
  ]);

  const founderStats = founderStatsResult.data as FounderMembershipStats | null;
  const founderCount = typeof founderStats?.founder_count === "number"
    ? founderStats.founder_count
    : DEFAULT_FOUNDER_COUNT;

  return (
    <main className="min-h-screen bg-cream selection:bg-teal selection:text-white overflow-x-hidden">
      <Navbar mode="public" />
      <Hero founderCount={founderCount} />
      <HomeExploreSection />
      <ClubsGrid initialClubs={officialClubs} />
      <HomeAdnSection />
      <HomeWishlistSection />
      <HomeBetaSection />
      <Footer />
    </main>
  );
}
