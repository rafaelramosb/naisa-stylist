"use client";
import { useEffect, useState } from "react";
import { COLOR_NAMES } from "@/lib/color";
import { PALETTE_CHOICES, STYLES } from "@/lib/labels";
import { createClient } from "@/lib/supabase/client";
import type { StyleProfile } from "@/lib/types";

function toggle(list: string[] = [], v: string, max = 99) {
  return list.includes(v) ? list.filter((x) => x !== v) : list.length >= max ? list : [...list, v];
}

export default function EstiloPage() {
  const [supabase] = useState(() => createClient());
  const [p, setP] = useState<StyleProfile>({});
  const [gender, setGender] = useState("femenino");
  const [city, setCity] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("profiles").select("style_profile, gender_expression, city").single().then(({ data }) => {
      if (!data) return;
      setP((data.style_profile as StyleProfile) ?? {});
      setGender(data.gender_expression ?? "femenino");
      setCity(data.city ?? "");
    });
  }, [supabase]);

  async function save() {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update({ style_profile: p, gender_expression: gender, city: city || null, updated_at: new Date().toISOString() }).eq("id", user!.id);
    setSaved(error ? "No se pudo guardar" : "Estilo guardado. Tus próximas recomendaciones lo tendrán en cuenta.");
    setTimeout(() => setSaved(null), 3500);
  }

  return (
    <div className="stack fade-in" style={{ "--gap": "24px" } as React.CSSProperties}>
      <div className="stack" style={{ "--gap": "4px" } as React.CSSProperties}>
        <span className="eyebrow">Estilo personal</span>
        <h1 style={{ fontSize: "clamp(2rem,5vw,2.8rem)" }}>Cuéntanos cómo te gusta vestir</h1>
      </div>

      <div className="card stack">
        <h3>Tus estilos (hasta 3)</h3>
        <div className="chips">
          {STYLES.map((s) => <button key={s.id} className="chip" aria-pressed={p.styles?.includes(s.id) ?? false} onClick={() => setP({ ...p, styles: toggle(p.styles, s.id, 3) })}>{s.label}</button>)}
        </div>
      </div>

      <div className="grid grid-2">
        {([["favorite_colors", "Colores que amas"], ["avoid_colors", "Colores que evitas"]] as const).map(([key, title]) => (
          <div key={key} className="card stack">
            <h3>{title}</h3>
            <div className="chips">
              {PALETTE_CHOICES.map((c) => (
                <button key={c} className="chip row" style={{ "--gap": "6px" } as React.CSSProperties} aria-pressed={p[key]?.includes(c) ?? false} onClick={() => setP({ ...p, [key]: toggle(p[key], c, 8) })}>
                  <span className="swatch" style={{ background: COLOR_NAMES[c] }} /> {c}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="card grid grid-3">
        <label>Prendas que usas
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="femenino">Femeninas</option><option value="masculino">Masculinas</option><option value="neutro">Sin género</option>
          </select>
        </label>
        <label>¿Usas tacones?
          <select value={p.heels ?? ""} onChange={(e) => setP({ ...p, heels: (e.target.value || undefined) as StyleProfile["heels"] })}>
            <option value="">Sin preferencia</option><option value="si">Sí, siempre</option><option value="a_veces">A veces</option><option value="no">Prefiero planos</option>
          </select>
        </label>
        <label>Ciudad (para clima)
          <input type="text" value={city} placeholder="Bogotá, Cartagena…" onChange={(e) => setCity(e.target.value)} />
        </label>
      </div>

      <div className="row">
        <button className="btn" onClick={save}>Guardar mi estilo</button>
        {saved && <span className="small muted" role="status">{saved}</span>}
      </div>
    </div>
  );
}
