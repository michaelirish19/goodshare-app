import { NextResponse } from "next/server";
import { fetchLinkPreview } from "@/lib/fetchLinkPreview";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "Missing url parameter." },
        { status: 400 }
      );
    }

    const preview = await fetchLinkPreview(url);

    if (!preview) {
      return NextResponse.json(
        { error: "Could not fetch preview." },
        { status: 404 }
      );
    }

    return NextResponse.json(preview);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}