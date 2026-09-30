export type GraphNodeType = 'HUB' | 'METHODOLOGY' | 'CASE_STUDY' | 'TOKEN' | 'SECURITY' | 'LIQUIDITY' | 'SMART_MONEY' | 'INFRASTRUCTURE' | 'NOTE';

export interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  cluster: string;
  summary: string;
  contentMarkdown: string;
  tags: string[];
  contractAddress?: string;
  metrics?: Record<string, string | number>;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  relationType: 'belongs_to' | 'references' | 'pools_with' | 'sub_token_of' | 'audits' | 'validates';
  strength?: number;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const INITIAL_CHAT_KNOWLEDGE_GRAPH: KnowledgeGraphData = {
  nodes: [
    // Core Hub
    {
      id: 'hub_crypto_core',
      label: '🧠 Crypto Analytics Core',
      type: 'HUB',
      cluster: 'core',
      summary: 'Центральный аналитический двигатель: синтез ончейна, CEX, DEX и ИИ-верификации без галлюцинаций.',
      contentMarkdown: `# Crypto Analytical Core
Центральное ядро системы аналитики.
- **Главный принцип**: Идентификация актива только через \`blockchain + contract address\`.
- **Строгая рубрикация**: FACT / INFERENCE / RUMOR / MISSING DATA.
- **Анти-поддакивание**: честная оценка рисков, отсутствие иллюзий о "гарантированных пампах".`,
      tags: ['#core', '#architecture', '#crypto_ai'],
    },

    // Methodology Cluster: 4-Gate Decision Radar
    {
      id: 'meth_4gates',
      label: '🛡️ Пирамида 4 Рубежей',
      type: 'METHODOLOGY',
      cluster: 'methodology',
      summary: 'Ступенчатый фильтр отсева шиткоинов и ловушек ликвидности: Контракт -> Пул -> Киты -> Выход.',
      contentMarkdown: `# Пирамида 4 Рубежей (4-Gate Decision Radar)
Ступенчатая система фильтрации для исключения "паралича от данных":

### Рубеж 1: Безопасность Контракта
- Honeypot = 0
- Buy/Sell Tax <= 5%
- Mintable = 0, Ownership Renounced

### Рубеж 2: Качество Ликвидности
- Pure Cash Depth (физические USDT/USDC в пуле)
- Коэффициент Vol/Liq 24h (< 20x, чтобы отсекать MM wash trading)
- Уникальные покупатели (Unique Buyers vs Sellers)

### Рубеж 3: Радар Скрытой Разгрузки (Whales)
- Adjusted Top-10 / Top-20 EOA (без LP и бирж)
- Поведение снайперов Block-0
- Дивергенция цены и балансов китов

### Рубеж 4: Расчет Выхода
- Слиппедж на $1k, $10k, $50k
- Условие отмены сценария (Invalidation)`,
      tags: ['#methodology', '#4gates', '#risk_management'],
    },

    {
      id: 'meth_single_metric_fallacy',
      label: '⚠️ Заблуждение Одной Метрики',
      type: 'METHODOLOGY',
      cluster: 'methodology',
      summary: 'Почему мониторинг притока $150k в AMM сам по себе не двигает цену без свапа.',
      contentMarkdown: `# Разбор: Заблуждение одной метрики (Приток в пул)
### Математика AMM (PancakeSwap / Uniswap)
Цена токена определяется формулой:
\`\`\`
Price = Резерв_USDT / Резерв_Токена
\`\`\`
- Функция \`addLiquidity()\`: вливание $150k USDT **ОБЯЗАНО** сопровождаться добавлением эквивалентного числа токенов по текущей цене. **Цена не меняется ни на цент.**
- Цену двигает **ТОЛЬКО** рыночный свап (\`swapExactTokensForTokens\`), когда USDT отдают в пул, а токены забирают на кошелек.
- **Риск "Приманки ликвидностью" (Liquidity Bait)**: вливание ликвидности перед сбросом токенов создателем, если LP не заблокирован.`,
      tags: ['#amm_math', '#liquidity_trap', '#debunk'],
    },

    // Case Study: Token 0x2b90...7777 (果蝇)
    {
      id: 'token_guoying',
      label: '🪰 永生果蝇 (0x2b90...7777)',
      type: 'TOKEN',
      cluster: 'case_study',
      summary: 'Мем-токен на BSC с капитализацией $3.6M, являющийся материнским хабом сетки из 25 сателлитов.',
      contractAddress: '0x2b90BB9683383B6A1440e116309Ba0187ef67777',
      metrics: {
        network: 'BSC (Chain ID 56)',
        priceUsd: '$0.003615',
        mcap: '$3,615,000',
        pureUsdtLiq: '$50,227 USDT',
        vol24h: '$6,265,000',
        volLiqRatio: '19.3x',
        holders: '9,473',
      },
      contentMarkdown: `# Кейс: 永生果蝇 (Immortal Fruit Fly)
- **Контракт**: \`0x2b90BB9683383B6A1440e116309Ba0187ef67777\`
- **Сеть**: BSC (PancakeSwap V3, Uniswap, flapsh)
- **Эмиссия**: 1,000,000,000 (1 млрд токенов, фикс)
- **Иллюзия глубокого рынка**: капитализация $3.6M опирается всего на **$50,227 реальных USDT** в основном пуле.
- **Статус**: Поздняя скрытая дистрибуция. Топ-1 EOA держит $82k, что превышает весь объем доступного USDT в пуле.`,
      tags: ['#bsc_meme', '#fruit_fly', '#case_study'],
    },

    {
      id: 'token_googlb_cross',
      label: '🏛️ Кросс-пул GOOGLB (bStocks)',
      type: 'LIQUIDITY',
      cluster: 'case_study',
      summary: 'Синтетический пул 果蝇/GOOGLB ($222k TVL) с суточным объемом $4.6M.',
      contractAddress: '0x3F53De71c126BdaBAe20f9cD64848d317f6C3238',
      metrics: {
        pairAddress: '0x189FCfA548968cBd3b0118C2200F05dB00D429F1',
        liqUsd: '$222,561',
        vol24h: '$4,602,374',
      },
      contentMarkdown: `# Синтетический пул 果蝇 / GOOGLB (Alphabet bStocks)
Маркет-мейкеры завязали ликвидность мем-токена не только на стейблкоин, но и на обернутые акции Alphabet (Google).
- Это создает арбитражную петлю и имитирует гигантский объем ($4.6M в сутки).
- Пользователи, торгующие мем-токеном, косвенно зависят от курса и пула GOOGLB на BSC.`,
      tags: ['#bstocks', '#synthetic', '#cross_pair'],
    },

    {
      id: 'case_25_satellites',
      label: '🕸️ Паутина 25 Сателлитов (flapsh)',
      type: 'TOKEN',
      cluster: 'case_study',
      summary: 'Сетка суб-токенов (蛆, CZFLY, AgentFly, 功夫小蝇), откачивающих ликвидность в 果蝇.',
      contentMarkdown: `# Сетка 25 Сателлитов
Адрес \`0x2b90...7777\` выступает в роли Quote-токена (расчетной валюты) для 25 других свежих мем-контрактов:
1. \`功夫小蝇\` (0xAB52...7777)
2. \`蛆\` (0x8771...7777)
3. \`CZFLY\` (0x869f...7777)
4. \`AgentFly\` (0x4283...7777)
5. \`苍蝇叫\` (0x5F14...7777)

**Механика**: Розничные трейдеры покупают мелкие мемы-сателлиты, а ликвидность через смарт-роутеры аккумулируется в материнском контракте.`,
      tags: ['#syndicate_cluster', '#token_mesh', '#mesh_routing'],
    },

    {
      id: 'case_slippage_calc',
      label: '📉 Расчет Слиппеджа на Выход',
      type: 'LIQUIDITY',
      cluster: 'case_study',
      summary: 'Математическая симуляция выхода в пул USDT: $1k = 1.95%, $10k = 16.6%, $50k = 49.89%.',
      contentMarkdown: `# Математика экстренного выхода (Price Impact)
Для пула USDT с резервом $50,227 USDT:
- **Выход с $1,000**: Слиппедж ~1.95% (забираем чистыми ~$980). График не ломается.
- **Выход с $5,000**: Слиппедж ~9.05% (забираем чистыми ~$4,547). Заметный фитиль вниз.
- **Выход с $10,000**: Слиппедж ~16.60% (забираем ~$8,340, теряем $1,660 на ровном месте).
- **Выход с $50,000**: Слиппедж ~49.89% (забираем $25,057, высушивая 100% USDT в пуле и обрушивая цену в 2 раза).

**Вывод**: Крупный капитал физически заперт в токене и может выходить только скрытым DCA-сливом.`,
      tags: ['#slippage', '#price_impact', '#math'],
    },

    // Infrastructure & Integration
    {
      id: 'infra_mcp_server',
      label: '🔌 MCP-Сервер (13 Инструментов)',
      type: 'INFRASTRUCTURE',
      cluster: 'infra',
      summary: 'Model Context Protocol шлюз: подключение сторонних ИИ (Claude, Cursor) ко всем данным терминала.',
      contentMarkdown: `# Встроенный MCP Сервер (binance-agent-os-mcp)
Работает по протоколу JSON-RPC 2.0 на эндпоинте \`/api/mcp\`.
Включает 13 инструментов:
1. \`dex_get_pool_metrics\` (DexScreener API)
2. \`dex_security_and_contract_audit\` (GoPlus Labs)
3. \`onchain_get_smart_money_activity\` (Bitquery / Snipers)
4. \`onchain_get_syndicate_cluster_graph\` (Cluster Detection)
5. \`cross_market_get_cme_and_etf_intelligence\` (CME Gaps & ETF)
6. \`bstocks_get_basket_rotation_radar\` (Basket Spreads)
7. 7 инструментов Binance CEX & Futures (стакан, CVD, ликвидации, фандинг).`,
      tags: ['#mcp', '#ai_gateway', '#json_rpc'],
    },

    {
      id: 'infra_cookie_check',
      label: '🔐 Google IAP & __cookie_check.html',
      type: 'INFRASTRUCTURE',
      cluster: 'infra',
      summary: 'Принцип работы защитного прокси AI Studio и способы авторизации внешних клиентов.',
      contentMarkdown: `# Архитектура защиты Google AI Studio & Cloud Run
- При прямом вызове \`/api/mcp\` внешней программой без кук Google возвращается \`__cookie_check.html\`.
- **Решения**:
  1. Работа внутри браузера (автоматическая сессия).
  2. Передача заголовка \`Cookie\` из сессии в Claude Desktop.
  3. Экспорт в GitHub / Cloud Run с постоянным статическим Bearer-токеном.`,
      tags: ['#security', '#cloud_run', '#auth'],
    },

    {
      id: 'infra_gdrive_vault',
      label: '☁️ Google Drive Vault Sync',
      type: 'INFRASTRUCTURE',
      cluster: 'infra',
      summary: 'Долговременное хранение заметок и узлов графа в папке Crypto-Terminal-Obsidian-Vault.',
      contentMarkdown: `# Google Drive Vault Sync
- Официальная интеграция через Google Workspace OAuth (\`drive.file\`).
- Создает в корне личного Google Диска папку \`Crypto-Terminal-Obsidian-Vault\`.
- Сохраняет заметки в чистом Markdown формате (\`.md\`) со структурой связей \`[[Wikilinks]]\`.
- Позволяет открывать сохраненные данные напрямую в десктопном Obsidian!`,
      tags: ['#gdrive', '#cloud_sync', '#obsidian_vault'],
    },
  ],

  edges: [
    // Core links
    { id: 'e1', source: 'hub_crypto_core', target: 'meth_4gates', label: 'использует метод', relationType: 'belongs_to', strength: 2 },
    { id: 'e2', source: 'hub_crypto_core', target: 'infra_mcp_server', label: 'экспортирует данные в', relationType: 'belongs_to', strength: 2 },
    { id: 'e3', source: 'hub_crypto_core', target: 'infra_gdrive_vault', label: 'синхронизирует с', relationType: 'belongs_to', strength: 1.5 },
    
    // Methodology links
    { id: 'e4', source: 'meth_4gates', target: 'meth_single_metric_fallacy', label: 'опровергает', relationType: 'validates', strength: 1.5 },
    { id: 'e5', source: 'meth_4gates', target: 'token_guoying', label: 'аудирует кейс', relationType: 'audits', strength: 2 },
    
    // Case study links
    { id: 'e6', source: 'token_guoying', target: 'token_googlb_cross', label: 'кросс-пул к', relationType: 'pools_with', strength: 2 },
    { id: 'e7', source: 'token_guoying', target: 'case_25_satellites', label: 'клиринговый хаб для', relationType: 'sub_token_of', strength: 2 },
    { id: 'e8', source: 'token_guoying', target: 'case_slippage_calc', label: 'проверен через', relationType: 'validates', strength: 1.8 },
    { id: 'e9', source: 'meth_single_metric_fallacy', target: 'case_slippage_calc', label: 'математическое доказательство', relationType: 'references', strength: 1.2 },

    // Infrastructure links
    { id: 'e10', source: 'infra_mcp_server', target: 'infra_cookie_check', label: 'защищен через', relationType: 'references', strength: 1.5 },
    { id: 'e11', source: 'infra_gdrive_vault', target: 'meth_4gates', label: 'хранит базу знаний', relationType: 'references', strength: 1 },
  ],
};
