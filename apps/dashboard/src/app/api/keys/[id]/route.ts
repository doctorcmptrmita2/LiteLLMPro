import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.CFX_API_URL || "http://localhost:8000";
const API_KEY = process.env.CFX_API_KEY || "cfx_testkey1234567890abcdef";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const response = await fetch(`${API_BASE}/api/keys/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
      },
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
    console.error("Delete key API error:", error);
    return NextResponse.json(
      { error: "Failed to delete key" },
      { status: 500 }
    );
  }
}
