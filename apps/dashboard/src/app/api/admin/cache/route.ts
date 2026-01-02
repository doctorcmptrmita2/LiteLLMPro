import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cache temizleme işlemi - şimdilik placeholder
    // Redis veya başka cache sistemi eklendiğinde burada temizlenir
    
    return NextResponse.json({ success: true, message: "Cache cleared" });
  } catch (error) {
    console.error("Failed to clear cache:", error);
    return NextResponse.json({ error: "Failed to clear cache" }, { status: 500 });
  }
}
