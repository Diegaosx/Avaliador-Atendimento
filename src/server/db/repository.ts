import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  User,
  UserRole,
  UserStatus,
  Locale,
  AuditLog,
  DailyMetricPoint,
  DashboardSummary,
  Vendedora,
  Avaliacao,
  Quinzena,
  RankingItem,
  RankingSummary,
} from '../../shared/types';
import { hashPassword, verifyPassword, hashToken } from '../security/crypto-shield';
import pg from 'pg';
import { env } from '../config/env';

export interface StoredUser extends User {
  passwordHash: string;
}

export interface PasswordResetRecord {
  id: string;
  userId: string;
  email: string;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

interface DatabaseSchemaState {
  users: StoredUser[];
  passwordResets: PasswordResetRecord[];
  auditLogs: AuditLog[];
  metricsDaily: DailyMetricPoint[];
  vendedoras: Vendedora[];
  avaliacoes: Avaliacao[];
  quinzenas: Quinzena[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'kore_postgres_store.json');

export function calculateQuinzenaInfo(date: Date = new Date()): {
  id: string;
  ano: number;
  mes: number;
  quinzena: 1 | 2;
  rotulo: string;
  dataInicio: string;
  dataFim: string;
} {
  const ano = date.getFullYear();
  const mes = date.getMonth() + 1;
  const mesStr = String(mes).padStart(2, '0');
  const dia = date.getDate();
  const lastDay = new Date(ano, mes, 0).getDate();

  if (dia <= 15) {
    return {
      id: `${ano}-${mesStr}-Q1`,
      ano,
      mes,
      quinzena: 1,
      rotulo: `01 a 15/${mesStr}/${ano}`,
      dataInicio: `${ano}-${mesStr}-01T00:00:00.000Z`,
      dataFim: `${ano}-${mesStr}-15T23:59:59.999Z`,
    };
  } else {
    return {
      id: `${ano}-${mesStr}-Q2`,
      ano,
      mes,
      quinzena: 2,
      rotulo: `16 a ${lastDay}/${mesStr}/${ano}`,
      dataInicio: `${ano}-${mesStr}-16T00:00:00.000Z`,
      dataFim: `${ano}-${mesStr}-${lastDay}T23:59:59.999Z`,
    };
  }
}

function formatDateKey(date: Date): { date: string; label: string } {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return {
    date: `${yyyy}-${mm}-${dd}`,
    label: `${dd}/${mm}`,
  };
}

function createInitialSeed(): DatabaseSchemaState {
  const now = new Date();
  const nowIso = now.toISOString();

  const initialUsers: StoredUser[] = [
    {
      id: 'usr_admin_01',
      name: 'Rafael Araujo',
      email: 'admin@kore.dev',
      passwordHash: hashPassword('Admin@123456'),
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      locale: 'pt-BR',
      department: 'Platform Architecture',
      lastLoginAt: nowIso,
      createdAt: new Date(now.getTime() - 28 * 86400000).toISOString(),
      updatedAt: nowIso,
    },
    {
      id: 'usr_client_01',
      name: 'Beatriz Monteiro',
      email: 'cliente@kore.dev',
      passwordHash: hashPassword('Cliente@123456'),
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      locale: 'pt-BR',
      department: 'Operations',
      lastLoginAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      createdAt: new Date(now.getTime() - 24 * 86400000).toISOString(),
      updatedAt: nowIso,
    },
    {
      id: 'usr_client_02',
      name: 'Carlos Méndez',
      email: 'carlos.mendez@kore.dev',
      passwordHash: hashPassword('Cliente@123456'),
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      locale: 'es',
      department: 'Finance',
      lastLoginAt: new Date(now.getTime() - 14 * 3600000).toISOString(),
      createdAt: new Date(now.getTime() - 19 * 86400000).toISOString(),
      updatedAt: nowIso,
    },
  ];

  const metricsDaily: DailyMetricPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const { date, label } = formatDateKey(d);
    const dayIndex = 29 - i;
    const wave = Math.sin(dayIndex * 0.45);
    const progressiveUsers = Math.min(
      initialUsers.length,
      Math.max(1, Math.ceil(((dayIndex + 1) / 30) * initialUsers.length))
    );
    const loginsCount = Math.max(8, Math.round(18 + dayIndex * 1.4 + wave * 6));
    const actionsCount = Math.max(25, Math.round(64 + dayIndex * 4.8 + wave * 18));
    metricsDaily.push({
      date,
      label,
      usersCount: i === 0 ? initialUsers.length : progressiveUsers,
      loginsCount,
      actionsCount,
    });
  }

  const initialVendedoras: Vendedora[] = [
    {
      id: 'vnd_01',
      nome: 'Juliana Rocha',
      foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      cargo: 'Consultora de Vendas Sênior',
      loja: 'Loja Principal',
      ativa: true,
      criadaEm: new Date(now.getTime() - 40 * 86400000).toISOString(),
    },
    {
      id: 'vnd_02',
      nome: 'Camila Martins',
      foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
      cargo: 'Consultora de Estilo',
      loja: 'Loja Principal',
      ativa: true,
      criadaEm: new Date(now.getTime() - 35 * 86400000).toISOString(),
    },
    {
      id: 'vnd_03',
      nome: 'Fernanda Lima',
      foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      cargo: 'Especialista em Produtos',
      loja: 'Loja Principal',
      ativa: true,
      criadaEm: new Date(now.getTime() - 30 * 86400000).toISOString(),
    },
    {
      id: 'vnd_04',
      nome: 'Beatriz Alencar',
      foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      cargo: 'Consultora de Vendas',
      loja: 'Loja Principal',
      ativa: true,
      criadaEm: new Date(now.getTime() - 25 * 86400000).toISOString(),
    },
    {
      id: 'vnd_05',
      nome: 'Larissa Prado',
      foto: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80',
      cargo: 'Atendimento & Encantamento',
      loja: 'Loja Principal',
      ativa: true,
      criadaEm: new Date(now.getTime() - 20 * 86400000).toISOString(),
    },
  ];

