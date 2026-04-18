import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    const streak = searchParams.get("streak");
    const score = searchParams.get("score");

    if (!username) {
      return new ImageResponse(
        (
          <div
            style={{
              backgroundColor: "#0B0B0F",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 60,
              fontWeight: 800,
              fontFamily: "Inter, sans-serif",
            }}
          >
            AXIS
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }

    return new ImageResponse(
      (
        <div
          style={{
            backgroundColor: "#0B0B0F",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Inter, sans-serif",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background grid effect */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              opacity: 0.5,
            }}
          />

          {/* Accent Glow */}
          <div
            style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              background: "radial-gradient(circle at center, rgba(205, 255, 79, 0.15) 0%, transparent 50%)",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "32px",
              padding: "60px 100px",
              boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
              zIndex: 10,
            }}
          >
            <div
              style={{
                fontSize: 40,
                color: "#A1A1AA",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              @{username}&apos;s Prove It Profile
            </div>

            <div
              style={{
                fontSize: 100,
                fontWeight: 900,
                color: "white",
                marginBottom: 40,
                display: "flex",
                alignItems: "center",
                gap: "20px",
              }}
            >
              {streak && streak !== "0" && (
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ color: "#F97316" }}>🔥</span>
                  <span style={{ marginLeft: "20px" }}>{streak} Day Streak</span>
                </div>
              )}
            </div>

            {score && (
              <div
                style={{
                  fontSize: 40,
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(205, 255, 79, 0.1)",
                  border: "2px solid #CDFF4F",
                  color: "#CDFF4F",
                  padding: "16px 48px",
                  borderRadius: "100px",
                  fontWeight: 800,
                }}
              >
                Focus Grade: {score}
              </div>
            )}
          </div>
          
          <div style={{ position: "absolute", bottom: 40, right: 60, fontSize: 32, fontWeight: 700, color: "#A1A1AA", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#CDFF4F" }}></div>
            AXIS Business OS
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response("Failed to generate OG image", { status: 500 });
  }
}
