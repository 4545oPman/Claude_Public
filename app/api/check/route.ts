import { NextRequest, NextResponse } from "next/server";

const CALIL_API_KEY = "ff25ceee5d4664f880eecfe3d0a3cd3d";
const CALIL_BASE = "https://api.calil.jp";

type CalilCheckResponse = {
  session: string;
  continue: number;
  books: Record<string, Record<string, { status: string; reserveurl: string; libkeys: Record<string, string> }>>;
};

async function poll(session: string): Promise<CalilCheckResponse> {
  const params = new URLSearchParams({
    appkey: CALIL_API_KEY,
    session,
    format: "json",
  });
  const res = await fetch(`${CALIL_BASE}/check?${params}`);
  return res.json() as Promise<CalilCheckResponse>;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isbn = searchParams.get("isbn");
  const systemid = searchParams.get("systemid");

  if (!isbn || !systemid) {
    return NextResponse.json({ error: "isbn and systemid are required" }, { status: 400 });
  }

  const params = new URLSearchParams({
    appkey: CALIL_API_KEY,
    isbn,
    systemid,
    format: "json",
  });

  const initRes = await fetch(`${CALIL_BASE}/check?${params}`);
  let data: CalilCheckResponse = await initRes.json();

  let retries = 0;
  while (data.continue === 1 && retries < 5) {
    await new Promise((r) => setTimeout(r, 2000));
    data = await poll(data.session);
    retries++;
  }

  return NextResponse.json(data);
}