  const initialQuinzenas: Quinzena[] = [
    {
      id: '2026-11-Q1',
      ano: 2026,
      mes: 11,
      quinzena: 1,
      rotulo: '01 a 15/11/2026',
      dataInicio: '2026-11-01T00:00:00.000Z',
      dataFim: '2026-11-15T23:59:59.999Z',
      premioValor: 300,
      status: 'aberta',
    },
    {
      id: '2026-11-Q2',
      ano: 2026,
      mes: 11,
      quinzena: 2,
      rotulo: '16 a 30/11/2026',
      dataInicio: '2026-11-16T00:00:00.000Z',
      dataFim: '2026-11-30T23:59:59.999Z',
      premioValor: 300,
      status: 'aberta',
    },
    {
      id: '2026-10-Q2',
      ano: 2026,
      mes: 10,
      quinzena: 2,
      rotulo: '16 a 31/10/2026',
      dataInicio: '2026-10-16T00:00:00.000Z',
      dataFim: '2026-10-31T23:59:59.999Z',
      premioValor: 300,
      status: 'encerrada',
      vencedoraId: 'vnd_01',
      vencedoraNome: 'Juliana Rocha',
      vencedoraMedia: 4.96,
      vencedoraTotalVotos: 48,
      homologadoEm: '2026-10-31T22:00:00.000Z',
    },
  ];

  // Seed sample evaluations for 2026-11-Q1 with realistic feedback and codes
  const sampleEvaluationsSeed: Avaliacao[] = [
    {
      id: 'avl_001',
      codigoVoto: '#ENC-7821',
      vendedoraId: 'vnd_01',
      vendedoraNome: 'Juliana Rocha',
      sorriso: 5,
      cordialidade: 5,
      conhecimento: 5,
      experiencia: 5,
      media: 5.0,
      clienteNome: 'Mariana Silva',
      clienteTelefone: '(11) 98421-9981',
      comentario: 'Atendimento impecável! A Juliana foi super atenciosa e me explicou todas as dúvidas com paciência.',
      quinzenaId: '2026-11-Q1',
      quinzenaRotulo: '01 a 15/11/2026',
      ipAddress: '189.40.12.89',
      criadaEm: new Date(now.getTime() - 2 * 3600000).toISOString(),
      status: 'valida',
    },
    {
      id: 'avl_002',
      codigoVoto: '#ENC-4912',
      vendedoraId: 'vnd_02',
      vendedoraNome: 'Camila Martins',
      sorriso: 5,
      cordialidade: 5,
      conhecimento: 4,
      experiencia: 5,
      media: 4.75,
      clienteNome: 'Patrícia Souza',
      clienteTelefone: '(11) 97120-4432',
      comentario: 'Amei a recomendação do look! Muito educada e simpática.',
      quinzenaId: '2026-11-Q1',
      quinzenaRotulo: '01 a 15/11/2026',
      ipAddress: '177.18.90.14',
      criadaEm: new Date(now.getTime() - 3 * 3600000).toISOString(),
      status: 'valida',
    },
    {
      id: 'avl_003',
      codigoVoto: '#ENC-6304',
      vendedoraId: 'vnd_03',
      vendedoraNome: 'Fernanda Lima',
      sorriso: 5,
      cordialidade: 4,
      conhecimento: 5,
      experiencia: 5,
      media: 4.75,
      clienteNome: 'Renata Castro',
      clienteTelefone: '(11) 99876-1123',
      comentario: 'Conhece muito sobre os produtos, me ajudou a escolher o tamanho perfeito.',
      quinzenaId: '2026-11-Q1',
      quinzenaRotulo: '01 a 15/11/2026',
      ipAddress: '187.54.21.03',
      criadaEm: new Date(now.getTime() - 5 * 3600000).toISOString(),
      status: 'valida',
    },
    {
      id: 'avl_004',
      codigoVoto: '#ENC-8199',
      vendedoraId: 'vnd_01',
      vendedoraNome: 'Juliana Rocha',
      sorriso: 5,
      cordialidade: 5,
      conhecimento: 5,
      experiencia: 5,
      media: 5.0,
      clienteNome: 'Carla Dias',
      clienteTelefone: '(11) 96541-0987',
      comentario: 'O sorriso e a boa vontade da Juliana contagiam! Saí encantada com a loja.',
      quinzenaId: '2026-11-Q1',
      quinzenaRotulo: '01 a 15/11/2026',
      ipAddress: '189.12.77.45',
      criadaEm: new Date(now.getTime() - 6 * 3600000).toISOString(),
      status: 'valida',
    },
    {
      id: 'avl_005',
      codigoVoto: '#ENC-2940',
      vendedoraId: 'vnd_04',
      vendedoraNome: 'Beatriz Alencar',
      sorriso: 4,
      cordialidade: 5,
      conhecimento: 4,
      experiencia: 4,
      media: 4.25,
      clienteNome: 'Aline Oliveira',
      clienteTelefone: '(11) 94321-7788',
      comentario: 'Muito cordial e prestativa durante todo o processo!',
      quinzenaId: '2026-11-Q1',
      quinzenaRotulo: '01 a 15/11/2026',
      ipAddress: '179.99.12.33',
      criadaEm: new Date(now.getTime() - 8 * 3600000).toISOString(),
      status: 'valida',
    },
    {
      id: 'avl_006',
      codigoVoto: '#ENC-5128',
      vendedoraId: 'vnd_05',
      vendedoraNome: 'Larissa Prado',
      sorriso: 5,
      cordialidade: 5,
      conhecimento: 4,
      experiencia: 4,
      media: 4.5,
      clienteNome: 'Flávia Mendes',
      clienteTelefone: '(11) 98711-6655',
      comentario: 'Super rápida e com atendimento muito caloroso.',
      quinzenaId: '2026-11-Q1',
      quinzenaRotulo: '01 a 15/11/2026',
      ipAddress: '187.10.88.92',
      criadaEm: new Date(now.getTime() - 11 * 3600000).toISOString(),
      status: 'valida',
    },
    {
      id: 'avl_007',
      codigoVoto: '#ENC-9912',
      vendedoraId: 'vnd_02',
      vendedoraNome: 'Camila Martins',
      sorriso: 5,
      cordialidade: 5,
      conhecimento: 5,
      experiencia: 5,
      media: 5.0,
      clienteNome: 'Juliana Costa',
      clienteTelefone: '(11) 91234-8899',
      comentario: 'Maravilhosa! Me atendeu com tanta atenção que comprei mais do que planejava.',
      quinzenaId: '2026-11-Q1',
      quinzenaRotulo: '01 a 15/11/2026',
      ipAddress: '177.34.88.19',
      criadaEm: new Date(now.getTime() - 14 * 3600000).toISOString(),
      status: 'valida',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'log_seed_01',
      timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(),
      actorId: 'usr_admin_01',
      actorEmail: 'admin@kore.dev',
      actorRole: 'admin',
      action: 'QUINZENA_INITIALIZED',
      category: 'security',
      resource: '/api/quinzenas',
      status: 'success',
      ipAddress: '127.0.0.1',
      latencyMs: 3,
      metadata: { quinzenaId: '2026-11-Q1', premioValor: 300 },
    },
  ];

