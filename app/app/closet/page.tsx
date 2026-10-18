"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GarmentArt } from "@/components/GarmentArt";
import { Icon } from "@/components/Icon";
import { COLOR_NAMES } from "@/lib/color";
import { dataUrlToBlob, dominantHex, fileToResizedDataUrl } from "@/lib/image-client";
import { CATEGORY_LABEL, CATEGORY_SINGULAR, FORMALITY_LABEL, PALETTE_CHOICES } from "@/lib/labels";
import { createClient } from "@/lib/supabase/client";
import type { Category, Garment } from "@/lib/types";
import { useSignedUrls } from "@/lib/use-signed-urls";

type Draft = Omit<Garment, "id"> & { _key: string; keep: boolean };
const CATS = Object.keys(CATEGORY_LABEL) as Category[];

export default function ClosetPage() {
  const [supabase] = useState(() => createClient());
  const [items, setItems] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [photo, setPhoto] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [busy, setBusy] = useState<"" | "scan" | "save">("");
  const [note, setNote] = useState<{ kind: "ok" | "err" | "warn"; text: string; upgrade?: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = useSignedUrls(items.map((i) => i.image_path));

  const load = useCallback(async () => {
    const { data } = await supabase.from("garments").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as Garment[]);
    setLoading(false);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  async function onFile(file?: File) {
    if (!file) return;
    setNote(null); setDrafts([]); setBusy("scan");
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setPhoto(dataUrl);
      const t0 = performance.now();
      const res = await fetch("/api/garments/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: dataUrl }) });
      const body = await res.json();
      if (!res.ok) { setNote({ kind: "err", text: body.error, upgrade: body.upgrade }); setPhoto(null); return; }
      if (body.mode === "manual" || !body.garments?.length) {
        const hex = await dominantHex(dataUrl);
        setDrafts([{ _key: crypto.randomUUID(), keep: true, name: "", category: "top", colors: [], color_hex: [hex], pattern: "liso", fit: "regular", formality: 3, seasons: [], style_tags: [], silhouette_tags: [] }]);
        setNote({ kind: "warn", text: body.warning ?? "Completa los datos de la prenda. Detectamos su color automáticamente." });
      } else {
        setDrafts(body.garments.map((g: Omit<Garment, "id">) => ({ ...g, _key: crypto.randomUUID(), keep: true })));
        const secs = ((performance.now() - t0) / 1000).toFixed(1);
        setNote({ kind: "ok", text: `Detectamos ${body.garments.length} prenda(s) en ${secs} s. Revisa y guarda.${body.tip ? " " + body.tip : ""}` });
      }
    } catch {
      setNote({ kind: "err", text: "No pudimos leer la imagen. Prueba con otra foto." });
    } finally {
      setBusy("");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function save() {
    const keep = drafts.filter((d) => d.keep && d.name.trim());
    if (!keep.length || !photo) return;
    setBusy("save");
    const { data: { user } } = await supabase.auth.getUser();
    const path = `${user!.id}/${crypto.randomUUID()}.jpg`;
    const up = await supabase.storage.from("wardrobe").upload(path, dataUrlToBlob(photo), { contentType: "image/jpeg" });
    if (up.error) { setNote({ kind: "err", text: "No se pudo subir la foto." }); setBusy(""); return; }
    const rows = keep.map(({ _key, keep: _k, ...g }) => {
      void _key; void _k;
      return { ...g, image_path: path, colors: g.colors.length ? g.colors : ["beige"] };
    });
    const { error } = await supabase.from("garments").insert(rows);
    setBusy("");
    if (error) {
      const limit = error.message.includes("LIMITE_PRENDAS");
      setNote({ kind: "err", text: limit ? "Tu plan gratis admite 30 prendas. Pasa a Premium para un clóset ilimitado." : "No se pudo guardar.", upgrade: limit });
      if (limit) await supabase.storage.from("wardrobe").remove([path]);
      return;
    }
    setNote({ kind: "ok", text: `${rows.length} prenda(s) agregadas a tu clóset.` });
    setDrafts([]); setPhoto(null);
    load();
  }

  async function remove(g: Garment) {
    if (!confirm(`¿Eliminar "${g.name}" de tu clóset?`)) return;
    await supabase.from("garments").delete().eq("id", g.id);
    if (g.image_path && !items.some((i) => i.id !== g.id && i.image_path === g.image_path)) {
      await supabase.storage.from("wardrobe").remove([g.image_path]);
    }
    setItems((prev) => prev.filter((i) => i.id !== g.id));
  }

  const update = (key: string, patch: Partial<Draft>) => setDrafts((d) => d.map((x) => (x._key === key ? { ...x, ...patch } : x)));
  const shown = filter === "all" ? items : items.filter((i) => i.category === filter);
  const counts = CATS.map((c) => [c, items.filter((i) => i.category === c).length] as const);

  return (
    <div className="stack fade-in" style={{ "--gap": "24px" } as React.CSSProperties}>
      <div className="row between">
        <div className="stack" style={{ "--gap": "4px" } as React.CSSProperties}>
          <span className="eyebrow">Clóset digital</span>
          <h1 style={{ fontSize: "clamp(2rem,5vw,2.8rem)" }}>Tus prendas ({items.length})</h1>
        </div>
        <button className="btn" onClick={() => inputRef.current?.click()} disabled={!!busy}><Icon name="camera" size={18} /> Escanear prenda</button>
      </div>

      <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />

      {!photo && (
        <div className="dropzone" role="button" tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}>
          <div className="stack" style={{ alignItems: "center", "--gap": "8px" } as React.CSSProperties}>
            {busy === "scan" ? <span className="spin" /> : <Icon name="upload" size={28} />}
            <strong style={{ fontWeight: 500 }}>{busy === "scan" ? "Reconociendo prendas…" : "Toma o sube una foto"}</strong>
            <span className="small muted">Fondo liso y buena luz. Puedes fotografiar varias prendas juntas sobre la cama.</span>
          </div>
        </div>
      )}

      {note && (
        <div className={`alert ${note.kind === "ok" ? "alert-ok" : note.kind === "warn" ? "alert-warn" : "alert-err"}`} role="status">
          {note.text} {note.upgrade && <Link href="/app/plan" className="link">Ver Premium</Link>}
        </div>
      )}

      {photo && drafts.length > 0 && (
        <div className="card stack fade-in">
          <div className="row" style={{ alignItems: "flex-start" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Foto escaneada" style={{ width: 120, borderRadius: 12 }} />
            <div className="stack" style={{ flex: 1, minWidth: 240 }}>
              {drafts.map((d) => (
                <div key={d._key} className="card-soft stack" style={{ opacity: d.keep ? 1 : 0.5, "--gap": "10px" } as React.CSSProperties}>
                  <div className="row between">
                    <label style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <input type="checkbox" checked={d.keep} onChange={(e) => update(d._key, { keep: e.target.checked })} /> Guardar
                    </label>
                    <span className="row" style={{ "--gap": "4px" } as React.CSSProperties}>
                      {(d.color_hex.length ? d.color_hex : d.colors.map((c) => COLOR_NAMES[c] ?? "#ccc")).slice(0, 3).map((h, i) => <span key={i} className="swatch" style={{ background: h }} />)}
                    </span>
                  </div>
                  <div className="grid grid-2" style={{ "--gap": "10px" } as React.CSSProperties}>
                    <label>Nombre<input type="text" value={d.name} placeholder="Ej. Blazer camel cruzado" onChange={(e) => update(d._key, { name: e.target.value })} /></label>
                    <label>Categoría
                      <select value={d.category} onChange={(e) => update(d._key, { category: e.target.value as Category })}>
                        {CATS.map((c) => <option key={c} value={c}>{CATEGORY_SINGULAR[c]}</option>)}
                      </select>
                    </label>
                    <label>Color principal
                      <select value={d.colors[0] ?? ""} onChange={(e) => update(d._key, { colors: [e.target.value, ...d.colors.slice(1)], color_hex: [COLOR_NAMES[e.target.value] ?? d.color_hex[0], ...d.color_hex.slice(1)] })}>
                        <option value="">Elige…</option>
                        {[...new Set([...(d.colors[0] ? [d.colors[0]] : []), ...PALETTE_CHOICES, "marfil", "crema", "plata"])].map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </label>
                    <label>Formalidad: {FORMALITY_LABEL[d.formality]}
                      <input type="range" min={1} max={5} value={d.formality} onChange={(e) => update(d._key, { formality: Number(e.target.value) })} />
                    </label>
                  </div>
                  {(d.material || d.subcategory) && <span className="tiny muted">{[d.subcategory, d.material, d.pattern, d.fit].filter(Boolean).join(" · ")}</span>}
                </div>
              ))}
              <div className="row">
                <button className="btn" onClick={save} disabled={busy === "save" || !drafts.some((d) => d.keep && d.name.trim())}>
                  {busy === "save" ? <span className="spin" /> : <Icon name="check" size={18} />} Guardar en mi clóset
                </button>
                <button className="btn btn-ghost" onClick={() => { setDrafts([]); setPhoto(null); setNote(null); }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="chips" role="group" aria-label="Filtrar por categoría">
        <button className="chip" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Todo ({items.length})</button>
        {counts.filter(([, n]) => n > 0).map(([c, n]) => (
          <button key={c} className="chip" aria-pressed={filter === c} onClick={() => setFilter(c)}>{CATEGORY_LABEL[c]} ({n})</button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-closet">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: "3/4" }} />)}</div>
      ) : shown.length === 0 ? (
        <div className="card-soft stack" style={{ textAlign: "center", alignItems: "center" }}>
          <Icon name="closet" size={36} />
          <p>Tu clóset está vacío. Empieza por tus básicos: un blazer, una blusa, un pantalón y unos zapatos.</p>
        </div>
      ) : (
        <div className="grid grid-closet">
          {shown.map((g) => (
            <div key={g.id} className="garment">
              <div className="thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {g.image_path && urls[g.image_path] ? <img src={urls[g.image_path]} alt={g.name} loading="lazy" /> : <GarmentArt category={g.category} color={g.color_hex[0] ?? COLOR_NAMES[g.colors[0]]} label={g.name} />}
              </div>
              <div className="meta">
                <strong>{g.name}</strong>
                <div className="row between" style={{ "--gap": "4px" } as React.CSSProperties}>
                  <span className="muted tiny">{FORMALITY_LABEL[g.formality]}</span>
                  <button className="link tiny" onClick={() => remove(g)} aria-label={`Eliminar ${g.name}`}><Icon name="trash" size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
