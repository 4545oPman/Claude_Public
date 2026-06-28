"use client";

import { useState, useCallback } from "react";

type Library = {
  systemid: string;
  systemname: string;
  libkey: string;
  libid: string;
  short: string;
  formal: string;
  url: string;
  address: string;
  pref: string;
  city: string;
  post: string;
  tel: string;
  geocode: string;
  category: string;
  distance?: number;
};

type BookStatus = {
  status: string;
  reserveurl: string;
  libkeys: Record<string, string>;
};

type CheckResult = {
  books: Record<string, Record<string, BookStatus>>;
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  OK: { label: "貸出可", color: "text-green-400" },
  Running: { label: "確認中", color: "text-yellow-400" },
  Checking: { label: "確認中", color: "text-yellow-400" },
  Error: { label: "エラー", color: "text-red-400" },
  "": { label: "不明", color: "text-gray-400" },
};

function statusStyle(s: string) {
  if (s === "OK") return "text-green-400";
  if (s === "Running" || s === "Checking") return "text-yellow-400";
  if (s === "Error") return "text-red-400";
  return "text-gray-400";
}

function statusLabel(s: string) {
  return STATUS_LABEL[s]?.label ?? s;
}

export default function LibrarySearch() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [located, setLocated] = useState(false);

  // Book search
  const [isbn, setIsbn] = useState("");
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);

  const findNearby = useCallback(() => {
    if (!navigator.geolocation) {
      setError("このブラウザは位置情報に対応していません。");
      return;
    }
    setLoading(true);
    setError(null);
    setLibraries([]);
    setLocated(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `/api/libraries?lat=${latitude}&lng=${longitude}&limit=20`
          );
          if (!res.ok) throw new Error("APIエラーが発生しました");
          const data: Library[] = await res.json();
          setLibraries(data);
          setLocated(true);
        } catch (e) {
          setError(e instanceof Error ? e.message : "エラーが発生しました");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError("位置情報の取得に失敗しました: " + err.message);
        setLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  const checkBook = useCallback(async (systemid: string) => {
    if (!isbn.trim()) return;
    setSelectedSystem(systemid);
    setCheckResult(null);
    setCheckLoading(true);
    try {
      const res = await fetch(`/api/check?isbn=${encodeURIComponent(isbn.trim())}&systemid=${encodeURIComponent(systemid)}`);
      if (!res.ok) throw new Error("APIエラー");
      const data: CheckResult = await res.json();
      setCheckResult(data);
    } catch {
      // silently fail — status shown via null result
    } finally {
      setCheckLoading(false);
    }
  }, [isbn]);

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white px-4 py-12 font-sans">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">📚</span>
          <h1 className="text-xl font-semibold tracking-tight">近くの図書館を探す</h1>
        </div>
        <p className="text-sm text-gray-500 mb-8">現在地から最寄りの図書館を検索します。Powered by <span className="text-indigo-400">カーリル</span></p>

        {/* Location button */}
        <button
          onClick={findNearby}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors mb-6"
        >
          {loading ? "検索中..." : "現在地から図書館を検索"}
        </button>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 mb-6">
            {error}
          </div>
        )}

        {/* ISBN search */}
        {located && libraries.length > 0 && (
          <div className="mb-8 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-widest">本の在庫を確認</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="ISBNを入力（例: 9784003101315）"
                className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-sm placeholder-gray-600 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">ISBN入力後、図書館名の「在庫確認」ボタンを押してください</p>
          </div>
        )}

        {/* Library list */}
        {libraries.length > 0 && (
          <ul className="space-y-3">
            {libraries.map((lib) => {
              const bookStatuses = checkResult?.books[isbn.replace(/-/g, "")];
              const sysStatus = bookStatuses?.[lib.systemid];

              return (
                <li
                  key={lib.libid}
                  className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 hover:border-white/[0.14] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{lib.formal || lib.short}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{lib.address}</p>
                      {lib.tel && (
                        <p className="text-xs text-gray-600 mt-0.5">📞 {lib.tel}</p>
                      )}
                      {lib.url && (
                        <a
                          href={lib.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-400 hover:underline mt-1 inline-block"
                        >
                          ウェブサイト →
                        </a>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {isbn.trim() && (
                        <button
                          onClick={() => checkBook(lib.systemid)}
                          disabled={checkLoading && selectedSystem === lib.systemid}
                          className="text-xs bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 rounded-lg px-3 py-1.5 text-indigo-300 transition-colors disabled:opacity-50"
                        >
                          {checkLoading && selectedSystem === lib.systemid ? "確認中..." : "在庫確認"}
                        </button>
                      )}

                      {sysStatus && (
                        <div className="text-right">
                          <span className={`text-xs font-medium ${statusStyle(sysStatus.status)}`}>
                            {statusLabel(sysStatus.status)}
                          </span>
                          {sysStatus.reserveurl && sysStatus.status === "OK" && (
                            <a
                              href={sysStatus.reserveurl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs text-indigo-400 hover:underline mt-0.5"
                            >
                              予約する →
                            </a>
                          )}
                          {sysStatus.libkeys && Object.keys(sysStatus.libkeys).length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {Object.entries(sysStatus.libkeys).map(([key, val]) => (
                                <p key={key} className="text-xs text-gray-500">
                                  {key}: <span className={statusStyle(val)}>{val}</span>
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {located && libraries.length === 0 && !loading && (
          <p className="text-center text-gray-500 text-sm mt-8">近くに図書館が見つかりませんでした。</p>
        )}
      </div>
    </main>
  );
}
