import React, { useState, useEffect } from 'react';
import {
  Vendedora,
  Avaliacao,
  Quinzena,
  RankingSummary,
  User,
} from '../shared/types';
import {
  Users,
  QrCode,
  ShieldAlert,
  Calendar,
  Trophy,
  Plus,
  Search,
  Download,
  Printer,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Star,
  Smile,
  HeartHandshake,
  Lightbulb,
  Award,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  TrendingUp,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';
import QRCodeLib from 'qrcode';

interface AdminAvaliadorDashboardProps {
  token: string;
  user: User;
}

type AdminSubTab = 'kpis' | 'vendedoras' | 'auditoria' | 'quinzenas';

export const AdminAvaliadorDashboard: React.FC<AdminAvaliadorDashboardProps> = ({
  token,
  user,
}) => {
  const [subTab, setSubTab] = useState<AdminSubTab>('kpis');
  const [loading, setLoading] = useState(false);
  const [ranking, setRanking] = useState<RankingSummary | null>(null);
  const [vendedoras, setVendedoras] = useState<Vendedora[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [quinzenas, setQuinzenas] = useState<Quinzena[]>([]);

  // Search & Filter states
  const [searchAudit, setSearchAudit] = useState('');
  const [filterQuinzena, setFilterQuinzena] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal states
  const [modalVendedoraOpen, setModalVendedoraOpen] = useState(false);
  const [editingVendedora, setEditingVendedora] = useState<Vendedora | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formFoto, setFormFoto] = useState('');
  const [formCargo, setFormCargo] = useState('');
  const [formLoja, setFormLoja] = useState('Loja Principal');

  // QR Code Modal
  const [qrModalVendedora, setQrModalVendedora] = useState<Vendedora | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrTargetUrl, setQrTargetUrl] = useState<string>('');
  const [qrCopied, setQrCopied] = useState(false);

  // Disqualification Modal
  const [disqualifyModalAvaliacao, setDisqualifyModalAvaliacao] = useState<Avaliacao | null>(null);
  const [disqualifyReason, setDisqualifyReason] = useState('');

  // Homologation confirmation
  const [homologandoQuinzena, setHomologandoQuinzena] = useState<Quinzena | null>(null);

  // Initial data loading
  const refreshAllData = async () => {
    try {
      setLoading(true);

      const [resRank, resVend, resAvl, resQnz] = await Promise.all([
        fetch('/api/ranking'),
        fetch('/api/vendedoras'),
        fetch('/api/avaliacoes', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/quinzenas'),
      ]);

      if (resRank.ok) setRanking(await resRank.json());
      if (resVend.ok) {
        const d = await resVend.json();
        setVendedoras(d.vendedoras || []);
      }
      if (resAvl.ok) {
        const d = await resAvl.json();
        setAvaliacoes(d.avaliacoes || []);
      }
      if (resQnz.ok) {
        const d = await resQnz.json();
        setQuinzenas(d.quinzenas || []);
      }
    } catch (err) {
      console.error('Erro ao atualizar dados admin', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, [token]);

  // Open QR modal and generate QR Code
  const handleOpenQrModal = async (vendedora: Vendedora) => {
    setQrModalVendedora(vendedora);
    try {
      const host = window.location.host;
      const protocol = window.location.protocol;
      const target = `${protocol}//${host}/?v=${encodeURIComponent(vendedora.id)}`;
      setQrTargetUrl(target);
      const dataUrl = await QRCodeLib.toDataURL(target, {
        width: 450,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Erro ao gerar QR code', err);
    }
  };

  const handlePrintPlaque = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (!qrTargetUrl) return;
    navigator.clipboard.writeText(qrTargetUrl);
    setQrCopied(true);
    setTimeout(() => setQrCopied(false), 2000);
  };

  // Save Vendedora (Create or Update)
  const handleSaveVendedora = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) return;

    try {
      if (editingVendedora) {
        const res = await fetch(`/api/vendedoras/${editingVendedora.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nome: formNome.trim(),
            foto: formFoto.trim() || undefined,
            cargo: formCargo.trim() || undefined,
            loja: formLoja.trim() || undefined,
          }),
        });
        if (res.ok) {
          setModalVendedoraOpen(false);
          refreshAllData();
        }
      } else {
        const res = await fetch('/api/vendedoras', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nome: formNome.trim(),
            foto: formFoto.trim() || undefined,
            cargo: formCargo.trim() || undefined,
            loja: formLoja.trim() || undefined,
          }),
        });
        if (res.ok) {
          setModalVendedoraOpen(false);
          refreshAllData();
        }
      }
    } catch (err) {
      console.error('Erro ao salvar vendedora', err);
    }
  };

  const handleToggleVendedoraStatus = async (vendedora: Vendedora) => {
    try {
      await fetch(`/api/vendedoras/${vendedora.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ativa: !vendedora.ativa }),
      });
      refreshAllData();
    } catch (err) {
      console.error('Erro ao alterar status', err);
    }
  };

  // Disqualify evaluation
  const handleConfirmDisqualify = async () => {
    if (!disqualifyModalAvaliacao) return;
    try {
      const res = await fetch(`/api/avaliacoes/${disqualifyModalAvaliacao.id}/desqualificar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          motivo: disqualifyReason.trim() || 'Desqualificado pelo gestor',
        }),
      });
      if (res.ok) {
        setDisqualifyModalAvaliacao(null);
        setDisqualifyReason('');
        refreshAllData();
      }
    } catch (err) {
      console.error('Erro ao desqualificar', err);
    }
  };

  // Homologate quinzena
  const handleConfirmHomologar = async () => {
    if (!homologandoQuinzena) return;
    try {
      const res = await fetch(`/api/quinzenas/${homologandoQuinzena.id}/encerrar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setHomologandoQuinzena(null);
        refreshAllData();
      }
    } catch (err) {
      console.error('Erro ao encerrar quinzena', err);
    }
  };

  // Export evaluations to CSV
  const handleExportCsv = () => {
    const headers = [
      'Codigo_Voto',
      'Vendedora',
      'Data_Hora',
      'Sorriso',
      'Cordialidade',
      'Conhecimento',
      'Experiencia',
      'Media',
      'Cliente_Nome',
      'Cliente_Telefone',
      'Comentario',
      'Quinzena',
      'IP',
      'Status',
    ];

    const rows = filteredAvaliacoes.map((a) => [
      `"${a.codigoVoto}"`,
      `"${a.vendedoraNome}"`,
      `"${new Date(a.criadaEm).toLocaleString('pt-BR')}"`,
      a.sorriso,
      a.cordialidade,
      a.conhecimento,
      a.experiencia,
      a.media,
      `"${a.clienteNome || ''}"`,
      `"${a.clienteTelefone || ''}"`,
      `"${(a.comentario || '').replace(/"/g, '""')}"`,
      `"${a.quinzenaRotulo}"`,
      `"${a.ipAddress}"`,
      `"${a.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `avaliacoes-atendimento-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered evaluations
  const filteredAvaliacoes = avaliacoes.filter((a) => {
    if (filterQuinzena !== 'all' && a.quinzenaId !== filterQuinzena) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (searchAudit.trim()) {
      const q = searchAudit.toLowerCase();
      return (
        a.codigoVoto.toLowerCase().includes(q) ||
        a.vendedoraNome.toLowerCase().includes(q) ||
        (a.clienteNome && a.clienteNome.toLowerCase().includes(q)) ||
        (a.comentario && a.comentario.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-md bg-slate-900 text-white">
              Painel de Controle
            </span>
            <span className="text-xs text-slate-500 font-medium">Gestão & Auditoria de Atendimento</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Administração do Avaliador
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshAllData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setSubTab('kpis')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'kpis' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-amber-500" />
          <span>Indicadores & Ranking</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('vendedoras')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'vendedoras' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-500" />
          <span>Vendedoras & QR Codes ({vendedoras.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('auditoria')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'auditoria' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-emerald-500" />
          <span>Auditoria de Votos ({avaliacoes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('quinzenas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'quinzenas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-600" />
          <span>Fechamento de Quinzenas & R$ 300</span>
        </button>
      </div>

      {/* ====================================================================== */}
      {/* TAB 1: INDICADORES & RANKING */}
      {/* ====================================================================== */}
      {subTab === 'kpis' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Total de Avaliações</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {ranking?.totalAvaliacoesQuinzena || 0}
                </span>
                <span className="text-xs text-emerald-600 font-semibold">na quinzena ativa</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Quinzena: {ranking?.quinzena.rotulo}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Média Geral da Loja</span>
              <div className="flex items-center gap-1.5 mt-2">
                <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                <span className="text-3xl font-extrabold text-slate-900">
                  {ranking?.mediaGeralQuinzena ? ranking.mediaGeralQuinzena.toFixed(2) : '5.00'}
                </span>
                <span className="text-xs text-slate-500 font-semibold">/ 5.0</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Excelente índice de encantamento</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Líder do Prêmio R$ 300</span>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xl font-bold text-slate-900 truncate">
                  {ranking?.lider ? ranking.lider.vendedoraNome : 'Aguardando votos'}
                </span>
              </div>
              <p className="text-[11px] text-amber-600 font-semibold mt-1">
                {ranking?.lider ? `Nota ${ranking.lider.mediaGeral.toFixed(2)} (${ranking.lider.totalVotos} avaliações)` : 'Sem líder no momento'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Vendedoras Ativas</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {vendedoras.filter((v) => v.ativa).length}
                </span>
                <span className="text-xs text-slate-500 font-semibold">de {vendedoras.length} total</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Com placas e QR Codes individuais</p>
            </div>
          </div>

          {/* Fortnight Summary Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Trophy className="w-4 h-4" />
                <span>Ciclo Ativo: {ranking?.quinzena.rotulo}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                Premiação Quinzenal Homologada: R$ {ranking?.premioValor.toFixed(2).replace('.', ',')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                O encerramento quinzenal consagra a colaboradora no topo do ranking com base na média ponderada de todos os 4 critérios avaliados pelos clientes.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSubTab('quinzenas')}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md"
              >
                Gerenciar Fechamento
              </button>
            </div>
          </div>

          {/* Quick Standings Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Resumo do Ranking Quinzenal</h3>
              <span className="text-xs text-slate-500 font-medium">Ordem de classificação atual</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Pos</th>
                    <th className="py-3 px-4">Vendedora</th>
                    <th className="py-3 px-4 text-center">Avaliações</th>
                    <th className="py-3 px-4 text-center">Sorriso</th>
                    <th className="py-3 px-4 text-center">Cordialidade</th>
                    <th className="py-3 px-4 text-center">Conhecimento</th>
                    <th className="py-3 px-4 text-center">Experiência</th>
                    <th className="py-3 px-4 text-right">Média Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ranking?.itens.map((item) => (
                    <tr key={item.vendedoraId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-black">
                        {item.posicao === 1 ? '🥇 #1' : item.posicao === 2 ? '🥈 #2' : item.posicao === 3 ? '🥉 #3' : `#${item.posicao}`}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <img src={item.foto} alt={item.vendedoraNome} className="w-8 h-8 rounded-full object-cover shrink-0" />
                          <span>{item.vendedoraNome}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">{item.totalVotos}</td>
                      <td className="py-3.5 px-4 text-center">{item.mediaSorriso.toFixed(1)} ★</td>
                      <td className="py-3.5 px-4 text-center">{item.mediaCordialidade.toFixed(1)} ★</td>
                      <td className="py-3.5 px-4 text-center">{item.mediaConhecimento.toFixed(1)} ★</td>
                      <td className="py-3.5 px-4 text-center">{item.mediaExperiencia.toFixed(1)} ★</td>
                      <td className="py-3.5 px-4 text-right font-black text-amber-600 text-sm">
                        {item.mediaGeral.toFixed(2)} ★
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 2: VENDEDORAS & QR CODES */}
      {/* ====================================================================== */}
      {subTab === 'vendedoras' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Gestão de Vendedoras</h2>
              <p className="text-xs text-slate-500">Cadastre vendedoras e gere as plaquinhas de QR Code para balcão ou mesa</p>
            </div>

            <button
              type="button"
              id="btn-cadastrar-vendedora"
              onClick={() => {
                setEditingVendedora(null);
                setFormNome('');
                setFormFoto('');
                setFormCargo('Consultora de Vendas');
                setFormLoja('Loja Principal');
                setModalVendedoraOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Nova Vendedora</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendedoras.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <img src={v.foto} alt={v.nome} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">{v.nome}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{v.cargo}</p>
                      <span className="text-[11px] text-slate-400 font-medium block">{v.loja}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      v.ativa
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {v.ativa ? 'Ativa' : 'Pausada'}
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenQrModal(v)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-amber-700" />
                    <span>Ver Placa & QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingVendedora(v);
                      setFormNome(v.nome);
                      setFormFoto(v.foto);
                      setFormCargo(v.cargo);
                      setFormLoja(v.loja);
                      setModalVendedoraOpen(true);
                    }}
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Editar dados"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleVendedoraStatus(v)}
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    title={v.ativa ? 'Pausar recebimento de avaliações' : 'Ativar vendedora'}
                  >
                    {v.ativa ? <XCircle className="w-4 h-4 text-rose-500" /> : <CheckCircle className="w-4 h-4 text-emerald-600" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 3: AUDITORIA DE VOTOS */}
      {/* ====================================================================== */}
      {subTab === 'auditoria' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Auditoria de Votos & Códigos de Validação</h2>
              <p className="text-xs text-slate-500">
                Consulte o código fornecido pelo cliente para checar autenticidade e moderar avaliações
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar Relatório (CSV)</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchAudit}
                onChange={(e) => setSearchAudit(e.target.value)}
                placeholder="Buscar por código (#ENC-...), vendedora ou cliente..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={filterQuinzena}
                onChange={(e) => setFilterQuinzena(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none"
              >
                <option value="all">Todas as Quinzenas</option>
                {quinzenas.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.rotulo}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="valida">Apenas Válidos</option>
                <option value="desqualificada">Desqualificados</option>
              </select>
            </div>
          </div>

          {/* Table of Votes */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Código do Voto</th>
                    <th className="py-3 px-4">Vendedora</th>
                    <th className="py-3 px-4 text-center">Sorriso</th>
                    <th className="py-3 px-4 text-center">Cordialidade</th>
                    <th className="py-3 px-4 text-center">Conhecimento</th>
                    <th className="py-3 px-4 text-center">Experiência</th>
                    <th className="py-3 px-4 text-center">Média</th>
                    <th className="py-3 px-4">Cliente / Elogio</th>
                    <th className="py-3 px-4">Data / IP</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAvaliacoes.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900 text-xs">
                        {a.codigoVoto}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {a.vendedoraNome}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold">{a.sorriso} ★</td>
                      <td className="py-3.5 px-4 text-center font-semibold">{a.cordialidade} ★</td>
                      <td className="py-3.5 px-4 text-center font-semibold">{a.conhecimento} ★</td>
                      <td className="py-3.5 px-4 text-center font-semibold">{a.experiencia} ★</td>
                      <td className="py-3.5 px-4 text-center font-black text-amber-600">
                        {a.media.toFixed(2)} ★
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-semibold text-slate-800 block truncate">
                          {a.clienteNome || 'Cliente Anônimo'}
                        </span>
                        {a.comentario && (
                          <span className="text-[11px] text-slate-500 italic block truncate">
                            "{a.comentario}"
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                        <div>{new Date(a.criadaEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</div>
                        <span className="text-[10px] text-slate-400">IP: {a.ipAddress}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            a.status === 'valida'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {a.status === 'valida' ? 'Válido' : 'Desqualificado'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {a.status === 'valida' && (
                          <button
                            type="button"
                            onClick={() => {
                              setDisqualifyModalAvaliacao(a);
                              setDisqualifyReason('');
                            }}
                            className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                          >
                            Moderar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 4: FECHAMENTO DE QUINZENAS & R$ 300 */}
      {/* ====================================================================== */}
      {subTab === 'quinzenas' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Ciclos Quinzenais & Premiação de R$ 300,00</h2>
            <p className="text-xs text-slate-500">
              Ciclos oficiais: 01 a 15 e 16 até o fim do mês (16 a 30/11). Homologue para oficializar o pagamento do prêmio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {quinzenas.map((q) => {
              const isOpen = q.status === 'aberta';
              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-3xl p-6 border shadow-sm space-y-4 ${
                    isOpen ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
                        Ciclo Quinzenal
                      </span>
                      <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{q.rotulo}</h3>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        isOpen
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-purple-100 text-purple-800 border border-purple-200'
                      }`}
                    >
                      {isOpen ? 'Em Andamento' : 'Encerrada & Paga'}
                    </span>
                  </div>

                  <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/60">
                    <span className="text-xs text-amber-800 font-medium">Valor do Prêmio</span>
                    <div className="text-2xl font-black text-amber-900">
                      R$ {q.premioValor.toFixed(2).replace('.', ',')}
                    </div>
                    <span className="text-[10px] text-amber-700/80 mt-0.5 block">
                      Pago à vendedora de maior pontuação
                    </span>
                  </div>

                  {q.vencedoraNome ? (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Vencedora Homologada
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900">{q.vencedoraNome}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span>Média: <strong>{q.vencedoraMedia?.toFixed(2)} ★</strong></span>
                        <span>•</span>
                        <span>Votos: <strong>{q.vencedoraTotalVotos}</strong></span>
                      </div>
                      {q.homologadoEm && (
                        <span className="text-[10px] text-slate-400 block pt-1">
                          Consagrada em: {new Date(q.homologadoEm).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 py-2">
                      Vencedora será definida no encerramento desta quinzena com base nas avaliações.
                    </div>
                  )}

                  {isOpen && (
                    <button
                      type="button"
                      onClick={() => setHomologandoQuinzena(q)}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold text-xs shadow-md hover:from-amber-600 hover:to-yellow-700 transition-all cursor-pointer"
                    >
                      Encerrar & Consagrar Vencedora (R$ 300)
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL: CADASTRAR / EDITAR VENDEDORA */}
      {/* ====================================================================== */}
      {modalVendedoraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingVendedora ? 'Editar Vendedora' : 'Nova Vendedora'}
              </h3>
              <button
                type="button"
                onClick={() => setModalVendedoraOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVendedora} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Beatriz Alencar"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cargo / Especialidade</label>
                <input
                  type="text"
                  value={formCargo}
                  onChange={(e) => setFormCargo(e.target.value)}
                  placeholder="Ex: Consultora de Moda & Vendas"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Loja / Unidade</label>
                <input
                  type="text"
                  value={formLoja}
                  onChange={(e) => setFormLoja(e.target.value)}
                  placeholder="Ex: Loja Principal"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">URL da Foto / Avatar</label>
                <input
                  type="url"
                  value={formFoto}
                  onChange={(e) => setFormFoto(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Deixe em branco para usar avatar padrão estilizado automaticamente.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalVendedoraOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 shadow transition-colors cursor-pointer"
                >
                  {editingVendedora ? 'Salvar Alterações' : 'Cadastrar Vendedora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL: PLACA DE QR CODE IMPRIMÍVEL PARA BALCÃO */}
      {/* ====================================================================== */}
      {qrModalVendedora && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Placa de QR Code Imprimível</h3>
              <button
                type="button"
                onClick={() => setQrModalVendedora(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Printable Counter Plate Preview */}
            <div id="printable-plate" className="bg-gradient-to-b from-amber-500 via-amber-600 to-yellow-600 text-white p-6 sm:p-8 rounded-3xl text-center shadow-xl border-4 border-white space-y-4">
              <div className="inline-flex items-center gap-1.5 bg-slate-950/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-300" />
                <span>Avalie Meu Atendimento</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-3 border-white shadow-lg mb-2">
                  <img src={qrModalVendedora.foto} alt={qrModalVendedora.nome} className="w-full h-full object-cover" />
                </div>
                <h4 className="text-xl sm:text-2xl font-black">{qrModalVendedora.nome}</h4>
                <p className="text-xs text-amber-100">{qrModalVendedora.cargo}</p>
              </div>

              {/* QR Code Canvas/Image */}
              <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl border-2 border-amber-200 mx-auto">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 sm:w-56 sm:h-56 mx-auto" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-2">
                  Aponte a câmera do seu celular
                </span>
              </div>

              <p className="text-xs text-amber-100 font-medium max-w-xs mx-auto">
                Sua avaliação nos ajuda a evoluir e você concorre a benefícios no caixa!
              </p>
            </div>

            {/* Link & Action Buttons */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                <input
                  type="text"
                  readOnly
                  value={qrTargetUrl}
                  className="bg-transparent flex-1 font-mono text-[11px] text-slate-700 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 shrink-0 cursor-pointer"
                >
                  {qrCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handlePrintPlaque}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Plaquinha</span>
                </button>

                <a
                  href={qrDataUrl}
                  download={`qrcode-vendedora-${qrModalVendedora.nome.toLowerCase().replace(/\s+/g, '-')}.png`}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 transition-colors shadow cursor-pointer text-center"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar PNG</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL: MODERAR / DESQUALIFICAR AVALIAÇÃO */}
      {/* ====================================================================== */}
      {disqualifyModalAvaliacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-extrabold text-slate-900 text-base">Desqualificar Avaliação</h3>
            </div>

            <p className="text-xs text-slate-600">
              Você está desqualificando o voto <strong className="font-mono">{disqualifyModalAvaliacao.codigoVoto}</strong> referente a <strong>{disqualifyModalAvaliacao.vendedoraNome}</strong>. Ele será desconsiderado do cálculo da média e do ranking.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Motivo da desqualificação</label>
              <textarea
                rows={3}
                value={disqualifyReason}
                onChange={(e) => setDisqualifyReason(e.target.value)}
                placeholder="Ex: Suspeita de voto duplicado do mesmo dispositivo / autopromoção"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDisqualifyModalAvaliacao(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDisqualify}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow transition-colors cursor-pointer"
              >
                Confirmar Desqualificação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL: HOMOLOGAR QUINZENA */}
      {/* ====================================================================== */}
      {homologandoQuinzena && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-500">
              <Trophy className="w-6 h-6" />
              <h3 className="font-extrabold text-slate-900 text-base">Homologar Vencedora da Quinzena</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja homologar o encerramento da quinzena <strong>{homologandoQuinzena.rotulo}</strong> e confirmar o pagamento de <strong>R$ {homologandoQuinzena.premioValor.toFixed(2).replace('.', ',')}</strong> para a líder atual?
            </p>

            {ranking?.lider ? (
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Vencedora Consagrada</span>
                <h4 className="text-lg font-black text-slate-900 mt-1">{ranking.lider.vendedoraNome}</h4>
                <div className="flex items-center justify-center gap-2 mt-1 text-xs font-bold text-amber-800">
                  <span>Média: {ranking.lider.mediaGeral.toFixed(2)} ★</span>
                  <span>•</span>
                  <span>{ranking.lider.totalVotos} avaliações</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-rose-600 font-semibold">
                Nenhuma vendedora pontuou nesta quinzena ainda.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setHomologandoQuinzena(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmHomologar}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Homologar & Fechar Quinzena
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
