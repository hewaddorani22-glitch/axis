"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconDownload } from "@/components/icons";

export interface ScorecardDownloadData {
  displayName: string;
  username?: string | null;
  grade: string;
  focusScore: number;
  todayDone: number;
  todayTotal: number;
  todayHabits: number;
  habitsTotal: number;
  streak: number;
  completionRate: number;
}

interface ScorecardDownloadButtonProps {
  data: ScorecardDownloadData;
  className?: string;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let shortened = text;
  while (shortened.length > 1 && ctx.measureText(`${shortened}...`).width > maxWidth) {
    shortened = shortened.slice(0, -1);
  }
  return `${shortened}...`;
}

export function ScorecardDownloadButton({ data, className }: ScorecardDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const downloadCard = async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not available");

      const accent = "#CDFF4F";
      const bg = "#090A0A";
      const panel = "#111312";
      const panelSoft = "#181B19";
      const text = "#F5F7F2";
      const muted = "#8A9286";

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(205, 255, 79, 0.08)";
      ctx.beginPath();
      ctx.arc(880, 120, 280, 0, Math.PI * 2);
      ctx.fill();

      roundedRect(ctx, 84, 84, 912, 1182, 48);
      ctx.fillStyle = panel;
      ctx.fill();
      ctx.strokeStyle = "rgba(205, 255, 79, 0.24)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(142, 154, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = bg;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(142, 126);
      ctx.lineTo(142, 182);
      ctx.moveTo(114, 154);
      ctx.lineTo(170, 154);
      ctx.stroke();

      ctx.fillStyle = text;
      ctx.font = "700 34px Inter, Arial, sans-serif";
      ctx.fillText("lomoura", 188, 166);
      ctx.fillStyle = muted;
      ctx.font = "500 24px Inter, Arial, sans-serif";
      ctx.fillText("Daily Scorecard", 188, 204);

      ctx.textAlign = "center";
      ctx.fillStyle = muted;
      ctx.font = "600 28px Inter, Arial, sans-serif";
      ctx.fillText(fitText(ctx, data.displayName, 720), 540, 330);

      ctx.fillStyle = accent;
      ctx.font = "800 196px Inter, Arial, sans-serif";
      ctx.fillText(data.grade, 540, 520);

      ctx.fillStyle = text;
      ctx.font = "700 48px Inter, Arial, sans-serif";
      ctx.fillText(`${data.focusScore}/100`, 540, 592);
      ctx.fillStyle = muted;
      ctx.font = "600 24px Inter, Arial, sans-serif";
      ctx.fillText("Focus Score", 540, 630);

      const statY = 740;
      const statWidth = 246;
      const statGap = 30;
      const stats = [
        { label: "MISSIONS", value: `${data.todayDone}/${data.todayTotal}` },
        { label: "HABITS", value: `${data.todayHabits}/${data.habitsTotal}` },
        { label: "STREAK", value: `${data.streak}` },
      ];

      stats.forEach((stat, index) => {
        const x = 149 + index * (statWidth + statGap);
        roundedRect(ctx, x, statY, statWidth, 166, 28);
        ctx.fillStyle = panelSoft;
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.stroke();

        ctx.fillStyle = text;
        ctx.font = "800 46px Inter, Arial, sans-serif";
        ctx.fillText(stat.value, x + statWidth / 2, statY + 76);
        ctx.fillStyle = muted;
        ctx.font = "700 20px Inter, Arial, sans-serif";
        ctx.fillText(stat.label, x + statWidth / 2, statY + 122);
      });

      roundedRect(ctx, 149, 964, 782, 124, 30);
      ctx.fillStyle = "rgba(205, 255, 79, 0.10)";
      ctx.fill();
      ctx.strokeStyle = "rgba(205, 255, 79, 0.22)";
      ctx.stroke();
      ctx.fillStyle = text;
      ctx.font = "700 34px Inter, Arial, sans-serif";
      ctx.fillText(`${data.completionRate}% active over the last 28 days`, 540, 1038);

      ctx.fillStyle = muted;
      ctx.font = "500 24px Inter, Arial, sans-serif";
      const handle = data.username ? `lomoura.com/prove/${data.username}` : "lomoura.com";
      ctx.fillText(handle, 540, 1168);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Could not create image");

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lomoura-scorecard-${new Date().toISOString().split("T")[0]}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 500);
      toast.success("Scorecard downloaded");
    } catch {
      toast.error("Could not download card");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={downloadCard}
      disabled={downloading}
      className={
        className ||
        "inline-flex items-center justify-center gap-2 text-xs font-semibold bg-axis-accent text-axis-dark px-6 py-2.5 rounded-lg hover:bg-axis-accent/90 transition-all disabled:opacity-50"
      }
    >
      <IconDownload size={14} />
      {downloading ? "Preparing..." : "Download Card"}
    </button>
  );
}