  return {
    users: initialUsers,
    passwordResets: [],
    auditLogs,
    metricsDaily,
    vendedoras: initialVendedoras,
    avaliacoes: sampleEvaluationsSeed,
    quinzenas: initialQuinzenas,
  };
}

class PostgresRepository {
  private state: DatabaseSchemaState;
  private pool: pg.Pool | null = null;
  private isPostgresActive: boolean = false;

  constructor() {
    this.state = this.loadOrInitialize();
    this.initializePostgres();
  }

  public getIsPostgresConnected(): boolean {
    return this.isPostgresActive;
  }

  private async initializePostgres() {
    if (!env.POSTGRES_ENABLED) {
      console.log('ℹ️ PostgreSQL desabilitado. Operando no modo embutido (.data/kore_postgres_store.json).');
      return;
    }

    try {
      const config: pg.PoolConfig = env.DATABASE_URL
        ? {
            connectionString: env.DATABASE_URL,
            ssl: env.POSTGRES_SSL ? { rejectUnauthorized: false } : undefined,
            max: env.POSTGRES_POOL_MAX,
          }
        : {
            host: env.POSTGRES_HOST,
            port: env.POSTGRES_PORT,
            user: env.POSTGRES_USER,
            password: env.POSTGRES_PASSWORD,
            database: env.POSTGRES_DB,
            ssl: env.POSTGRES_SSL ? { rejectUnauthorized: false } : undefined,
            max: env.POSTGRES_POOL_MAX,
          };

      this.pool = new pg.Pool(config);
      const client = await this.pool.connect();
      client.release();
      this.isPostgresActive = true;
      console.log('✅ Conexão com PostgreSQL estabelecida com sucesso!');

      await this.runPostgresMigrations();
      await this.syncStateFromPostgres();
    } catch (err: unknown) {
      console.warn('⚠️ Não foi possível conectar ao PostgreSQL. Mantendo modo embutido:', (err as Error).message);
      this.pool = null;
      this.isPostgresActive = false;
    }
  }

