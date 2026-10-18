"use client";
import { useEffect, useState } from "react";
import { createClient } from "./supabase/client";

/** URLs firmadas de 1 hora para fotos privadas del clóset. */
export function useSignedUrls(paths: (string | null | undefined)[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = [...new Set(paths.filter(Boolean) as string[])].sort().join(",");
  useEffect(() => {
    const list = key ? key.split(",") : [];
    const pending = list.filter((p) => !urls[p]);
    if (!pending.length) return;
    let cancelled = false;
    createClient().storage.from("wardrobe").createSignedUrls(pending, 3600).then(({ data }) => {
      if (cancelled || !data) return;
      setUrls((prev) => {
        const next = { ...prev };
        for (const d of data) if (d.signedUrl && d.path) next[d.path] = d.signedUrl;
        return next;
      });
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return urls;
}
