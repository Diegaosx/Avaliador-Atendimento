# Avaliador de Atendimento & Ranking de Encantamento

Sistema completo para avaliação de atendimento de vendedoras via **QR Code**, com cálculo em tempo real do **Ranking de Encantamento**, controle de **quinzenas com premiação de R$ 300,00**, emissão de **código único de validação de voto** para clientes e **painel restrito para o administrador**.

Desenvolvido sobre a arquitetura robusta do **Kore-Base** com **React 19 + TypeScript, Express, Tailwind CSS, Lucide Icons, Canvas Confetti e QRCode**.

---

## 🌟 Funcionalidades Principais

### 1. Experiência da Cliente (Mobile-First / QR Code)
- **Acesso direto via QR Code**: Ao ler a plaquinha no balcão da loja (`/?v=vnd_id`), a cliente é direcionada diretamente para a avaliação da vendedora que a atendeu.
- **Seletor de vendedoras**: Caso a cliente escaneie o QR Code geral da loja, ela escolhe com 1 toque quem realizou o atendimento.
- **Os 4 Critérios de Avaliação (1 a 5 estrelas)**:
  1. 🌟 **Sorriso & Simpatia**: Acolhimento, calorosidade e alegria no atendimento.
  2. 🤝 **Cordialidade & Atenção**: Respeito, empatia, escuta ativa e paciência.
  3. 💡 **Conhecimento de Produto**: Domínio dos itens, esclarecimento de dúvidas e recomendações assertivas.
  4. ✨ **Experiência da Visita**: Satisfação geral com a compra e o atendimento recebido.
- **Micro-copy emocional interativo**: Cada nível de estrela exibe feedback visual imediato (*"Pouco simpática"*, *"Simpática"*, *"Muito simpática & alegre"*, *"Sorriso contagiante & acolhedor!"*).
- **Cálculo da Média em Tempo Real**: A cliente acompanha a média atribuída (ex: 4.75 ★) antes de submeter.
- **Dados Opcionais**: Nome, WhatsApp/Telefone (para participação em sorteios no caixa) e campo de elogio/comentário.

### 2. Tela de Agradecimento & Código de Validação do Voto
- Animação de confetes comemorativos 🎉.
- **Código Único de Validação do Voto** (ex: `#ENC-7821`):
  - Comprova a legitimidade do voto com total transparência.
  - Pode ser apresentado pela cliente no caixa para concorrer a mimos e sorteios da loja.
  - Botão de 1 clique para "Copiar Código".
- Resumo visual das notas concedidas e dados da vendedora avaliada.

### 3. Visão das Vendedoras — Mural "Ranking de Encantamento"
- **Visão ao vivo das colaboradoras** para acompanhar quem está na frente na disputa pelo prêmio!
- **Banner da Premiação Quinzenal**:
  - Destaque oficial do prêmio de **R$ 300,00** para a colaboradora número 1 de encantamento.
  - Exibição da quinzena ativa: **01 a 15/11** ou **16 a 30/11**.
- **Pódio do Encantamento (Top 3)**:
  - 🥇 **1º Lugar**: Destaque central elevado com coroa dourada, foto ampliada, nota média, total de avaliações e selo de Líder dos R$ 300.
  - 🥈 **2º Lugar**: Medalha de prata com foto e nota.
  - 🥉 **3º Lugar**: Medalha de bronze com foto e nota.
- **Cards com Mini-Barras dos 4 Critérios**: Visualização do desempenho em cada um dos 4 pilares (Sorriso, Cordialidade, Conhecimento, Experiência).
- **Modo TV / Mural**: Modo tela cheia com auto-refresh a cada 30 segundos, ideal para exibir na TV da loja ou sala dos colaboradores.

### 4. Painel Administrativo Restrito (Admin)
- **Autenticação segura via JWT** com proteção contra força bruta (Rate Limiting).
- **Visão Geral & KPIs**:
  - Total de avaliações na quinzena.
  - Média geral da loja (0 a 5.0 ★).
  - Vendedora líder atual e pontuação.
  - Tabela de classificação em tempo real.