  private async runPostgresMigrations() {
    if (!this.pool) return;
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(160) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'client',
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          locale VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
          department VARCHAR(120) NOT NULL DEFAULT 'General',
          last_login_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS vendedoras (
          id VARCHAR(50) PRIMARY KEY,
          nome VARCHAR(160) NOT NULL,
          foto TEXT,
          cargo VARCHAR(120),
          loja VARCHAR(120) DEFAULT 'Loja Principal',
          ativa BOOLEAN NOT NULL DEFAULT true,
          criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS quinzenas (
          id VARCHAR(40) PRIMARY KEY,
          ano INTEGER NOT NULL,
          mes INTEGER NOT NULL,
          quinzena INTEGER NOT NULL,
          rotulo VARCHAR(60) NOT NULL,
          data_inicio TIMESTAMPTZ NOT NULL,
          data_fim TIMESTAMPTZ NOT NULL,
          premio_valor NUMERIC(10,2) NOT NULL DEFAULT 300.00,
          status VARCHAR(20) NOT NULL DEFAULT 'aberta',
          vencedora_id VARCHAR(50),
          vencedora_nome VARCHAR(160),
          vencedora_media NUMERIC(3,2),
          vencedora_total_votos INTEGER,
          homologado_em TIMESTAMPTZ
        );

        CREATE TABLE IF NOT EXISTS avaliacoes (
          id VARCHAR(50) PRIMARY KEY,
          codigo_voto VARCHAR(30) NOT NULL UNIQUE,
          vendedora_id VARCHAR(50) NOT NULL,
          vendedora_nome VARCHAR(160) NOT NULL,
          sorriso INTEGER NOT NULL,
          cordialidade INTEGER NOT NULL,
          conhecimento INTEGER NOT NULL,
          experiencia INTEGER NOT NULL,
          media NUMERIC(3,2) NOT NULL,
          cliente_nome VARCHAR(160),
          cliente_telefone VARCHAR(40),
          comentario TEXT,
          quinzena_id VARCHAR(40) NOT NULL,
          quinzena_rotulo VARCHAR(60) NOT NULL,
          ip_address VARCHAR(64) NOT NULL,
          criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          status VARCHAR(20) NOT NULL DEFAULT 'valida',
          desqualificada_motivo TEXT
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR(50) PRIMARY KEY,
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          actor_id VARCHAR(50),
          actor_email VARCHAR(255) NOT NULL,
          actor_role VARCHAR(32) NOT NULL,
          action VARCHAR(120) NOT NULL,
          category VARCHAR(32) NOT NULL,
          resource VARCHAR(255) NOT NULL,
          status VARCHAR(16) NOT NULL,
          ip_address VARCHAR(64) NOT NULL,
          latency_ms INTEGER NOT NULL DEFAULT 0,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb
        );
      `);
      console.log('✅ Tabelas PostgreSQL migradas com sucesso.');
    } catch (err) {
      console.error('Erro nas migrações do PostgreSQL:', err);
    }
  }

  private async syncStateFromPostgres() {
    if (!this.pool) return;
    try {
      // 1. Sync Vendedoras
      const resVend = await this.pool.query('SELECT * FROM vendedoras ORDER BY criada_em DESC');
      if (resVend.rows.length === 0) {
        for (const v of this.state.vendedoras) {
          await this.pool.query(
            'INSERT INTO vendedoras (id, nome, foto, cargo, loja, ativa, criada_em) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
            [v.id, v.nome, v.foto, v.cargo, v.loja, v.ativa, v.criadaEm]
          );
        }
      } else {
        this.state.vendedoras = resVend.rows.map((r: any) => ({
          id: r.id,
          nome: r.nome,
          foto: r.foto,
          cargo: r.cargo,
          loja: r.loja,
          ativa: r.ativa,
          criadaEm: new Date(r.criada_em).toISOString(),
        }));
      }

      // 2. Sync Quinzenas
      const resQnz = await this.pool.query('SELECT * FROM quinzenas ORDER BY ano DESC, mes DESC, quinzena DESC');
      if (resQnz.rows.length === 0) {
        for (const q of this.state.quinzenas) {
          await this.pool.query(
            `INSERT INTO quinzenas (id, ano, mes, quinzena, rotulo, data_inicio, data_fim, premio_valor, status, vencedora_id, vencedora_nome, vencedora_media, vencedora_total_votos, homologado_em)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT (id) DO NOTHING`,
            [q.id, q.ano, q.mes, q.quinzena, q.rotulo, q.dataInicio, q.dataFim, q.premioValor, q.status, q.vencedoraId || null, q.vencedoraNome || null, q.vencedoraMedia || null, q.vencedoraTotalVotos || null, q.homologadoEm || null]
          );
        }
      } else {
        this.state.quinzenas = resQnz.rows.map((r: any) => ({
          id: r.id,
          ano: r.ano,
          mes: r.mes,
          quinzena: r.quinzena,
          rotulo: r.rotulo,
          dataInicio: new Date(r.data_inicio).toISOString(),
          dataFim: new Date(r.data_fim).toISOString(),
          premioValor: Number(r.premio_valor),
          status: r.status,
          vencedoraId: r.vencedora_id || undefined,
          vencedoraNome: r.vencedora_nome || undefined,
          vencedoraMedia: r.vencedora_media ? Number(r.vencedora_media) : undefined,
          vencedoraTotalVotos: r.vencedora_total_votos ? Number(r.vencedora_total_votos) : undefined,
          homologadoEm: r.homologado_em ? new Date(r.homologado_em).toISOString() : undefined,
        }));
      }

      // 3. Sync Avaliacoes
      const resAvl = await this.pool.query('SELECT * FROM avaliacoes ORDER BY criada_em DESC');
      if (resAvl.rows.length === 0) {
        for (const a of this.state.avaliacoes) {
          await this.pool.query(
            `INSERT INTO avaliacoes (id, codigo_voto, vendedora_id, vendedora_nome, sorriso, cordialidade, conhecimento, experiencia, media, cliente_nome, cliente_telefone, comentario, quinzena_id, quinzena_rotulo, ip_address, criada_em, status, desqualificada_motivo)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) ON CONFLICT (id) DO NOTHING`,
            [a.id, a.codigoVoto, a.vendedoraId, a.vendedoraNome, a.sorriso, a.cordialidade, a.conhecimento, a.experiencia, a.media, a.clienteNome || null, a.clienteTelefone || null, a.comentario || null, a.quinzenaId, a.quinzenaRotulo, a.ipAddress, a.criadaEm, a.status, a.desqualificadaMotivo || null]
          );
        }
      } else {
        this.state.avaliacoes = resAvl.rows.map((r: any) => ({
          id: r.id,
          codigoVoto: r.codigo_voto,
          vendedoraId: r.vendedora_id,
          vendedoraNome: r.vendedora_nome,
          sorriso: r.sorriso,
          cordialidade: r.cordialidade,
          conhecimento: r.conhecimento,
          experiencia: r.experiencia,
          media: Number(r.media),
          clienteNome: r.cliente_nome || undefined,
          clienteTelefone: r.cliente_telefone || undefined,
          comentario: r.comentario || undefined,
          quinzenaId: r.quinzena_id,
          quinzenaRotulo: r.quinzena_rotulo,
          ipAddress: r.ip_address,
          criadaEm: new Date(r.criada_em).toISOString(),
          status: r.status,
          desqualificadaMotivo: r.desqualificada_motivo || undefined,
        }));
      }

      // 4. Sync Users
      const resUsr = await this.pool.query('SELECT * FROM users');
      if (resUsr.rows.length === 0) {
        for (const u of this.state.users) {
          await this.pool.query(
            `INSERT INTO users (id, name, email, password_hash, role, status, locale, department, last_login_at, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (id) DO NOTHING`,
            [u.id, u.name, u.email, u.passwordHash, u.role, u.status, u.locale, u.department, u.lastLoginAt, u.createdAt, u.updatedAt]
          );
        }
      } else {
        this.state.users = resUsr.rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          passwordHash: r.password_hash,
          role: r.role,
          status: r.status,
          locale: r.locale,
          department: r.department,
          lastLoginAt: r.last_login_at ? new Date(r.last_login_at).toISOString() : null,
          createdAt: new Date(r.created_at).toISOString(),
          updatedAt: new Date(r.updated_at).toISOString(),
        }));
      }
      this.persist();
      console.log('✅ Estado sincronizado com o PostgreSQL.');
    } catch (err) {
      console.error('Erro ao sincronizar com PostgreSQL:', err);
    }
  }

  private loadOrInitialize(): DatabaseSchemaState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw) as DatabaseSchemaState;
        if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
          const seed = createInitialSeed();
          if (!Array.isArray(parsed.vendedoras) || parsed.vendedoras.length === 0) {
            parsed.vendedoras = seed.vendedoras;
          }
          if (!Array.isArray(parsed.avaliacoes) || parsed.avaliacoes.length === 0) {
            parsed.avaliacoes = seed.avaliacoes;
          }
          if (!Array.isArray(parsed.quinzenas) || parsed.quinzenas.length === 0) {
            parsed.quinzenas = seed.quinzenas;
          }
          this.persist(parsed);
          return parsed;
        }
      }
    } catch {
      // Fallback to fresh seed if corrupted
    }
    const seed = createInitialSeed();
    this.persist(seed);
    return seed;
  }

  private persist(state = this.state): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf8');
    } catch {
      // Ignore write failures in read-only filesystems
    }
  }

  private stripPassword(user: StoredUser): User {
    const { passwordHash: _, ...publicUser } = user;
    return publicUser;
  }

  public incrementTodayMetric(field: 'loginsCount' | 'actionsCount' | 'usersCount'): void {
    const { date, label } = formatDateKey(new Date());
    let todayPoint = this.state.metricsDaily.find((m) => m.date === date);
    if (!todayPoint) {
      todayPoint = {
        date,
        label,
        usersCount: this.state.users.length,
        loginsCount: 1,
        actionsCount: 1,
      };
      this.state.metricsDaily.push(todayPoint);
    }
    if (field === 'usersCount') {
      todayPoint.usersCount = this.state.users.length;
    } else {
      todayPoint[field] += 1;
    }
    this.persist();
  }

  public listUsers(): User[] {
    return this.state.users.map((u) => this.stripPassword(u));
  }

  public findUserById(id: string): User | null {
    const found = this.state.users.find((u) => u.id === id);
    return found ? this.stripPassword(found) : null;
  }

  public findStoredUserById(id: string): StoredUser | null {
    return this.state.users.find((u) => u.id === id) || null;
  }

  public findStoredUserByEmail(email: string): StoredUser | null {
    const clean = email.trim().toLowerCase();
    return this.state.users.find((u) => u.email.toLowerCase() === clean) || null;
  }

  public verifyUserCredentials(email: string, passwordPlain: string): User | null {
    const stored = this.findStoredUserByEmail(email);
    if (!stored) return null;
    if (!verifyPassword(passwordPlain, stored.passwordHash)) return null;
    stored.lastLoginAt = new Date().toISOString();
    this.incrementTodayMetric('loginsCount');
    this.persist();
    return this.stripPassword(stored);
  }

  public createUser(params: {
    name: string;
    email: string;
    passwordPlain: string;
    role: UserRole;
    status?: UserStatus;
    locale?: Locale;
    department?: string;
  }): User {
    const existing = this.findStoredUserByEmail(params.email);
    if (existing) {
      throw new Error('E-mail already registered');
    }
    const nowIso = new Date().toISOString();
    const newUser: StoredUser = {
      id: `usr_${crypto.randomBytes(6).toString('hex')}`,
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      passwordHash: hashPassword(params.passwordPlain),
      role: params.role,
      status: params.status || UserStatus.ACTIVE,
      locale: params.locale || 'pt-BR',
      department: params.department?.trim() || 'General',
      lastLoginAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    this.state.users.unshift(newUser);
    this.incrementTodayMetric('usersCount');
    this.persist();
    return this.stripPassword(newUser);
  }

  public updateUser(
    id: string,
    updates: {
      name?: string;
      email?: string;
      role?: UserRole;
      status?: UserStatus;
      locale?: Locale;
      department?: string;
      passwordPlain?: string;
    }
  ): User {
    const target = this.findStoredUserById(id);
    if (!target) {
      throw new Error('User not found');
    }
    if (updates.email && updates.email.toLowerCase() !== target.email.toLowerCase()) {
      const duplicate = this.findStoredUserByEmail(updates.email);
      if (duplicate && duplicate.id !== id) {
        throw new Error('E-mail already in use by another account');
      }
      target.email = updates.email.trim().toLowerCase();
    }
    if (updates.name !== undefined) target.name = updates.name.trim();
    if (updates.role !== undefined) target.role = updates.role;
    if (updates.status !== undefined) target.status = updates.status;
    if (updates.locale !== undefined) target.locale = updates.locale;
    if (updates.department !== undefined) target.department = updates.department.trim();
    if (updates.passwordPlain && updates.passwordPlain.length >= 6) {
      target.passwordHash = hashPassword(updates.passwordPlain);
    }
    target.updatedAt = new Date().toISOString();
    this.persist();
    return this.stripPassword(target);
  }

  public deleteUser(id: string): boolean {
    const index = this.state.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    this.state.users.splice(index, 1);
    this.incrementTodayMetric('usersCount');
    this.persist();
    return true;
  }

  public storePasswordReset(params: {
    userId: string;
    email: string;
    tokenHash: string;
    expiresInMinutes?: number;
  }): PasswordResetRecord {
    const expiresAt = new Date(
      Date.now() + (params.expiresInMinutes ?? 30) * 60000
    ).toISOString();
    const record: PasswordResetRecord = {
      id: `rst_${crypto.randomBytes(6).toString('hex')}`,
      userId: params.userId,
      email: params.email,
      tokenHash: params.tokenHash,
      expiresAt,
      usedAt: null,
      createdAt: new Date().toISOString(),
    };
    this.state.passwordResets.unshift(record);
    this.persist();
    return record;
  }

  public consumePasswordReset(rawToken: string, newPasswordPlain: string): User | null {
    const digest = hashToken(rawToken.trim());
    const record = this.state.passwordResets.find(
      (r) => r.tokenHash === digest && r.usedAt === null
    );
    if (!record) return null;
    if (new Date(record.expiresAt).getTime() < Date.now()) {
      return null;
    }
    const user = this.findStoredUserById(record.userId);
    if (!user) return null;

    user.passwordHash = hashPassword(newPasswordPlain);
    user.updatedAt = new Date().toISOString();
    record.usedAt = new Date().toISOString();
    this.persist();
    return this.stripPassword(user);
  }

  public appendAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const fullLog: AuditLog = {
      id: `log_${crypto.randomBytes(6).toString('hex')}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.state.auditLogs.unshift(fullLog);
    if (this.state.auditLogs.length > 500) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 500);
    }
    this.incrementTodayMetric('actionsCount');
    this.persist();

