import { ForgeNavbar } from "@/components/landing/forge-navbar";
import { ForgeFooter } from "@/components/landing/forge-footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ backgroundColor: "var(--forge-void)", color: "var(--forge-bone)" }}>
      <ForgeNavbar />
      <main>{children}</main>
      <ForgeFooter />
    </div>
  );
}
