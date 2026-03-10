/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";

type Viagem = {
  usuario: string;
  linha: string;
  data: string;
  hora: string;
  obs: string;
  timestamp: string;
};

type Props = {
  initialUsuario?: string;
};

type Rotas = Record<string, unknown>;

export function BuslogClient({ initialUsuario = "" }: Props) {
  const [usuario, setUsuario] = useState(initialUsuario);
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [rotas, setRotas] = useState<Rotas | null>(null);
  const [linha, setLinha] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [obs, setObs] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedUsuario = usuario.toLowerCase().trim();

  const linhasOrdenadas = useMemo(() => {
    if (!rotas) return [] as string[];
    return Object.keys(rotas).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [rotas]);

  async function carregarRotas() {
    try {
      const res = await fetch("/api/rotas");
      if (!res.ok) return;
      const data = (await res.json()) as Rotas;
      setRotas(data);
    } catch (e) {
      console.error("Erro ao carregar rotas", e);
    }
  }

  async function carregarViagens(user: string) {
    const u = user.toLowerCase().trim();
    if (!u) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/viagens?usuario=${encodeURIComponent(u)}`);
      if (!res.ok) {
        throw new Error("Erro ao carregar viagens");
      }
      const data = await res.json();
      setViagens(data.viagens ?? []);
    } catch (e) {
      console.error(e);
      setError("Não foi possível carregar as viagens.");
    } finally {
      setLoading(false);
    }
  }

  async function salvarViagem() {
    const u = normalizedUsuario;
    if (!u) {
      setError("Defina o username (felipe ou maria) antes de salvar.");
      return;
    }
    if (!linha || !data || !hora) {
      setError("Preencha linha, data e hora.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/viagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: u, linha, data, hora, obs }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Erro ao salvar viagem");
      }
      const payload = await res.json();
      setViagens(payload.viagens ?? []);
      setObs("");
    } catch (e) {
      console.error(e);
      setError("Não foi possível salvar a viagem.");
    } finally {
      setSaving(false);
    }
  }

  async function excluirViagem(v: Viagem) {
    if (!normalizedUsuario) return;
    const ok = window.confirm("Excluir este registro do diário?");
    if (!ok) return;

    try {
      const res = await fetch("/api/viagens", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: normalizedUsuario,
          timestamp: v.timestamp,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Erro ao excluir viagem");
      }
      const payload = await res.json();
      setViagens(payload.viagens ?? []);
    } catch (e) {
      console.error(e);
      setError("Não foi possível excluir a viagem.");
    }
  }

  useEffect(() => {
    if (initialUsuario) {
      carregarViagens(initialUsuario);
    }
    carregarRotas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const primeiraViagem = viagens.at(-1);
  const ultimaViagem = viagens[0];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Selecione o usuário do diário
          </p>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="flex-1">
              <label className="text-xs text-slate-400">
                Username de diário (use exatamente{" "}
                <strong>felipe</strong> ou <strong>maria</strong>)
              </label>
              <input
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                placeholder="felipe ou maria"
              />
            </div>
            <div className="flex gap-2 pt-1 md:pt-0">
              <button
                type="button"
                onClick={() => {
                  setUsuario("felipe");
                  carregarViagens("felipe");
                }}
                className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-100 transition hover:border-sky-500 hover:bg-slate-900"
              >
                felipe
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsuario("maria");
                  carregarViagens("maria");
                }}
                className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-100 transition hover:border-sky-500 hover:bg-slate-900"
              >
                maria
              </button>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => carregarViagens(usuario)}
          disabled={!normalizedUsuario || loading}
          className="mt-2 inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 md:mt-0"
        >
          {loading ? "Carregando..." : "Carregar viagens"}
        </button>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          Nova viagem
        </p>
        <div className="grid gap-3 md:grid-cols-[2fr,1fr,1fr]">
          <div>
            <label className="text-xs text-slate-400">Linha</label>
            <select
              value={linha}
              onChange={(e) => setLinha(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              <option value="">Selecione uma linha</option>
              {linhasOrdenadas.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400">Data</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Hora</label>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400">Observação (opcional)</label>
          <textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            rows={2}
            maxLength={120}
            className="mt-1 w-full resize-none rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            placeholder="Ex: indo pro trabalho, ônibus vazio, etc."
          />
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={salvarViagem}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {saving ? "Salvando..." : "Salvar viagem"}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-100">
          {error}
        </p>
      )}

      {viagens.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <span>
              {viagens.length} viagens registradas para{" "}
              <span className="font-semibold text-slate-100">
                @{normalizedUsuario}
              </span>
            </span>
            <span className="flex flex-wrap gap-3">
              {primeiraViagem && (
                <span>
                  Primeira:{" "}
                  <strong className="text-slate-100">
                    {primeiraViagem.data} {primeiraViagem.hora}
                  </strong>
                </span>
              )}
              {ultimaViagem && (
                <span>
                  Última:{" "}
                  <strong className="text-slate-100">
                    {ultimaViagem.data} {ultimaViagem.hora}
                  </strong>
                </span>
              )}
            </span>
          </div>

          <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
            {viagens.map((viagem) => (
              <article
                key={viagem.timestamp}
                className="group flex gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3 transition hover:border-sky-500/80 hover:bg-slate-900"
              >
                <div className="mt-1 h-12 w-1 rounded-full bg-gradient-to-b from-sky-400 to-cyan-500 opacity-70 group-hover:opacity-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="max-w-full text-sm font-semibold tracking-tight text-slate-50">
                      {viagem.linha}
                    </h3>
                    <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-300">
                      {viagem.data} · {viagem.hora}
                    </span>
                  </div>
                  {viagem.obs && (
                    <p className="text-xs text-slate-300">{viagem.obs}</p>
                  )}
                  <p className="text-[10px] text-slate-500">
                    Registrado em {viagem.timestamp}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => excluirViagem(viagem)}
                  className="self-start rounded-full border border-slate-800 bg-slate-900/80 px-2 py-1 text-[10px] font-medium text-slate-300 opacity-0 transition hover:border-red-500 hover:text-red-200 group-hover:opacity-100"
                >
                  Excluir
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Nenhuma viagem carregada ainda. Escolha <strong>felipe</strong> ou{" "}
          <strong>maria</strong>, ou digite exatamente o username que está em
          <code className="mx-1 rounded bg-slate-900 px-1.5 py-0.5 text-[11px] text-slate-200">
            viagens.csv
          </code>
          , e clique em &quot;Carregar viagens&quot;. Depois registre novas
          viagens no formulário acima.
        </p>
      )}
    </section>
  );
}