    if (this.pool && this.isPostgresActive) {
      this.pool
        .query(
          `INSERT INTO audit_logs (id, timestamp, actor_id, actor_email, actor_role, action, category, resource, status, ip_address, latency_ms, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            fullLog.id,
            fullLog.timestamp,
            fullLog.actorId || null,
            fullLog.actorEmail,
            fullLog.actorRole,
            fullLog.action,
            fullLog.category,
            fullLog.resource,
            fullLog.status,
            fullLog.ipAddress,
            fullLog.latencyMs,
            JSON.stringify(fullLog.metadata || {}),
          ]
        )
        .catch((err) => console.error('Erro ao gravar audit log no PostgreSQL:', err));
    }

    return fullLog;
  }

  public listAuditLogs(params?: {
    category?: string;
    search?: string;
    actorId?: string;
    limit?: number;
  }): AuditLog[] {
    let logs = [...this.state.auditLogs];
    if (params?.actorId) {
      logs = logs.filter((l) => l.actorId === params.actorId);
    }
    if (params?.category && params.category !== 'all') {
      logs = logs.filter((l) => l.category === params.category);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.actorEmail.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.resource.toLowerCase().includes(q) ||
          l.ipAddress.toLowerCase().includes(q)
      );
    }
    return logs.slice(0, params?.limit ?? 100);
  }

  public getDashboardSummary(days = 30): DashboardSummary {
    const clampedDays = Math.min(30, Math.max(7, days));
    const series = this.state.metricsDaily.slice(-clampedDays);
    const totalUsers = this.state.users.length;
    const activeUsers = this.state.users.filter((u) => u.status === UserStatus.ACTIVE).length;

    const loginsLast30d = series.reduce((acc, item) => acc + item.loginsCount, 0);
    const actionsLast30d = series.reduce((acc, item) => acc + item.actionsCount, 0);

    return {
      totals: {
        totalUsers,
        activeUsers,
        loginsLast30d,
        actionsLast30d,
        usersDeltaPct: 14.2,
        loginsDeltaPct: 18.6,
        actionsDeltaPct: 24.1,
      },
      series,
    };
  }

  // ==========================================================================
  // VENDEDORAS MANAGEMENT
  // ==========================================================================

  public listVendedoras(activeOnly = false): Vendedora[] {
    if (activeOnly) {
      return this.state.vendedoras.filter((v) => v.ativa);
    }
    return [...this.state.vendedoras];
  }

  public findVendedoraById(id: string): Vendedora | null {
    return this.state.vendedoras.find((v) => v.id === id) || null;
  }

  public createVendedora(params: {
    nome: string;
    foto?: string;
    cargo?: string;
    loja?: string;
  }): Vendedora {
    const id = `vnd_${crypto.randomBytes(4).toString('hex')}`;
    const fallbackPhotos = [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80',
    ];
    const defaultPhoto = fallbackPhotos[Math.floor(Math.random() * fallbackPhotos.length)];

    const vendedora: Vendedora = {
      id,
      nome: params.nome.trim(),
      foto: params.foto?.trim() || defaultPhoto,
      cargo: params.cargo?.trim() || 'Consultora de Vendas',
      loja: params.loja?.trim() || 'Loja Principal',
      ativa: true,
      criadaEm: new Date().toISOString(),
    };

    this.state.vendedoras.unshift(vendedora);
    this.persist();

    if (this.pool && this.isPostgresActive) {
      this.pool
        .query(
          `INSERT INTO vendedoras (id, nome, foto, cargo, loja, ativa, criada_em) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [vendedora.id, vendedora.nome, vendedora.foto, vendedora.cargo, vendedora.loja, vendedora.ativa, vendedora.criadaEm]
        )
        .catch((err) => console.error('Erro ao persistir vendedora no PostgreSQL:', err));
    }

