import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    await sendWelcomeEmail(email, name);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Welcome email error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
