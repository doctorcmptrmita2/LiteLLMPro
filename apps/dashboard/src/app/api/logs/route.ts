import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.CFX_API_URL || "http://localhost:8000";
const API_KEY = process.env.CFX_API_KEY || "cfx_testkey1234567890abcdef";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    const response = await fetch(`${API_BASE}/api/logs?${queryString}`, {
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Logs API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
