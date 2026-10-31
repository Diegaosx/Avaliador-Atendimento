import React, { useState, useEffect } from 'react';
import { Vendedora, Avaliacao } from '../shared/types';
import confetti from 'canvas-confetti';
import {
  Star,
  Sparkles,
  HeartHandshake,
  Lightbulb,
  Award,
  CheckCircle2,
  Copy,
  Check,
  User,
  Phone,
  MessageSquare,
  ArrowLeft,
  Store,
  ChevronRight,
  ShieldCheck,
  Trophy,
} from 'lucide-react';

interface AvaliacaoViewProps {
  initialVendedoraId?: string | null;
  onNavigateToRanking: () => void;
}

interface CriterioConfig {
  key: 'sorriso' | 'cordialidade' | 'conhecimento' | 'experiencia';
  titulo: string;
  subtitulo: string;
  icone: React.ElementType;
  descricaoNivel: Record<number, { label: string; cor: string }>;
}

const CRITERIOS: CriterioConfig[] = [
  {
    key: 'sorriso',
    titulo: 'Sorriso & Simpatia',
    subtitulo: 'A vendedora foi calorosa, sorridente e acolhedora durante todo o contato?',
    icone: Sparkles,
    descricaoNivel: {
      1: { label: 'Pouco simpática', cor: 'text-amber-700 bg-amber-50 border-amber-200' },
      2: { label: 'Básico', cor: 'text-amber-700 bg-amber-50 border-amber-200' },
      3: { label: 'Simpática', cor: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
      4: { label: 'Muito simpática & alegre', cor: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
      5: { label: 'Sorriso contagiante & acolhedor!', cor: 'text-amber-800 bg-amber-100 border-amber-300 font-semibold' },
    },
  },
  {
    key: 'cordialidade',
    titulo: 'Cordialidade & Atenção',
    subtitulo: 'Tratou você com total respeito, gentileza, escuta ativa e paciência?',
    icone: HeartHandshake,
    descricaoNivel: {
      1: { label: 'Falta de atenção', cor: 'text-amber-700 bg-amber-50 border-amber-200' },
      2: { label: 'Atenção regular', cor: 'text-amber-700 bg-amber-50 border-amber-200' },
      3: { label: 'Atenciosa e educada', cor: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
      4: { label: 'Muito cordial & prestativa', cor: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
      5: { label: 'Gentileza e carinho impecáveis!', cor: 'text-amber-800 bg-amber-100 border-amber-300 font-semibold' },
    },
  },
  {
    key: 'conhecimento',
    titulo: 'Conhecimento de Produto',
    subtitulo: 'Demonstrou domínio sobre os itens, tirou dúvidas e deu ótimas sugestões?',
    icone: Lightbulb,
    descricaoNivel: {
      1: { label: 'Pouco conhecimento', cor: 'text-amber-700 bg-amber-50 border-amber-200' },
      2: { label: 'Conhecimento básico', cor: 'text-amber-700 bg-amber-50 border-amber-200' },
      3: { label: 'Bom domínio', cor: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
      4: { label: 'Muito segura & assertiva', cor: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
      5: { label: 'Especialista completa!', cor: 'text-amber-800 bg-amber-100 border-amber-300 font-semibold' },
    },
  },
  {
    key: 'experiencia',
    titulo: 'Experiência da Visita',
    subtitulo: 'Como você resume a sua sensação e satisfação geral com o atendimento recebido?',
    icone: Award,
    descricaoNivel: {
      1: { label: 'Abaixo do esperado', cor: 'text-amber-700 bg-amber-50 border-amber-200' },
      2: { label: 'Dentro do padrão', cor: 'text-amber-700 bg-amber-50 border-amber-200' },
      3: { label: 'Boa experiência', cor: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
      4: { label: 'Excelente experiência', cor: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
      5: { label: 'Experiência memorável & encantadora!', cor: 'text-amber-800 bg-amber-100 border-amber-300 font-semibold' },
    },
  },
];

export const AvaliacaoView: React.FC<AvaliacaoViewProps> = ({
  initialVendedoraId,
  onNavigateToRanking,
}) => {
  const [vendedoras, setVendedoras] = useState<Vendedora[]>([]);
  const [loadingVendedoras, setLoadingVendedoras] = useState(true);
  const [selectedVendedoraId, setSelectedVendedoraId] = useState<string | null>(initialVendedoraId || null);

  // Ratings for the 4 criteria (defaulting to 5 for customer delight, can be changed easily)
  const [sorriso, setSorriso] = useState<number>(5);
  const [cordialidade, setCordialidade] = useState<number>(5);
  const [conhecimento, setConhecimento] = useState<number>(5);
  const [experiencia, setExperiencia] = useState<number>(5);

  // Optional customer details
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [comentario, setComentario] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [avaliacaoRealizada, setAvaliacaoRealizada] = useState<Avaliacao | null>(null);
  const [codigoCopiado, setCodigoCopiado] = useState(false);

  // Fetch active vendedoras
  useEffect(() => {
    async function loadVendedoras() {
      try {
        setLoadingVendedoras(true);
        const res = await fetch('/api/vendedoras?activeOnly=true');
        if (res.ok) {
          const data = await res.json();
          setVendedoras(data.vendedoras || []);
          if (initialVendedoraId) {
            setSelectedVendedoraId(initialVendedoraId);
          } else if (data.vendedoras && data.vendedoras.length > 0 && !selectedVendedoraId) {
            // Leave null so user picks or default to first if desired
          }
        }
      } catch (err) {
        console.error('Erro ao carregar vendedoras', err);
      } finally {
        setLoadingVendedoras(false);
      }
    }
    loadVendedoras();
  }, [initialVendedoraId]);

  const selectedVendedora = vendedoras.find((v) => v.id === selectedVendedoraId) || null;

  // Realtime average calculation
  const mediaCalculada = Number(((sorriso + cordialidade + conhecimento + experiencia) / 4).toFixed(2));

  const handleRatingChange = (criterio: 'sorriso' | 'cordialidade' | 'conhecimento' | 'experiencia', value: number) => {
    if (criterio === 'sorriso') setSorriso(value);
    if (criterio === 'cordialidade') setCordialidade(value);
    if (criterio === 'conhecimento') setConhecimento(value);
    if (criterio === 'experiencia') setExperiencia(value);
  };

  const getRatingValue = (criterio: 'sorriso' | 'cordialidade' | 'conhecimento' | 'experiencia') => {
    if (criterio === 'sorriso') return sorriso;
    if (criterio === 'cordialidade') return cordialidade;
    if (criterio === 'conhecimento') return conhecimento;
    return experiencia;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendedoraId) {
      setErrorMessage('Por favor, selecione quem te atendeu hoje.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const res = await fetch('/api/avaliacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendedoraId: selectedVendedoraId,
          sorriso,
          cordialidade,
          conhecimento,
          experiencia,
          clienteNome: clienteNome.trim() || undefined,
          clienteTelefone: clienteTelefone.trim() || undefined,
          comentario: comentario.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao registrar avaliação.');
      }

      const data = await res.json();
      setAvaliacaoRealizada(data.avaliacao);

      // Trigger celebratory confetti
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#10b981', '#6366f1'],
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível registrar o seu voto.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!avaliacaoRealizada?.codigoVoto) return;
    navigator.clipboard.writeText(avaliacaoRealizada.codigoVoto);
    setCodigoCopiado(true);
    setTimeout(() => setCodigoCopiado(false), 2500);
  };

  const handleNovaAvaliacao = () => {
    setAvaliacaoRealizada(null);
    setSelectedVendedoraId(null);
    setSorriso(5);
    setCordialidade(5);
    setConhecimento(5);
    setExperiencia(5);
    setClienteNome('');
    setClienteTelefone('');
    setComentario('');
  };

  // ==========================================================================
  // TELA DE AGRADECIMENTO & CÓDIGO DE VALIDAÇÃO
  // ==========================================================================
  if (avaliacaoRealizada) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 sm:py-12 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden text-center">
          {/* Top celebratory banner */}
          <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 p-8 text-white relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white text-amber-600 shadow-xl mb-4">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Avaliação Enviada!</h2>
            <p className="text-amber-100 text-sm sm:text-base mt-2 max-w-md mx-auto">
              Muito obrigado por dedicar o seu tempo. Seu feedback reconhece o carinho da nossa equipe e ajuda no Ranking de Encantamento!
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Validation Code Card */}
            <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-2 border-dashed border-amber-300 rounded-2xl p-6 text-center">
              <span className="text-xs uppercase font-bold tracking-wider text-amber-700 bg-amber-100/80 px-3 py-1 rounded-full inline-block mb-3">
                Comprovante de Voto & Transparência
              </span>
              <div className="text-3xl sm:text-4xl font-mono font-extrabold text-slate-900 tracking-wider">
                {avaliacaoRealizada.codigoVoto}
              </div>
              <p className="text-xs text-slate-600 mt-2 max-w-sm mx-auto">
                Guarde este código ou apresente ao caixa caso a loja realize sorteios ou benefícios aos clientes que avaliam.
              </p>

              <button
                type="button"
                id="btn-copy-codigo-voto"
                onClick={handleCopyCode}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white border border-amber-300 text-slate-800 rounded-xl text-xs font-semibold shadow-sm hover:bg-amber-50 transition-colors cursor-pointer"
              >
                {codigoCopiado ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Código Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-600" />
                    <span>Copiar Código</span>
                  </>
                )}
              </button>
            </div>

            {/* Evaluation Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0">
                    {selectedVendedora?.foto ? (
                      <img src={selectedVendedora.foto} alt={avaliacaoRealizada.vendedoraNome} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 m-2 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Vendedora avaliada</span>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">{avaliacaoRealizada.vendedoraNome}</h4>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500">Nota Média</span>
                  <div className="flex items-center gap-1 text-amber-600 font-extrabold text-base">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>{avaliacaoRealizada.media.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Criteria snapshot */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Sorriso</span>
                  <span className="font-bold text-xs text-slate-800">{avaliacaoRealizada.sorriso} ★</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Cordialidade</span>
                  <span className="font-bold text-xs text-slate-800">{avaliacaoRealizada.cordialidade} ★</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Conhecimento</span>
                  <span className="font-bold text-xs text-slate-800">{avaliacaoRealizada.conhecimento} ★</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Experiência</span>
                  <span className="font-bold text-xs text-slate-800">{avaliacaoRealizada.experiencia} ★</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 pt-2 flex items-center justify-between">
                <span>Quinzena: {avaliacaoRealizada.quinzenaRotulo}</span>
                <span>{new Date(avaliacaoRealizada.criadaEm).toLocaleDateString('pt-BR')} às {new Date(avaliacaoRealizada.criadaEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                id="btn-ver-ranking-agradecimento"
                onClick={onNavigateToRanking}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold py-3.5 px-6 rounded-2xl shadow-lg hover:bg-slate-800 transition-all cursor-pointer text-sm"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Ver Ranking de Encantamento (R$ 300)</span>
              </button>

              <button
                type="button"
                id="btn-nova-avaliacao"
                onClick={handleNovaAvaliacao}
                className="w-full py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Avaliar outra vendedora
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // SELETOR DE VENDEDORA CASO NÃO TENHA NENHUMA SELECIONADA
  // ==========================================================================
  if (!selectedVendedora) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-in fade-in duration-200">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sua Opinião Faz a Diferença</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Quem te atendeu hoje?
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            Toque na vendedora para avaliar o atendimento recebido e ajudá-la na disputa pelo prêmio quinzenal de R$ 300,00!
          </p>
        </div>

        {loadingVendedoras ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-500">Carregando vendedoras da loja...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vendedoras.map((v) => (
              <button
                key={v.id}
                id={`card-vendedora-${v.id}`}
                onClick={() => setSelectedVendedoraId(v.id)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-amber-400 hover:bg-amber-50/20 transition-all text-left cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                  <img src={v.foto} alt={v.nome} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-base leading-tight truncate group-hover:text-amber-800 transition-colors">
                    {v.nome}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{v.cargo}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium mt-1">
                    <Store className="w-3 h-3 text-amber-600" />
                    {v.loja}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onNavigateToRanking}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Ver Ranking de Encantamento ao vivo</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // FORMULÁRIO DE AVALIAÇÃO DOS 4 CRITÉRIOS (SORRISO, CORDIALIDADE, CONHECIMENTO, EXPERIÊNCIA)
  // ==========================================================================
  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-10 animate-in fade-in duration-200">
      {/* Back button or change seller */}
      <button
        type="button"
        id="btn-trocar-vendedora"
        onClick={() => setSelectedVendedoraId(null)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-4 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Trocar Vendedora</span>
      </button>

      {/* Selected Seller Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md">
              <img src={selectedVendedora.foto} alt={selectedVendedora.nome} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-900 rounded-full p-1 shadow">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Você está avaliando
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white truncate leading-tight">
              {selectedVendedora.nome}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">{selectedVendedora.cargo}</p>
            <div className="inline-flex items-center gap-1 mt-1 text-[11px] text-amber-300/90 font-medium">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>Concorrendo ao Prêmio de R$ 300 da Quinzena</span>
            </div>
          </div>
        </div>

        {/* Live calculated score pill */}
        <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs">
          <span className="text-slate-300">Sua Média em Tempo Real:</span>
          <div className="flex items-center gap-1.5 font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/30">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{mediaCalculada.toFixed(2)} / 5.0</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-6">
          {errorMessage}
        </div>
      )}

      {/* Form with 4 criteria */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {CRITERIOS.map((crit, idx) => {
          const Icone = crit.icone;
          const valorAtual = getRatingValue(crit.key);
          const nivelAtual = crit.descricaoNivel[valorAtual] || { label: '', cor: '' };

          return (
            <div
              key={crit.key}
              id={`criterio-card-${crit.key}`}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                    <Icone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                      {crit.titulo}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">{crit.subtitulo}</p>
                  </div>
                </div>
              </div>

              {/* Star Rating Selector (1 to 5) */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2" role="radiogroup" aria-label={crit.titulo}>
                  {[1, 2, 3, 4, 5].map((estrela) => {
                    const isSelected = estrela <= valorAtual;
                    return (
                      <button
                        key={estrela}
                        type="button"
                        id={`star-${crit.key}-${estrela}`}
                        onClick={() => handleRatingChange(crit.key, estrela)}
                        className={`p-2 rounded-xl transition-all cursor-pointer transform active:scale-90 ${
                          isSelected
                            ? 'text-amber-400 hover:text-amber-500 hover:scale-110'
                            : 'text-slate-300 hover:text-amber-200'
                        }`}
                        title={`${estrela} estrela${estrela > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                            isSelected ? 'fill-amber-400' : 'fill-transparent'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Rating badge */}
                <div className={`px-3 py-1 rounded-xl text-xs border self-start sm:self-center transition-all ${nivelAtual.cor}`}>
                  {nivelAtual.label}
                </div>
              </div>
            </div>
          );
        })}

        {/* Optional Customer Information */}
        <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Dados Opcionais & Elogio</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-cliente-nome" className="block text-xs font-medium text-slate-700 mb-1">
                Seu Nome (opcional)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  id="input-cliente-nome"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  placeholder="Ex: Maria Clara"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="input-cliente-telefone" className="block text-xs font-medium text-slate-700 mb-1">
                WhatsApp / Telefone (opcional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  id="input-cliente-telefone"
                  value={clienteTelefone}
                  onChange={(e) => setClienteTelefone(e.target.value)}
                  placeholder="Para sorteios do caixa"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="input-comentario" className="block text-xs font-medium text-slate-700 mb-1">
              Deixe um Elogio ou Observação
            </label>
            <div className="relative">
              <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                id="input-comentario"
                rows={2}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Ex: A vendedora foi incrível, tirou todas as dúvidas e me atendeu com um sorriso lindo!"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          id="btn-enviar-avaliacao"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:from-amber-600 hover:to-yellow-700 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 text-base"
        >
          {submitting ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-yellow-200" />
              <span>Confirmar Avaliação de {selectedVendedora.nome}</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-center text-slate-500">
          🔒 Seu voto gera um código único e auditável para garantir a transparência da premiação de R$ 300,00.
        </p>
      </form>
    </div>
  );
};
