import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";

export type Viagem = {
  usuario: string;
  linha: string;
  data: string;
  hora: string;
  obs: string;
  timestamp: string;
};

export type Rotas = Record<string, unknown>;

const VIAGENS_HEADER = "usuario,linha,data,hora,obs,timestamp\n";

function getBuslogPath(relative: string) {
  // Projeto Next está em d:\buslog2\buslog-web
  // Os dados vivem em d:\buslog2\buslog
  return path.join(process.cwd(), "..", "buslog", relative);
}

export async function loadRotas(): Promise<Rotas> {
  const filePath = getBuslogPath("rotasrj.json");
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data) as Rotas;
}

export async function loadViagens(): Promise<Viagem[]> {
  const filePath = getBuslogPath("viagens.csv");
  const csv = await fs.readFile(filePath, "utf-8");

  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Viagem[];

  return records.map((r) => ({
    usuario: r.usuario?.toLowerCase().trim() ?? "",
    linha: r.linha ?? "",
    data: r.data ?? "",
    hora: r.hora ?? "",
    obs: r.obs ?? "",
    timestamp: r.timestamp ?? "",
  }));
}

export async function loadViagensByUsuario(usuario: string): Promise<Viagem[]> {
  const all = await loadViagens();
  const normalized = usuario.toLowerCase().trim();
  const filtered = all.filter((v) => v.usuario === normalized);

  return filtered.sort((a, b) => {
    const aKey = `${a.data}T${a.hora}`;
    const bKey = `${b.data}T${b.hora}`;
    return aKey < bKey ? 1 : aKey > bKey ? -1 : 0;
  });
}

function toCsvField(value: string | undefined | null): string {
  const safe = (value ?? "").toString();
  // Escapa aspas dobrando-as e envolve em aspas
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function saveViagens(viagens: Viagem[]): Promise<void> {
  const filePath = getBuslogPath("viagens.csv");

  const lines = viagens.map((v) =>
    [
      toCsvField(v.usuario),
      toCsvField(v.linha),
      toCsvField(v.data),
      toCsvField(v.hora),
      toCsvField(v.obs),
      toCsvField(v.timestamp),
    ].join(","),
  );

  const csv = VIAGENS_HEADER + lines.join("\n") + "\n";
  await fs.writeFile(filePath, csv, "utf-8");
}

export async function addViagem(nova: Omit<Viagem, "timestamp">): Promise<Viagem> {
  const viagens = await loadViagens();
  const viagemCompleta: Viagem = {
    ...nova,
    usuario: nova.usuario.toLowerCase().trim(),
    timestamp: new Date().toISOString(),
  };
  viagens.push(viagemCompleta);
  await saveViagens(viagens);
  return viagemCompleta;
}

export async function deleteViagemByTimestamp(
  usuario: string,
  timestamp: string,
): Promise<boolean> {
  const viagens = await loadViagens();
  const normalized = usuario.toLowerCase().trim();
  const before = viagens.length;
  const restantes = viagens.filter(
    (v) => !(v.usuario === normalized && v.timestamp === timestamp),
  );
  const changed = restantes.length !== before;
  if (changed) {
    await saveViagens(restantes);
  }
  return changed;
}


