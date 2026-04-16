"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SettingsContent() {
  const { user, loading, updateProfile, signOut } = useUser();
  const searchParams = useSearchParams();
  const upgradeStatus = searchParams.get("upgrade");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState("");

  const handleSave = async (field: string) => {
    if (!fieldValue.trim()) return;
    await updateProfile({ [field]: fieldValue.trim() });
    setEditingField(null);
    setFieldValue("");
  };

  const handleUpgrade = async () => {
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const handleManagePlan = async () => {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="axis-skeleton h-40 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Upgrade success/cancel message */}
      {upgradeStatus === "success" && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm rounded-xl px-4 py-3">
          🎉 Welcome to AXIS Pro! Enjoy unlimited everything.
        </div>
      )}
      {upgradeStatus === "cancelled" && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm rounded-xl px-4 py-3">
          Upgrade cancelled. You can upgrade anytime.
        </div>
      )}

      {/* Account */}
      <div className="axis-card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Account</h3>
        <div className="space-y-4">
          {/* Name */}
          <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border-primary)" }}>
            <div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Name</p>
              {editingField === "name" ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={fieldValue}
                    onChange={(e) => setFieldValue(e.target.value)}
                    className="text-sm rounded-lg px-3 py-1.5 outline-none"
                    style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                    autoFocus
                  />
                  <button onClick={() => handleSave("name")} className="text-xs text-axis-accent font-semibold">Save</button>
                  <button onClick={() => setEditingField(null)} className="text-xs hover:underline" style={{ color: "var(--text-tertiary)" }}>Cancel</button>
                </div>
              ) : (
                <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-tertiary)" }}>{user?.name || "Not set"}</p>
              )}
            </div>
            {editingField !== "name" && (
              <button
                onClick={() => { setEditingField("name"); setFieldValue(user?.name || ""); }}
                className="text-xs text-axis-accent hover:underline transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {/* Email */}
          <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border-primary)" }}>
            <div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Email</p>
              <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-tertiary)" }}>{user?.email}</p>
            </div>
          </div>

          {/* Timezone */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Timezone</p>
              {editingField === "timezone" ? (
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={fieldValue}
                    onChange={(e) => setFieldValue(e.target.value)}
                    className="text-sm rounded-lg px-3 py-1.5 outline-none"
                    style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern</option>
                    <option value="America/Chicago">Central</option>
                    <option value="America/Denver">Mountain</option>
                    <option value="America/Los_Angeles">Pacific</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Berlin">Berlin</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                  <button onClick={() => handleSave("timezone")} className="text-xs text-axis-accent font-semibold">Save</button>
                </div>
              ) : (
                <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-tertiary)" }}>{user?.timezone || "UTC"}</p>
              )}
            </div>
            {editingField !== "timezone" && (
              <button
                onClick={() => { setEditingField("timezone"); setFieldValue(user?.timezone || "UTC"); }}
                className="text-xs text-axis-accent hover:underline transition-colors"
              >
                Change
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Plan */}
      <div className="axis-card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Plan</h3>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{user?.plan === "pro" ? "Pro Plan" : "Free Plan"}</p>
              <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md ${
                user?.plan === "pro" ? "bg-axis-accent text-axis-dark" : ""
              }`} style={user?.plan !== "pro" ? { backgroundColor: "var(--bg-tertiary)", color: "var(--text-tertiary)" } : undefined}>
                {user?.plan === "pro" ? "PRO" : "CURRENT"}
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              {user?.plan === "pro"
                ? "Unlimited everything. Thank you for your support!"
                : "5 missions · 3 habits · 1 stream · 2 goals"}
            </p>
          </div>
        </div>
        {user?.plan === "pro" ? (
          <button
            onClick={handleManagePlan}
            className="w-full text-center text-sm font-medium px-6 py-3 rounded-xl transition-all"
            style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
          >
            Manage Subscription
          </button>
        ) : (
          <button
            onClick={handleUpgrade}
            className="w-full text-center text-sm font-semibold bg-axis-accent text-axis-dark px-6 py-3 rounded-xl hover:bg-axis-accent/90 transition-all"
          >
            Upgrade to Pro — $9/mo
          </button>
        )}
      </div>

      {/* Prove It Profile */}
      <div className="axis-card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Prove It Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Username</label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>axis.app/prove/</span>
              {editingField === "prove_it_username" ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={fieldValue}
                    onChange={(e) => setFieldValue(e.target.value)}
                    className="flex-1 text-sm rounded-lg px-3 py-2 outline-none font-mono"
                    style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                    autoFocus
                  />
                  <button onClick={() => handleSave("prove_it_username")} className="text-xs text-axis-accent font-semibold">Save</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
                    {user?.prove_it_username || "not-set"}
                  </span>
                  <button
                    onClick={() => { setEditingField("prove_it_username"); setFieldValue(user?.prove_it_username || ""); }}
                    className="text-xs text-axis-accent hover:underline ml-auto"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs font-mono block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Bio</label>
            {editingField === "prove_it_bio" ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  className="flex-1 text-sm rounded-lg px-3 py-2 outline-none"
                  style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                  autoFocus
                />
                <button onClick={() => handleSave("prove_it_bio")} className="text-xs text-axis-accent font-semibold">Save</button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {user?.prove_it_bio || "No bio set"}
                </span>
                <button
                  onClick={() => { setEditingField("prove_it_bio"); setFieldValue(user?.prove_it_bio || ""); }}
                  className="text-xs text-axis-accent hover:underline"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data / Danger zone */}
      <div className="axis-card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Data</h3>
        <div className="space-y-3">
          <button
            onClick={async () => {
              if (user?.plan !== "pro") return;
              const res = await fetch("/api/data/export");
              if (!res.ok) { alert("Export failed. Try again."); return; }
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `axis-export-${new Date().toISOString().split("T")[0]}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="w-full flex items-center justify-between py-3 px-4 rounded-xl transition-all text-sm"
            style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: user?.plan === "pro" ? "var(--text-secondary)" : "var(--text-tertiary)" }}
            onMouseEnter={(e) => { if (user?.plan === "pro") { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"; e.currentTarget.style.color = user?.plan === "pro" ? "var(--text-secondary)" : "var(--text-tertiary)"; }}
          >
            Export Data (CSV)
            {user?.plan !== "pro" && (
              <span className="text-xs font-mono text-axis-accent">Pro</span>
            )}
          </button>
          <button
            onClick={async () => {
              const confirmed = confirm(
                "Are you sure? This will permanently delete your account and ALL your data — missions, habits, revenue, goals, and everything else. This cannot be undone."
              );
              if (!confirmed) return;
              const res = await fetch("/api/account/delete", { method: "DELETE" });
              if (res.ok) {
                await signOut();
              } else {
                alert("Something went wrong. Please try again or contact support.");
              }
            }}
            className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-red-500/5 border border-red-500/10 text-sm text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-all"
          >
            Delete Account
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sign out */}
      <div className="text-center">
        <button
          onClick={signOut}
          className="text-sm transition-colors hover:underline"
          style={{ color: "var(--text-tertiary)" }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto"><div className="axis-skeleton h-40 w-full rounded-2xl" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}