    return vendedora;
  }

  public updateVendedora(id: string, updates: Partial<Vendedora>): Vendedora {
    const item = this.findVendedoraById(id);
    if (!item) {
      throw new Error('Vendedora não encontrada');
    }
    if (updates.nome !== undefined) item.nome = updates.nome.trim();
    if (updates.foto !== undefined) item.foto = updates.foto.trim();
    if (updates.cargo !== undefined) item.cargo = updates.cargo.trim();
    if (updates.loja !== undefined) item.loja = updates.loja.trim();
    if (updates.ativa !== undefined) item.ativa = updates.ativa;
    this.persist();

    if (this.pool && this.isPostgresActive) {
      this.pool
        .query(
          `UPDATE vendedoras SET nome = $1, foto = $2, cargo = $3, loja = $4, ativa = $5 WHERE id = $6`,
          [item.nome, item.foto, item.cargo, item.loja, item.ativa, item.id]
        )
        .catch((err) => console.error('Erro ao atualizar vendedora no PostgreSQL:', err));
    }

    return item;
  }

  public deleteVendedora(id: string): boolean {
    const idx = this.state.vendedoras.findIndex((v) => v.id === id);
    if (idx === -1) return false;
    this.state.vendedoras.splice(idx, 1);
    this.persist();

    if (this.pool && this.isPostgresActive) {
      this.pool
        .query(`DELETE FROM vendedoras WHERE id = $1`, [id])
        .catch((err) => console.error('Erro ao deletar vendedora no PostgreSQL:', err));
    }

    return true;
  }

  // ==========================================================================
  // QUINZENAS MANAGEMENT
  // ==========================================================================

  public listQuinzenas(): Quinzena[] {
    return [...this.state.quinzenas];
  }

  public getQuinzenaById(id: string): Quinzena | null {
    return this.state.quinzenas.find((q) => q.id === id) || null;
  }

