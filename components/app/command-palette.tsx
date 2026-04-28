"use client";

import {
  ComponentType,
  ReactNode,
  createContext,
  startTransition,
  useContext,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { primaryNavItems, secondaryNavItems } from "@/components/app/navigation";
import {
  IconCommand,
  IconGoals,
  IconHabits,
  IconRevenue,
  IconSearch,
  IconSettings,
  IconTarget,
} from "@/components/icons";

type CommandPaletteContextValue = {
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
};

type Command = {
  id: string;
  section: "Navigate" | "Capture" | "System";
  label: string;
  hint: string;
  keywords: string[];
  shortcut?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  tone?: string;
  run: () => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const deferredQuery = useDeferredValue(query);

  const closePalette = () => {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
  };

  const navigate = (href: string) => {
    closePalette();
    startTransition(() => {
      router.push(href);
    });
  };

  const commands: Command[] = [
    ...[...primaryNavItems, ...secondaryNavItems].map((item) => {
      const shortLabel = "shortLabel" in item && typeof item.shortLabel === "string" ? item.shortLabel : "";

      return {
        id: `nav-${item.href}`,
        section: "Navigate" as const,
        label: item.label,
        hint: `Open ${item.label.toLowerCase()}.`,
        keywords: [item.label, shortLabel, item.href, "open", "jump", "go"],
        shortcut: item.shortcutKey ? `g ${item.shortcutKey}` : undefined,
        icon: item.icon,
        run: () => navigate(item.href),
      };
    }),
    {
      id: "create-mission",
      section: "Capture",
      label: "Add Task",
      hint: "Jump into Tasks and focus the quick-add bar.",
      keywords: ["mission", "task", "todo", "capture"],
      shortcut: "n m",
      icon: IconTarget,
      tone: "text-axis-accent",
      run: () => navigate("/missions?quickAdd=1"),
    },
    {
      id: "create-habit",
      section: "Capture",
      label: "Add Habit",
      hint: "Open Habits and focus the habit composer.",
      keywords: ["habit", "system", "routine", "capture"],
      shortcut: "n h",
      icon: IconHabits,
      tone: "text-axis-accent",
      run: () => navigate("/systems?quickAdd=1"),
    },
    {
      id: "create-theme",
      section: "Capture",
      label: "Add Theme",
      hint: "Open Themes and start a new operating objective.",
      keywords: ["theme", "goal", "milestone", "target", "capture"],
      shortcut: "n g",
      icon: IconGoals,
      tone: "text-axis-accent",
      run: () => navigate("/goals?quickAdd=1"),
    },
    {
      id: "log-income",
      section: "Capture",
      label: "Log Income",
      hint: "Open Revenue Tracker and start a new income entry.",
      keywords: ["income", "revenue", "payment", "sale", "capture"],
      shortcut: "n r",
      icon: IconRevenue,
      tone: "text-emerald-500",
      run: () => navigate("/revenue?quickAdd=entry"),
    },
    {
      id: "toggle-theme",
      section: "System",
      label: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      hint: "Toggle the global app appearance.",
      keywords: ["theme", "dark", "light", "appearance"],
      icon: IconSettings,
      tone: "text-axis-accent",
      run: () => {
        closePalette();
        startTransition(() => {
          toggleTheme();
        });
      },
    },
  ];

  const queryTerms = deferredQuery
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const filteredCommands =
    queryTerms.length === 0
      ? commands
      : commands.filter((command) => {
          const haystack = [command.label, command.hint, command.shortcut || "", ...command.keywords]
            .join(" ")
            .toLowerCase();
          return queryTerms.every((term) => haystack.includes(term));
        });

  const groupedCommands = filteredCommands.reduce<Record<Command["section"], Command[]>>(
    (groups, command) => {
      groups[command.section].push(command);
      return groups;
    },
    { Navigate: [], Capture: [], System: [] }
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [deferredQuery, open]);

  useEffect(() => {
    closePalette();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    inputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const withModifier = event.metaKey || event.ctrlKey;

      if (withModifier && key === "k") {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }

      if (!open) return;

      if (key === "escape") {
        event.preventDefault();
        closePalette();
        return;
      }

      if (key === "arrowdown") {
        event.preventDefault();
        setSelectedIndex((current) => Math.min(current + 1, Math.max(filteredCommands.length - 1, 0)));
        return;
      }

      if (key === "arrowup") {
        event.preventDefault();
        setSelectedIndex((current) => Math.max(current - 1, 0));
        return;
      }

      if (key === "enter" && filteredCommands[selectedIndex]) {
        event.preventDefault();
        filteredCommands[selectedIndex].run();
      }
    };

    const handleGlobalShortcuts = (event: KeyboardEvent) => {
      if (open || isInteractiveTarget(event.target)) return;

      const key = event.key.toLowerCase();
      const quickRoutes: Record<string, string> = {
        m: "/missions?quickAdd=1",
        h: "/systems?quickAdd=1",
        g: "/goals?quickAdd=1",
        r: "/revenue?quickAdd=entry",
      };

      if (event.shiftKey && key === "n") return;

      if (event.altKey || event.metaKey || event.ctrlKey) return;

      if (key === "g" || key === "n") {
        const nextKeyHandler = (followup: KeyboardEvent) => {
          const followupKey = followup.key.toLowerCase();

          if (key === "g") {
            const destination = [...primaryNavItems, ...secondaryNavItems].find(
              (item) => item.shortcutKey === followupKey
            );
            if (destination) {
              followup.preventDefault();
              navigate(destination.href);
            }
          }

          if (key === "n" && quickRoutes[followupKey]) {
            followup.preventDefault();
            navigate(quickRoutes[followupKey]);
          }

          window.removeEventListener("keydown", nextKeyHandler, true);
        };

        event.preventDefault();
        window.addEventListener("keydown", nextKeyHandler, true);
        window.setTimeout(() => {
          window.removeEventListener("keydown", nextKeyHandler, true);
        }, 900);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", handleGlobalShortcuts);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keydown", handleGlobalShortcuts);
    };
  }, [filteredCommands, navigate, open, selectedIndex]);

  let visibleIndex = 0;

  return (
    <CommandPaletteContext.Provider
      value={{
        openPalette: () => setOpen(true),
        closePalette,
        togglePalette: () => setOpen((current) => !current),
      }}
    >
      {children}

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePalette}
              className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-sm"
            />

            <div className="pointer-events-none fixed inset-0 z-[91] flex items-start justify-center px-3 pt-[9vh] sm:px-4 sm:pt-[12vh]">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -14 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                className="pointer-events-auto w-full max-w-2xl overflow-hidden rounded-3xl sm:rounded-[28px]"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-primary)",
                  boxShadow: "0 28px 90px rgba(0,0,0,0.34)",
                }}
              >
                <div className="flex items-center gap-3 border-b px-4 py-4" style={{ borderColor: "var(--border-primary)" }}>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: "var(--bg-tertiary)" }}
                  >
                    <IconSearch size={18} className="text-axis-accent" />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Jump, capture, or control the system..."
                    className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-white/25"
                    style={{ color: "var(--text-primary)" }}
                  />
                  <div
                    className="hidden rounded-xl px-3 py-2 text-[10px] font-mono uppercase sm:block"
                    style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}
                  >
                    Esc
                  </div>
                </div>

                <div className="axis-scrollbar max-h-[420px] overflow-y-auto px-3 py-3">
                  {filteredCommands.length === 0 ? (
                    <div className="px-4 py-14 text-center">
                      <div
                        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: "var(--bg-tertiary)" }}
                      >
                        <IconCommand size={24} style={{ color: "var(--text-tertiary)" }} />
                      </div>
                      <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                        No matching commands
                      </p>
                      <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                        Try page names, actions like &quot;log income&quot;, or shortcuts like &quot;g r&quot;.
                      </p>
                    </div>
                  ) : (
                    (Object.keys(groupedCommands) as Command["section"][]).map((section) => {
                      const items = groupedCommands[section];

                      if (items.length === 0) return null;

                      return (
                        <div key={section} className="mb-4">
                          <p
                            className="px-3 pb-2 text-[10px] font-mono uppercase tracking-[0.22em]"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {section}
                          </p>
                          <div className="space-y-1">
                            {items.map((command) => {
                              const isSelected = visibleIndex === selectedIndex;
                              const Icon = command.icon;

                              visibleIndex += 1;

                              return (
                                <button
                                  key={command.id}
                                  onClick={command.run}
                                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all"
                                  style={{
                                    backgroundColor: isSelected ? "var(--bg-tertiary)" : "transparent",
                                    border: `1px solid ${
                                      isSelected ? "var(--border-secondary)" : "transparent"
                                    }`,
                                  }}
                                >
                                  <div
                                    className="flex h-10 w-10 items-center justify-center rounded-2xl"
                                    style={{ backgroundColor: "var(--bg-accent-soft)" }}
                                  >
                                    <Icon size={16} className={command.tone || "text-axis-accent"} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                                      {command.label}
                                    </p>
                                    <p className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
                                      {command.hint}
                                    </p>
                                  </div>
                                  {command.shortcut ? (
                                    <span
                                      className="hidden rounded-lg px-2 py-1 text-[10px] font-mono uppercase sm:inline"
                                      style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-tertiary)" }}
                                    >
                                      {command.shortcut}
                                    </span>
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div
                  className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs"
                  style={{ borderColor: "var(--border-primary)", color: "var(--text-tertiary)" }}
                >
                  <p className="font-mono">Mod+K to open. G then a nav key, N then a capture key.</p>
                  <p className="font-mono">Arrows move, Enter runs.</p>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);

  if (!context) {
    throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  }

  return context;
}
