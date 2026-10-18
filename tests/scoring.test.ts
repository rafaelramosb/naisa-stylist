import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreOutfit } from "../lib/scoring.ts";
import { generateCandidates, pickTop, needsShopping } from "../lib/rules-engine.ts";
import { colorHarmony } from "../lib/color.ts";
import type { Garment } from "../lib/types.ts";

const g = (p: Partial<Garment> & Pick<Garment, "id" | "name" | "category">): Garment => ({
  colors: [], color_hex: [], pattern: "liso", fit: "regular", formality: 3, seasons: [], style_tags: [], silhouette_tags: [], ...p,
});

const closet: Garment[] = [
  g({ id: "1", name: "Blazer negro", category: "outerwear", colors: ["negro"], formality: 4, fit: "estructurado", style_tags: ["clasico"] }),
  g({ id: "2", name: "Blusa de seda marfil", category: "top", colors: ["marfil"], formality: 4, material: "seda", style_tags: ["clasico"] }),
  g({ id: "3", name: "Pantalón sastre gris", category: "bottom", subcategory: "pantalón wide-leg", colors: ["gris"], formality: 4, silhouette_tags: ["wide-leg"] }),
  g({ id: "4", name: "Stilettos nude", category: "shoes", colors: ["nude"], formality: 4 }),
  g({ id: "5", name: "Jean roto", category: "bottom", subcategory: "jean roto", colors: ["azul"], formality: 1, style_tags: ["casual"] }),
  g({ id: "6", name: "Tenis blancos", category: "shoes", subcategory: "tenis", colors: ["blanco"], formality: 1, style_tags: ["deportivo"] }),
  g({ id: "7", name: "Vestido blanco midi", category: "dress", colors: ["blanco"], formality: 4 }),
  g({ id: "8", name: "Vestido esmeralda largo", category: "dress", subcategory: "vestido largo", colors: ["esmeralda"], material: "satén", formality: 5 }),
];

test("entrevista: look sastre neutro supera 85%", () => {
  const s = scoreOutfit(closet.filter((x) => ["1", "2", "3", "4"].includes(x.id)), [], { occasion: "entrevista" });
  assert.ok(s.total >= 85, `total ${s.total}`);
});

test("entrevista: jean roto + tenis queda por debajo del umbral", () => {
  const s = scoreOutfit(closet.filter((x) => ["2", "5", "6"].includes(x.id)), [], { occasion: "entrevista" });
  assert.ok(s.total < 70, `total ${s.total}`);
  assert.ok(s.flags.length > 0);
});

test("boda: vestido blanco prohibido para invitada", () => {
  const s = scoreOutfit([closet[6], closet[3]], [], { occasion: "boda_dia", role: "invitada" });
  assert.ok(s.total <= 60);
  assert.ok(s.flags.some((f) => f.includes("novia")));
});

test("boda: vestido blanco permitido a la novia", () => {
  const s = scoreOutfit([closet[6], closet[3]], [], { occasion: "boda_dia", role: "novia" });
  assert.ok(s.total > 60);
});

test("armonía: neutros con un acento puntúan alto, cuatro colores bajo", () => {
  assert.ok(colorHarmony([{ name: "negro" }, { name: "blanco" }, { name: "rojo" }]).score >= 90);
  assert.ok(colorHarmony([{ name: "rojo" }, { name: "amarillo" }, { name: "azul" }, { name: "verde" }]).score < 60);
});

test("motor de reglas devuelve 3 outfits ordenados", () => {
  const ctx = { occasion: "entrevista" as const };
  const top = pickTop(generateCandidates(closet, ctx), closet, ctx);
  assert.equal(top.length, 3);
  assert.ok(top[0].score.total >= top[1].score.total);
  assert.ok(top[0].score.total >= 85, `best ${top[0].score.total}`);
});

test("sin prendas suficientes sugiere compras", () => {
  const small = [closet[4], closet[5]];
  const missing = needsShopping(small, { occasion: "boda_noche" });
  assert.ok(missing.length >= 1);
});

test("boda de noche: vestido joya largo supera a vestido pastel de día", () => {
  const pink = g({ id: "p", name: "Vestido midi rosa palo", category: "dress", colors: ["rosa palo"], material: "gasa", formality: 4 });
  const ctx = { occasion: "boda_noche" as const };
  const night = scoreOutfit([closet[7], closet[3]], [], ctx);
  const day = scoreOutfit([pink, closet[3]], [], ctx);
  assert.ok(night.total > day.total + 5, `noche ${night.total} vs día ${day.total}`);
});

test("las 3 opciones evitan outfits con prohibiciones si hay alternativas", () => {
  const ctx = { occasion: "boda_dia" as const, role: "invitada" as const };
  const pink = g({ id: "p", name: "Vestido midi rosa palo", category: "dress", colors: ["rosa palo"], material: "gasa", formality: 4 });
  const c = [...closet, pink];
  const top = pickTop(generateCandidates(c, ctx), c, ctx);
  assert.ok(top.every((o) => !o.pieces.some((p) => p.garment_id === "7")), "no debe sugerir el vestido blanco");
});