  public ensureQuinzena(id?: string): Quinzena {
    if (id) {
      const existing = this.getQuinzenaById(id);
      if (existing) return existing;
    }

    const currentInfo = calculateQuinzenaInfo();
    let current = this.state.quinzenas.find((q) => q.id === currentInfo.id);
    if (!current) {
      current = {
        id: currentInfo.id,
        ano: currentInfo.ano,
        mes: currentInfo.mes,
        quinzena: currentInfo.quinzena,
        rotulo: currentInfo.rotulo,
        dataInicio: currentInfo.dataInicio,
        dataFim: currentInfo.dataFim,
        premioValor: 300,
        status: 'aberta',
      };
      this.state.quinzenas.unshift(current);
      this.persist();
    }
    return current;
  }

  public encerrarQuinzena(quinzenaId: string, homologadoPor: string): Quinzena {
    const quinzena = this.ensureQuinzena(quinzenaId);
    if (quinzena.status === 'encerrada') {
      return quinzena;
    }

    const ranking = this.getRanking(quinzenaId);
    const lider = ranking.lider;

    quinzena.status = 'encerrada';
    quinzena.homologadoEm = new Date().toISOString();
    if (lider) {
      quinzena.vencedoraId = lider.vendedoraId;
      quinzena.vencedoraNome = lider.vendedoraNome;
      quinzena.vencedoraMedia = lider.mediaGeral;
      quinzena.vencedoraTotalVotos = lider.totalVotos;
    }

    this.appendAuditLog({
      actorId: null,
      actorEmail: homologadoPor,
      actorRole: 'admin',
      action: 'QUINZENA_HOMOLOGADA',
      category: 'security',
      resource: `/api/quinzenas/${quinzenaId}/encerrar`,
      status: 'success',
      ipAddress: '127.0.0.1',
      latencyMs: 1,
      metadata: {
        quinzenaId,
        vencedoraNome: quinzena.vencedoraNome || 'Nenhuma',
        premioValor: quinzena.premioValor,
      },
    });

    this.persist();

    if (this.pool && this.isPostgresActive) {
      this.pool
        .query(
          `UPDATE quinzenas
           SET status = $1, homologado_em = $2, vencedora_id = $3, vencedora_nome = $4, vencedora_media = $5, vencedora_total_votos = $6
           WHERE id = $7`,
          [
            quinzena.status,
            quinzena.homologadoEm,
            quinzena.vencedoraId || null,
            quinzena.vencedoraNome || null,
            quinzena.vencedoraMedia || null,
            quinzena.vencedoraTotalVotos || null,
            quinzena.id,
          ]
        )
        .catch((err) => console.error('Erro ao atualizar quinzena no PostgreSQL:', err));
    }

    return quinzena;
  }

  // ==========================================================================
  // AVALIACOES & VOTING CODE GENERATION
  // ==========================================================================

