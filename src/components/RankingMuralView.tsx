import React, { useState, useEffect } from 'react';
import { RankingSummary, RankingItem, Quinzena } from '../shared/types';
import {
  Trophy,
  Crown,
  Medal,
  Star,
  Sparkles,
  RefreshCw,
  Tv,
  Calendar,
  Smile,
  HeartHandshake,
  Lightbulb,
  Award,
  ChevronRight,
  TrendingUp,
  Percent,
  CheckCircle,
} from 'lucide-react';

interface RankingMuralViewProps {
  onSelectVendedoraToRate: (vendedoraId: string) => void;
}

export const RankingMuralView: React.FC<RankingMuralViewProps> = ({
  onSelectVendedoraToRate,
}) => {
  const [rankingData, setRankingData] = useState<RankingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuinzenaId, setSelectedQuinzenaId] = useState<string>('');
  const [isTvMode, setIsTvMode] = useState(false);
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(30);

  // Load ranking
  const loadRanking = async (quinzenaId?: string) => {
    try {
      setLoading(true);
      const url = quinzenaId ? `/api/ranking?quinzenaId=${encodeURIComponent(quinzenaId)}` : '/api/ranking';
      const res = await fetch(url);
      if (res.ok) {
        const data: RankingSummary = await res.json();
        setRankingData(data);
        if (!selectedQuinzenaId) {
          setSelectedQuinzenaId(data.quinzena.id);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar ranking', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRanking(selectedQuinzenaId || undefined);
  }, [selectedQuinzenaId]);

  // Auto-refresh timer in TV mode
  useEffect(() => {
    if (!isTvMode) return;
    const interval = setInterval(() => {
      setAutoRefreshSec((prev) => {
        if (prev <= 1) {
          loadRanking(selectedQuinzenaId);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTvMode, selectedQuinzenaId]);

  if (loading && !rankingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-slate-500 font-medium">Carregando Ranking de Encantamento...</span>
      </div>
    );
  }

  const items = rankingData?.itens || [];
  const top1 = items[0] || null;
  const top2 = items[1] || null;
  const top3 = items[2] || null;
  const quinzena = rankingData?.quinzena;

  return (
    <div className={`transition-all duration-300 ${isTvMode ? 'bg-slate-950 text-white min-h-screen p-6 sm:p-10' : 'max-w-6xl mx-auto px-4 py-8'}`}>
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              Ranking de Encantamento
            </span>
            {quinzena?.status === 'aberta' ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Quinzena em Andamento
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <CheckCircle className="w-3.5 h-3.5" />
                Quinzena Encerrada
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5">
            Quem está na frente nesta Quinzena?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhamento em tempo real das avaliações das clientes via QR Code.
          </p>
        </div>

        {/* Quinzena Selector & TV Mode toggles */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm text-xs">
            <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
            <select
              id="select-quinzena"
              value={selectedQuinzenaId}
              onChange={(e) => setSelectedQuinzenaId(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              {rankingData?.todasQuinzenas.map((q) => (
                <option key={q.id} value={q.id} className="text-slate-900 bg-white dark:bg-slate-800">
                  Quinzena: {q.rotulo} {q.status === 'encerrada' ? '(Encerrada)' : '(Ativa)'}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            id="btn-refresh-ranking"
            onClick={() => loadRanking(selectedQuinzenaId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors shadow-sm cursor-pointer"
            title="Atualizar dados agora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isTvMode ? `${autoRefreshSec}s` : 'Atualizar'}</span>
          </button>

          <button
            type="button"
            id="btn-toggle-tv-mode"
            onClick={() => setIsTvMode(!isTvMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors shadow-sm cursor-pointer ${
              isTvMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>{isTvMode ? 'Sair do Modo TV' : 'Modo TV / Mural'}</span>
          </button>
        </div>
      </div>

      {/* R$ 300 FORTNIGHT PRIZE HIGHLIGHT BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white p-6 sm:p-8 shadow-2xl mb-10 border border-amber-300/40">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/15 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute right-12 bottom-0 opacity-10 pointer-events-none">
          <Trophy className="w-56 h-56" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-slate-950/20 backdrop-blur-sm border border-white/20 px-3 py-1 rounded-full text-xs font-bold text-amber-200">
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Campanha de Encantamento ao Cliente</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight drop-shadow-sm">
              Prêmio da Quinzena: R$ {quinzena?.premioValor.toFixed(2).replace('.', ',') || '300,00'}
            </h2>
            <p className="text-amber-100 text-xs sm:text-sm leading-relaxed">
              A melhor vendedora com maior média nos critérios de <strong className="text-white">Sorriso, Cordialidade, Conhecimento de produto e Experiência</strong> leva o prêmio na quinzena ({quinzena?.rotulo})!
            </p>
          </div>

          {top1 && top1.totalVotos > 0 ? (
            <div className="bg-slate-950/30 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shrink-0 shadow-lg">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-md">
                  <img src={top1.foto} alt={top1.vendedoraNome} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 rounded-full p-1 shadow">
                  <Crown className="w-4 h-4 fill-slate-950" />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Líder da Quinzena
                </span>
                <h3 className="text-lg font-bold text-white leading-tight">{top1.vendedoraNome}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-1 font-extrabold text-amber-300 text-base">
                    <Star className="w-4 h-4 fill-amber-300" />
                    {top1.mediaGeral.toFixed(2)}
                  </span>
                  <span className="text-xs text-amber-100">
                    ({top1.totalVotos} avaliações)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/20 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center">
              <span className="text-xs text-amber-200 font-semibold">Nenhuma avaliação nesta quinzena ainda.</span>
              <p className="text-[11px] text-white/80 mt-1">Peça aos clientes para avaliarem pelo QR Code!</p>
            </div>
          )}
        </div>
      </div>

      {/* PODIUM OF ENCHANTMENT (TOP 3) */}
      {items.length >= 3 && (
        <div className="mb-12">
          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Pódio do Encantamento</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">As 3 colaboradoras mais bem avaliadas no momento</p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end max-w-3xl mx-auto pt-6">
            {/* 2nd Place (Left) */}
            {top2 && (
              <div className="flex flex-col items-center text-center animate-in fade-in duration-300">
                <div className="relative mb-2">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-3 border-slate-300 dark:border-slate-600 shadow-md">
                    <img src={top2.foto} alt={top2.vendedoraNome} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -top-2.5 -right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-300 text-slate-800 font-extrabold flex items-center justify-center text-xs sm:text-sm shadow-md border-2 border-white">
                    2º
                  </div>
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-full">
                  {top2.vendedoraNome}
                </h4>
                <div className="flex items-center gap-1 text-amber-500 font-extrabold text-xs sm:text-sm mt-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{top2.mediaGeral.toFixed(2)}</span>
                </div>
                <span className="text-[10px] text-slate-500">{top2.totalVotos} votos</span>

                {/* Silver Pedestal */}
                <div className="w-full h-24 sm:h-32 mt-3 rounded-t-2xl bg-gradient-to-t from-slate-300/80 to-slate-200/90 dark:from-slate-800 dark:to-slate-700/80 border-t-4 border-slate-400 dark:border-slate-500 flex flex-col items-center justify-center p-2 shadow-inner">
                  <Medal className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                  <span className="text-xs font-bold mt-1 text-slate-700 dark:text-slate-300">Prata</span>
                </div>
              </div>
            )}

            {/* 1st Place (Center - Elevated) */}
            {top1 && (
              <div className="flex flex-col items-center text-center -mt-6 sm:-mt-10 z-10 animate-in fade-in zoom-in-95 duration-400">
                <div className="relative mb-2">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-amber-500 animate-bounce">
                    <Crown className="w-7 h-7 sm:w-9 sm:h-9 fill-amber-400 text-amber-500" />
                  </div>
                  <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-amber-400 shadow-xl ring-4 ring-amber-400/20">
                    <img src={top1.foto} alt={top1.vendedoraNome} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-1 sm:right-0 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-full shadow-lg border-2 border-white">
                    1º
                  </div>
                </div>
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate max-w-full">
                  {top1.vendedoraNome}
                </h4>
                <div className="flex items-center gap-1 text-amber-500 font-black text-sm sm:text-base mt-0.5">
                  <Star className="w-4 h-4 fill-amber-500" />
                  <span>{top1.mediaGeral.toFixed(2)}</span>
                </div>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                  {top1.totalVotos} avaliações ({top1.percentualEncantamento}%)
                </span>

                {/* Gold Pedestal */}
                <div className="w-full h-32 sm:h-44 mt-3 rounded-t-2xl bg-gradient-to-t from-amber-400/90 to-amber-300 dark:from-amber-600/90 dark:to-amber-500/80 border-t-4 border-yellow-300 flex flex-col items-center justify-center p-2 shadow-xl">
                  <Trophy className="w-8 h-8 text-amber-900 dark:text-amber-100 drop-shadow" />
                  <span className="text-xs sm:text-sm font-black mt-1 text-amber-950 dark:text-white uppercase tracking-wider">
                    Ouro • R$ 300
                  </span>
                </div>
              </div>
            )}

            {/* 3rd Place (Right) */}
            {top3 && (
              <div className="flex flex-col items-center text-center animate-in fade-in duration-300">
                <div className="relative mb-2">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-3 border-amber-700/40 dark:border-amber-700 shadow-md">
                    <img src={top3.foto} alt={top3.vendedoraNome} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -top-2.5 -right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-700 text-white font-extrabold flex items-center justify-center text-xs sm:text-sm shadow-md border-2 border-white">
                    3º
                  </div>
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-full">
                  {top3.vendedoraNome}
                </h4>
                <div className="flex items-center gap-1 text-amber-500 font-extrabold text-xs sm:text-sm mt-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{top3.mediaGeral.toFixed(2)}</span>
                </div>
                <span className="text-[10px] text-slate-500">{top3.totalVotos} votos</span>

                {/* Bronze Pedestal */}
                <div className="w-full h-20 sm:h-28 mt-3 rounded-t-2xl bg-gradient-to-t from-amber-800/60 to-amber-700/60 dark:from-amber-900 dark:to-amber-800/80 border-t-4 border-amber-600 flex flex-col items-center justify-center p-2 shadow-inner">
                  <Medal className="w-6 h-6 text-amber-200" />
                  <span className="text-xs font-bold mt-1 text-amber-100">Bronze</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ALL SELLERS DETAILED CARDS & CRITERIA METRICS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            Classificação Geral das Vendedoras ({items.length})
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Total de {rankingData?.totalAvaliacoesQuinzena || 0} avaliações nesta quinzena
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {items.map((item) => {
            const isLeader = item.posicao === 1 && item.totalVotos > 0;
            return (
              <div
                key={item.vendedoraId}
                id={`card-ranking-pos-${item.posicao}`}
                className={`rounded-2xl p-4 sm:p-5 transition-all border ${
                  isLeader
                    ? 'bg-gradient-to-r from-amber-50/70 via-yellow-50/40 to-white dark:from-amber-950/20 dark:to-slate-900 border-amber-300 dark:border-amber-700/60 shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Position & Avatar & Info */}
                  <div className="flex items-center gap-3.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full font-black text-sm shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      #{item.posicao}
                    </div>

                    <div className="relative shrink-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img src={item.foto} alt={item.vendedoraNome} className="w-full h-full object-cover" />
                      </div>
                      {isLeader && (
                        <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 rounded-full p-0.5">
                          <Crown className="w-3 h-3 fill-slate-950" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {item.vendedoraNome}
                        </h4>
                        {isLeader && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                            Líder R$ 300
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.cargo} • {item.loja}</p>
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {item.totalVotos} avaliações computadas
                      </span>
                    </div>
                  </div>

                  {/* Middle: 4 Criteria Breakdown Mini-Bars */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-2 lg:py-0 border-t border-b lg:border-t-0 lg:border-b-0 border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Smile className="w-3 h-3 text-amber-500" />
                          Sorriso
                        </span>
                        <span className="font-bold">{item.mediaSorriso.toFixed(1)}</span>
                      </div>
                      <div className="w-24 sm:w-28 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(item.mediaSorriso / 5) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 flex items-center gap-1">
                          <HeartHandshake className="w-3 h-3 text-amber-500" />
                          Cordialidade
                        </span>
                        <span className="font-bold">{item.mediaCordialidade.toFixed(1)}</span>
                      </div>
                      <div className="w-24 sm:w-28 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(item.mediaCordialidade / 5) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3 text-amber-500" />
                          Conhecimento
                        </span>
                        <span className="font-bold">{item.mediaConhecimento.toFixed(1)}</span>
                      </div>
                      <div className="w-24 sm:w-28 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(item.mediaConhecimento / 5) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Award className="w-3 h-3 text-amber-500" />
                          Experiência
                        </span>
                        <span className="font-bold">{item.mediaExperiencia.toFixed(1)}</span>
                      </div>
                      <div className="w-24 sm:w-28 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(item.mediaExperiencia / 5) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Overall score and Action */}
                  <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-amber-500 font-extrabold text-lg sm:text-xl">
                        <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                        <span>{item.mediaGeral.toFixed(2)}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {item.diferencaLider > 0 ? `-${item.diferencaLider.toFixed(2)} da líder` : 'Top 1'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectVendedoraToRate(item.vendedoraId)}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
                    >
                      <span>Avaliar</span>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
