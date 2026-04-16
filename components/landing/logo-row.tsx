import { IconBrandNotion, IconBrandTodoist, IconBrandMint, IconBrandHabitica, IconBrandGoogleSheets, IconBrandStrides } from "@/components/icons";

export function LogoRow() {
  const apps = [
    { name: "Notion", icon: <IconBrandNotion size={20} /> },
    { name: "Todoist", icon: <IconBrandTodoist size={20} /> },
    { name: "Mint", icon: <IconBrandMint size={20} /> },
    { name: "Habitica", icon: <IconBrandHabitica size={20} /> },
    { name: "Google Sheets", icon: <IconBrandGoogleSheets size={20} /> },
    { name: "Strides", icon: <IconBrandStrides size={20} /> },
  ];

  return (
    <section className="py-12 border-t border-axis-border">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-center text-sm font-mono text-axis-text3 mb-8 uppercase tracking-wider">
          Replaces these apps
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {apps.map((app) => (
            <div
              key={app.name}
              className="flex items-center gap-2 text-axis-text3/50 hover:text-axis-text3 transition-colors"
            >
              <span className="text-xl opacity-60">{app.icon}</span>
              <span className="text-sm font-medium line-through decoration-axis-accent decoration-2">{app.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
