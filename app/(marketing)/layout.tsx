import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { StickyCTA } from "@/components/landing/sticky-cta";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <StickyCTA />
    </>
  );
}