- **Gestão de Vendedoras & Gerador de QR Code**:
  - Cadastro, edição e ativação/pausa de vendedoras.
  - **Gerador de Placa de Balcão Pronta para Impressão**:
    - Gera visual de placa de mesa personalizado com foto da vendedora, chamada e QR code de alta resolução.
    - Botão "Imprimir Plaquinha" e "Baixar PNG".
- **Auditoria de Votos & Códigos de Validação**:
  - Busca instantânea por código de voto (`#ENC-...`), vendedora ou cliente.
  - Registro de IP de origem e data/hora para auditoria antifraude.
  - Opção de desqualificar voto suspeito com registro de justificativa.
  - Botão de exportação de relatório completo em **CSV**.
- **Fechamento de Quinzenas (Premiação de R$ 300,00)**:
  - Controle dos ciclos: `01 a 15/11`, `16 a 30/11`, etc.
  - Botão de homologação oficial: consagra a campeã da quinzena e arquiva o prêmio de R$ 300 pago.

---

## 🔑 Credenciais Padrão de Administrador

- **E-mail**: `admin@kore.dev`
- **Senha**: `Admin@123456`

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js `>= 20.0`
- NPM `>= 10.0`

### Instalação
```bash
# Instalar dependências
npm install
```

### Modo de Desenvolvimento
```bash
# Iniciar servidor Express + Vite
npm run dev
```
Acesse no seu navegador: `http://localhost:3000`

### Build de Produção
```bash
# Compilar bundle otimizado
npm run build

# Iniciar servidor em modo produção
npm start
```

---

## 🛠️ Endpoints da API REST

| Método | Rota | Descrição | Acesso |
|---|---|---|---|
| `GET` | `/api/vendedoras` | Lista de vendedoras ativas | Público |
| `POST` | `/api/vendedoras` | Cadastrar nova vendedora | Admin |
| `PUT` | `/api/vendedoras/:id` | Atualizar vendedora | Admin |
| `DELETE` | `/api/vendedoras/:id` | Remover vendedora | Admin |
| `POST` | `/api/avaliacoes` | Registrar voto com os 4 critérios e gerar código `#ENC-...` | Público |
| `GET` | `/api/avaliacoes` | Listar e auditar avaliações | Admin |
| `POST` | `/api/avaliacoes/:id/desqualificar` | Desqualificar avaliação suspeita | Admin |
| `GET` | `/api/ranking` | Ranking de encantamento e pódio quinzenal | Público |
| `GET` | `/api/quinzenas` | Lista de quinzenas disponíveis | Público |
| `POST` | `/api/quinzenas/:id/encerrar` | Homologar vencedora dos R$ 300 e encerrar ciclo | Admin |
| `GET` | `/api/qrcode/:vendedoraId` | Gerar QR Code PNG para a vendedora | Público |
| `POST` | `/api/auth/login` | Login com JWT | Público |

---

## 📂 Estrutura do Repositório

```
├── .data/
│   └── kore_postgres_store.json    # Base de dados persistida em JSON
├── src/
│   ├── components/
│   │   ├── AvaliacaoView.tsx       # Tela da cliente (4 critérios, estrelas e código de voto)
│   │   ├── RankingMuralView.tsx    # Visão das vendedoras, pódio e prêmio de R$ 300
│   │   ├── AdminAvaliadorDashboard.tsx # Painel admin (gestão, QR codes, auditoria e quinzenas)
│   │   ├── AuthSplitScreen.tsx     # Tela de login e cadastro
│   │   ├── DashboardView.tsx       # Métricas de infraestrutura
│   │   ├── UsersManagementView.tsx # Usuários da plataforma
│   │   └── ProfileView.tsx         # Perfil do usuário logado
│   ├── server/
│   │   ├── db/repository.ts        # Repositório de dados e regras de negócio
│   │   ├── security/               # Criptografia, JWT, rate limit e RBAC
│   │   └── services/               # Serviços auxiliares
│   ├── shared/
│   │   ├── types.ts                # Tipos de domínio TypeScript
│   │   └── i18n.ts                 # Dicionários de tradução
│   ├── App.tsx                     # Roteador principal e cabeçalho unificado
│   ├── main.tsx                    # Ponto de entrada do React
│   └── index.css                   # Tailwind CSS e estilos base
├── server.ts                       # Servidor Express com Vite integrado
├── package.json                    # Dependências do projeto
└── tsconfig.json                   # Configurações do TypeScript
```
