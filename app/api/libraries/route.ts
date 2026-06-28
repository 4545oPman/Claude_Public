import { NextRequest, NextResponse } from "next/server";

const CALIL_API_KEY = "ff25ceee5d4664f880eecfe3d0a3cd3d";
const CALIL_BASE = "https://api.calil.jp";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const pref = searchParams.get("pref");
  const city = searchParams.get("city");
  const limit = searchParams.get("limit") || "10";

  const params = new URLSearchParams({
    appkey: CALIL_API_KEY,
    format: "json",
    limit,
  });

  if (lat && lng) params.set("geocode", `${lng},${lat}`);
  if (pref) params.set("pref", pref);
  if (city) params.set("city", city);

  const res = await fetch(`${CALIL_BASE}/library?${params}`);
  if (!res.ok) return NextResponse.json({ error: "CALIL API error" }, { status: res.status });
  const data = await res.json();
  return NextResponse.json(data);
}
