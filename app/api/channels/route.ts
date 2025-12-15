import neynarClient from "@/lib/neynarClient";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get("fid");

    if (!fid) {
      return NextResponse.json(
        { error: "FID is required" },
        { status: 400 }
      );
    }

    const channels = await neynarClient.fetchUserChannels({ fid: Number(fid) });

    return NextResponse.json(channels, { status: 200 });
  } catch (error) {
    console.error("Error fetching channels:", error);
    const err = error as { response?: { data?: { message?: string }; status?: number } };
    return NextResponse.json(
      { error: err.response?.data?.message || "Failed to fetch channels" },
      { status: err.response?.status || 500 }
    );
  }
};