  private generateUniqueCodigoVoto(): string {
    for (let i = 0; i < 200; i++) {
      const codeNumber = Math.floor(1000 + Math.random() * 9000);
      const code = `#ENC-${codeNumber}`;
      if (!this.state.avaliacoes.some((a) => a.codigoVoto === code)) {
        return code;
      }
    }
    return `#ENC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  }

  public createAvaliacao(data: {
    vendedoraId: string;
    sorriso: number;
    cordialidade: number;
    conhecimento: number;
    experiencia: number;
    clienteNome?: string;
    clienteTelefone?: string;
    comentario?: string;
    ipAddress: string;
    quinzenaId?: string;
  }): Avaliacao {
    const vendedora = this.findVendedoraById(data.vendedoraId);
    if (!vendedora) {
      throw new Error('Vendedora não encontrada');
    }

    // Clamp ratings strictly between 1 and 5
    const clamp = (val: number) => Math.min(5, Math.max(1, Math.round(val)));
    const sorriso = clamp(data.sorriso);
    const cordialidade = clamp(data.cordialidade);
    const conhecimento = clamp(data.conhecimento);
    const experiencia = clamp(data.experiencia);
    const media = Number(((sorriso + cordialidade + conhecimento + experiencia) / 4).toFixed(2));

    const quinzena = this.ensureQuinzena(data.quinzenaId);
    const codigoVoto = this.generateUniqueCodigoVoto();
    const id = `avl_${crypto.randomBytes(6).toString('hex')}`;

    const novaAvaliacao: Avaliacao = {
      id,
      codigoVoto,
      vendedoraId: vendedora.id,
      vendedoraNome: vendedora.nome,
      sorriso,
      cordialidade,
      conhecimento,
      experiencia,
      media,
      clienteNome: data.clienteNome?.trim() || undefined,
      clienteTelefone: data.clienteTelefone?.trim() || undefined,
      comentario: data.comentario?.trim() || undefined,
      quinzenaId: quinzena.id,
      quinzenaRotulo: quinzena.rotulo,
      ipAddress: data.ipAddress,
      criadaEm: new Date().toISOString(),
      status: 'valida',
    };

    this.state.avaliacoes.unshift(novaAvaliacao);
    this.incrementTodayMetric('actionsCount');
    this.persist();

    if (this.pool && this.isPostgresActive) {
      this.pool
        .query(
          `INSERT INTO avaliacoes (id, codigo_voto, vendedora_id, vendedora_nome, sorriso, cordialidade, conhecimento, experiencia, media, cliente_nome, cliente_telefone, comentario, quinzena_id, quinzena_rotulo, ip_address, criada_em, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            novaAvaliacao.id,
            novaAvaliacao.codigoVoto,
            novaAvaliacao.vendedoraId,
            novaAvaliacao.vendedoraNome,
            novaAvaliacao.sorriso,
            novaAvaliacao.cordialidade,
            novaAvaliacao.conhecimento,
            novaAvaliacao.experiencia,
            novaAvaliacao.media,
            novaAvaliacao.clienteNome || null,
            novaAvaliacao.clienteTelefone || null,
            novaAvaliacao.comentario || null,
            novaAvaliacao.quinzenaId,
            novaAvaliacao.quinzenaRotulo,
            novaAvaliacao.ipAddress,
            novaAvaliacao.criadaEm,
            novaAvaliacao.status,
          ]
        )
        .catch((err) => console.error('Erro ao persistir avaliação no PostgreSQL:', err));
    }

    return novaAvaliacao;
  }

  public listAvaliacoes(params?: {
    quinzenaId?: string;
    vendedoraId?: string;
    search?: string;
    status?: string;
  }): Avaliacao[] {
    let list = [...this.state.avaliacoes];

    if (params?.quinzenaId && params.quinzenaId !== 'all') {
      list = list.filter((a) => a.quinzenaId === params.quinzenaId);
    }
    if (params?.vendedoraId && params.vendedoraId !== 'all') {
      list = list.filter((a) => a.vendedoraId === params.vendedoraId);
    }
    if (params?.status && params.status !== 'all') {
      list = list.filter((a) => a.status === params.status);
    }
    if (params?.search) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.codigoVoto.toLowerCase().includes(q) ||
          a.vendedoraNome.toLowerCase().includes(q) ||
          (a.clienteNome && a.clienteNome.toLowerCase().includes(q)) ||
          (a.comentario && a.comentario.toLowerCase().includes(q))
      );
    }
    return list;
  }

  public desqualificarAvaliacao(
    id: string,
    motivo: string,
    adminEmail: string
  ): Avaliacao | null {
    const avl = this.state.avaliacoes.find((a) => a.id === id);
    if (!avl) return null;

    avl.status = 'desqualificada';
    avl.desqualificadaMotivo = motivo.trim();
    this.appendAuditLog({
      actorId: null,
      actorEmail: adminEmail,
      actorRole: 'admin',
      action: 'AVALIACAO_DESQUALIFICADA',
      category: 'security',
      resource: `/api/avaliacoes/${id}/desqualificar`,
      status: 'warning',
      ipAddress: '127.0.0.1',
      latencyMs: 1,
      metadata: { avaliacaoId: id, codigoVoto: avl.codigoVoto, motivo },
    });
    this.persist();

    if (this.pool && this.isPostgresActive) {
      this.pool
        .query(
          `UPDATE avaliacoes SET status = $1, desqualificada_motivo = $2 WHERE id = $3`,
          [avl.status, avl.desqualificadaMotivo, avl.id]
        )
        .catch((err) => console.error('Erro ao atualizar status de avaliação no PostgreSQL:', err));
    }

    return avl;
  }

  // ==========================================================================
  // RANKING DE ENCANTAMENTO ENGINE
  // ==========================================================================

  public getRanking(quinzenaId?: string): RankingSummary {
    const quinzena = this.ensureQuinzena(quinzenaId);
    const validVotes = this.state.avaliacoes.filter(
      (a) => a.quinzenaId === quinzena.id && a.status === 'valida'
    );

    const vendedoras = this.listVendedoras();

    const rankingItems: RankingItem[] = vendedoras.map((v) => {
      const votes = validVotes.filter((a) => a.vendedoraId === v.id);
      const totalVotos = votes.length;

      if (totalVotos === 0) {
        return {
          posicao: 999,
          vendedoraId: v.id,
          vendedoraNome: v.nome,
          foto: v.foto,
          cargo: v.cargo,
          loja: v.loja,
          totalVotos: 0,
          mediaGeral: 0,
          mediaSorriso: 0,
          mediaCordialidade: 0,
          mediaConhecimento: 0,
          mediaExperiencia: 0,
          percentualEncantamento: 0,
          diferencaLider: 0,
        };
      }

      const sumSorriso = votes.reduce((acc, cur) => acc + cur.sorriso, 0);
      const sumCordialidade = votes.reduce((acc, cur) => acc + cur.cordialidade, 0);
      const sumConhecimento = votes.reduce((acc, cur) => acc + cur.conhecimento, 0);
      const sumExperiencia = votes.reduce((acc, cur) => acc + cur.experiencia, 0);

      const mediaSorriso = Number((sumSorriso / totalVotos).toFixed(2));
      const mediaCordialidade = Number((sumCordialidade / totalVotos).toFixed(2));
      const mediaConhecimento = Number((sumConhecimento / totalVotos).toFixed(2));
      const mediaExperiencia = Number((sumExperiencia / totalVotos).toFixed(2));

      const mediaGeral = Number(
        ((mediaSorriso + mediaCordialidade + mediaConhecimento + mediaExperiencia) / 4).toFixed(2)
      );
      const percentualEncantamento = Number(((mediaGeral / 5) * 100).toFixed(1));

      return {
        posicao: 0,
        vendedoraId: v.id,
        vendedoraNome: v.nome,
        foto: v.foto,
        cargo: v.cargo,
        loja: v.loja,
        totalVotos,
        mediaGeral,
        mediaSorriso,
        mediaCordialidade,
        mediaConhecimento,
        mediaExperiencia,
        percentualEncantamento,
        diferencaLider: 0,
      };
    });

    // Sort: highest mediaGeral first; tiebreaker is totalVotos
    rankingItems.sort((a, b) => {
      if (b.mediaGeral !== a.mediaGeral) {
        return b.mediaGeral - a.mediaGeral;
      }
      return b.totalVotos - a.totalVotos;
    });

    const liderScore = rankingItems.length > 0 ? rankingItems[0].mediaGeral : 0;

    rankingItems.forEach((item, index) => {
      item.posicao = index + 1;
      item.diferencaLider = Number(Math.max(0, liderScore - item.mediaGeral).toFixed(2));
    });

    const totalAvaliacoesQuinzena = validVotes.length;
    const mediaGeralQuinzena =
      totalAvaliacoesQuinzena > 0
        ? Number(
            (
              validVotes.reduce((acc, cur) => acc + cur.media, 0) /
              totalAvaliacoesQuinzena
            ).toFixed(2)
          )
        : 0;

    return {
      quinzena,
      todasQuinzenas: this.listQuinzenas(),
      totalAvaliacoesQuinzena,
      mediaGeralQuinzena,
      premioValor: quinzena.premioValor,
      lider: rankingItems.length > 0 && rankingItems[0].totalVotos > 0 ? rankingItems[0] : null,
      itens: rankingItems,
    };
  }
}

export const dbRepo = new PostgresRepository();
