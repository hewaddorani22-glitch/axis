"use client";

import {
  ReactNode,
  createContext,
  startTransition,
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { useStreak } from "@/hooks/useStreak";
import { cn } from "@/lib/utils";
import {
  IconCommand,
  IconGoals,
  IconHabits,
  IconRevenue,
  IconSearch,
  IconSettings,
  IconTarget,
} from "@/components/icons";
import { pageTitles, primaryNavItems, secondaryNavItems } from "@/components/app/navigation";

type CommandPaletteContextValue = {
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
};

type Command = {
  id: string;
  section: string;
  label: string;
  description: string;
  keywords: string[];
  shortcut: string;
  icon: ReactNode;
  run: () => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { streak } = useStreak();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const sequenceRef = useRef<string | null>(null);
  const sequenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deferredQuery = useDeferredValue(query);

  const closePalette = () => {
    setOpen(false);
    setQuery("");
  };

  const navigate = (href: string) => {
    closePalette();
    startTransition(() => {
      router.push(href);
    });
  };

  const commands = useMemo<Command[]>(() => {
    const navCommands = [...primaryNavItems, ...secondaryNavItems].map((item) => ({
      id: item.href,
      section: "Jump",
      label: item.label,
      description: `Open ${item.label.toLowerCase()}.`,
      keywords: [item.label, item.href, "go", "open", "navigate"],
      shortcut: `g ${item.shortcutKey}`,
      icon: <item.icon size={16} className="text-axis-accent" />,
      run: () => navigate(item.href),
    }));

    return [
      ...navCommands,
      {
        id: "new-mission",
        section: "Create",
        label: "New Mission",
        description: "Jump to Mission Control and focus the quick-add input.",
        keywords: ["mission", "task", "todo", "quick add"],
        shortcut: "n m",
        icon: <IconTarget size={16} className="text-axis-accent" />,
        run: () => navigate("/missions?quickAdd=1"),
      },
      {
        id: "new-habit",
        section: "Create",
        label: "New Habit",
        description: "Open Daily Systems and focus the add-habit form.",
        keywords: ["habit", "system", "routine", "quick add"],
        shortcut: "n h",
        icon: <IconHabits size={16} className="text-axis-accent" />,
        run: () => navigate("/systems?quickAdd=1"),
      },
      {
        id: "new-goal",
        section: "Create",
        label: "New Goal",
        description: "Open Goals and start a new target.",
        keywords: ["goal", "target", "milestone", "quick add"],
        shortcut: "n g",
        icon: <IconGoals size={16} className="text-axis-accent" />,
        run: () => navigate("/goals?quickAdd=1"),
      },
      {
        id: "log-income",
        section: "Create",
        label: "Log Income",
        description: "Open Revenue Tracker and start a new income entry.",
        keywords: ["revenue", "income", "payment", "sale", "quick add"],
        shortcut: "n r",
        icon: <IconRevenue size={16} className="text-emerald-500" />,
        run: () => navigate("/revenue?quickAdd=1"),
      },
      {
        id: "toggle-theme",
        section: "App",
        label: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
        description: "Toggle the app theme.",
        keywords: ["theme", "dark", "light", "appearance"],
        shortcut: "",
        icon: <IconSettings size={16} className="text-axis-accent" />,
        run: () => {
          closePalette();
          toggleTheme();
        },
      },
    ];
  }, [navigate, theme, toggleTheme]);

  const filteredCommands = useMemo(() => {
    const terms = deferredQuery
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (terms.length === 0) return commands;

    return commands.filter((command) => {
      const haystack = [command.label, command.description, command.shortcut, ...command.keywords]
        .join(" ")
        .toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [commands, deferredQuery]);

  const groupedCommands = useMemo(() => {
    return filteredCommands.reduce<Record<string, Command[]>>((groups, command) => {
      if (!groups[command.section]) groups[command.section] = [];
      groups[command.section].push(command);
      return groups;
    }, {});
  }, [filteredCommands]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [deferredQuery, open]);

  useEffect(() => {
    closePalette();
  }, [pathname]);

  useEffect(() => {
    const label = pageTitles[pathname] || "AXIS";
    document.title = streak > 0 ? `${streak}-day streak | ${label} | AXIS` : `${label} | AXIS`;
  }, [pathname, streak]);

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
    const clearSequence = () => {
      if (sequenceTimeoutRef.current) clearTimeout(sequenceTimeoutRef.current);
      sequenceRef.current = null;
    };

    const setSequence = (next: string) => {
      clearSequence();
      sequenceRef.current = next;
      sequenceTimeoutRef.current = setTimeout(() => {
        sequenceRef.current = null;
      }, 900);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const withModifier = event.metaKey || event.ctrlKey;

      if (withModifier && key === "k") {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (open && key === "escape") {
        event.preventDefault();
        closePalette();
        return;
      }

      if (open || isTypingTarget(event.target)) return;

      if (sequenceRef.current === "g") {
        const destination = [...primaryNavItems, ...secondaryNavItems].find((item) => item.shortcutKey === key);
        if (destination) {
          event.preventDefault();
          clearSequence();
          navigate(destination.href);
          return;
        }
      }

      if (sequenceRef.current === "n") {
        const quickActions: Record<string, string> = {
          m: "/missions?quickAdd=1",
          h: "/systems?quickAdd=1",
          g: "/goals?quickAdd=1",
          r: "/revenue?quickAdd=1",
        };
        if (quickActions[key]) {
          event.preventDefault();
          clearSequence();
          navigate(quickActions[key]);
          return;
        }
      }

      if (key === "g" || key === "n") {
        event.preventDefault();
        setSequence(key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (sequenceTimeoutRef.current) clearTimeout(sequenceTimeoutRef.current);
    };
  }, [navigate, open]);

  return (
    <CommandPaletteContext.Provider
      value={{
        openPalette: () => setOpen(true),
        closePalette,
        togglePalette: () => setOpen((value) => !value),
      }}
    >
      {children}

      {open && (
        <div className="fixed inset-0 z-[80] bg-black/55 px-4 py-8 backdrop-blur-sm" onClick={closePalette}>
          <div
            className="mx-auto flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px]"
            style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)", boxShadow: "0 30px 80px rgba(0,0,0,0.28)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b px-4 py-4" style={{ borderColor: "var(--border-primary)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                <IconSearch size={18} style={{ color: "var(--text-tertiary)" }} />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setSelectedIndex((index) => Math.min(index + 1, filteredCommands.length - 1));
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setSelectedIndex((index) => Math.max(index - 1, 0));
                  }
                  if (event.key === "Enter" && filteredCommands[selectedIndex]) {
                    event.preventDefault();
                    filteredCommands[selectedIndex].run();
                  }
                }}
                placeholder="Jump, create, or search commands..."
                className="flex-1 bg-transparent text-base outline-none placeholder:text-white/20"
                style={{ color: "var(--text-primary)" }}
              />
              <button
                onClick={closePalette}
                className="rounded-xl px-3 py-2 text-xs font-mono"
                style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}
              >
                ESC
              </button>
            </div>

            <div className="axis-scrollbar overflow-y-auto px-3 py-3">
              {filteredCommands.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                    <IconCommand size={24} style={{ color: "var(--text-tertiary)" }} />
                  </div>
                  <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                    No matching commands
                  </p>
                  <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    Try page names, actions like "new mission", or shortcuts like "g m".
                  </p>
                </div>
              ) : (
                Object.entries(groupedCommands).map(([section, items]) => (
                  <div key={section} className="mb-4">
                    <p className="px-3 pb-2 text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: "var(--text-tertiary)" }}>
                      {section}
                    </p>
                    <div className="space-y-1">
                      {items.map((command) => {
                        const absoluteIndex = filteredCommands.findIndex((item) => item.id === command.id);
                        const isSelected = absoluteIndex === selectedIndex;
                        return (
                          <button
                            key={command.id}
                            onClick={command.run}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all",
                              isSelected ? "translate-x-0.5" : ""
                            )}
                            style={{
                              backgroundColor: isSelected ? "var(--bg-tertiary)" : "transparent",
                              border: `1px solid ${isSelected ? "var(--border-secondary)" : "transparent"}`,
                            }}
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--bg-accent-soft)" }}>
                              {command.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                                {command.label}
                              </p>
                              <p className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
                                {command.description}
                              </p>
                            </div>
                            {command.shortcut && (
                              <span
                                className="rounded-lg px-2 py-1 text-[10px] font-mono uppercase"
                                style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-tertiary)" }}
                              >
                                {command.shortcut}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs" style={{ borderColor: "var(--border-primary)", color: "var(--text-tertiary)" }}>
              <p className="font-mono">Mod+K opens palette. Use G then a page key, or N then a create key.</p>
              <p className="font-mono">Arrows to move, Enter to run.</p>
            </div>
          </div>
        </div>
      )}
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
