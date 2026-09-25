# SpeechLens 产品需求文档（PRD）

**版本：** v1.0  
**日期：** 2026-09-24  
**产品形态：** Chrome Extension（Manifest V3）  
**开发目标：** 可由 Codex 按本文档直接分阶段实现的 MVP  
**工作名称：** SpeechLens  
**英文定位：** Real-time Speech Intelligence Agent  
**Slogan：** Listen Beyond Words.

---

## 0. 执行摘要

SpeechLens 是一个实时分析网页演讲、会议、直播、访谈和路演内容的 Chrome 插件。用户启动插件后，系统捕获当前标签页或麦克风音频，实时生成字幕，并持续计算演讲的情绪、内容质量、可信度、智慧程度、AI 相关性、经济相关性和表达效果。

产品不是“测谎器”。它将“真实程度”拆成三个可解释层次：

1. **表达可信度：** 语言是否具体、前后一致、是否过度夸张或回避。
2. **证据充分度：** 演讲者是否提供可核查的来源、数据和论据。
3. **事实核验状态：** 外部可信来源是否支持、反驳或尚不能判断该主张。

Jev 作为实时结构化判断层，负责高频、低延迟、可类型化的评分和分类；流式语音识别负责转写；LLM 负责复杂观点提取、解释和总结；搜索/RAG 负责事实核验。

### 0.1 MVP 核心体验

用户点击一次“Analyze Current Tab”后，在 Chrome Side Panel 中看到：

- 实时字幕与说话人；
- 六个持续变化的核心指数；
- 当前话题与情绪；
- 重要洞察、商业信号和待核验主张；
- 每次显著分数变化的原因；
- 可回溯的指标时间线；
- 演讲结束后的完整分析报告。

### 0.2 北极星指标

**被用户主动保存、复制或回看的高价值片段数 / 每场分析会话。**

辅助指标：分析会话完成率、报告打开率、待核验主张点击率、用户对系统判断的有用性反馈。

---

## 1. 产品愿景与边界

### 1.1 愿景

让人们在信息过载环境中，不仅知道“演讲者说了什么”，还能够实时理解：

- 哪些内容真正有价值；
- 哪些内容包含新洞察；
- 哪些判断与 AI、产业和经济相关；
- 哪些数字与事实需要核验；
- 哪些表达主要是情绪、包装、重复或套话；
- 哪些片段值得保存、分享或转化为行动。

### 1.2 产品原则

1. **实时，但不乱跳：** 指标应快速响应，同时保持视觉稳定。
2. **判断必须可解释：** 显著变化必须说明由哪句话、哪个音频特征或哪项证据触发。
3. **区分事实与推断：** 不把语气判断当作事实核验。
4. **显示不确定性：** 每项判断都保留 confidence 和 evidence 状态。
5. **隐私优先：** 默认不长期保存原始音频。
6. **用户可纠正：** 用户可标记“判断有用/不准确”，用于本地偏好和后续评估。

### 1.3 MVP 非目标

- 不宣称识别谎言或心理疾病；
- 不进行个人信用、招聘、保险或执法等高风险自动决策；
- 不在 MVP 中提供法律、医疗或投资结论；
- 不承诺判断文本是否一定由 AI 生成；
- 不在 MVP 中支持原生桌面 Zoom/Teams 的系统音频；
- 不在 MVP 中建设多人协作、企业权限、计费和复杂知识库。

---

## 2. 用户与核心场景

### 2.1 目标用户

| 用户 | 主要任务 | 核心价值 |
|---|---|---|
| 创业者/投资人 | 观看 Pitch、Demo Day、行业演讲 | 快速识别价值、风险和待核验数据 |
| 企业管理者 | 参加战略会议、供应商汇报 | 追踪观点、证据、决策和行动项 |
| AI/XR 从业者 | 观看技术大会与产品发布 | 识别技术深度、AI 含量和营销包装 |
| 研究员/分析师 | 观看财报会、访谈和政策发布 | 捕捉经济信号、数字和事实冲突 |
| 媒体/内容创作者 | 观看直播、采访、播客 | 捕捉金句、争议点和传播片段 |
| 学习者/导师 | 观看课程、演讲和答辩 | 提取洞察、逻辑结构和知识增量 |

### 2.2 优先场景

P0：

- YouTube 演讲/访谈；
- Google Meet 网页会议；
- 网页直播与录播；
- 在线创业路演。

P1：

- Zoom Web、腾讯会议网页版；
- 在线课程与播客；
- 麦克风模式，用于线下演讲。

P2：

- Rokid Glasses HUD；
- 线下大会多说话人识别；
- 企业私有知识库核验。

### 2.3 核心 Job To Be Done

> 当我观看一场演讲或会议时，我希望系统在不中断内容的情况下，实时告诉我当前观点的价值、证据和相关性，使我能快速判断哪些内容值得相信、记录、核验或采取行动。

---

## 3. 产品信息架构

### 3.1 Chrome Extension Popup

用途：开始、暂停、恢复、结束分析和选择模式。

主要元素：

- 产品状态：Idle / Connecting / Live / Paused / Completed / Error；
- 音频源：Current Tab / Microphone；
- 分析语言：Auto / 中文 / English / 日本語；
- 分析模式：综合、投资人、AI 技术、事实核验、演讲教练；
- 主按钮：Analyze Current Tab；
- 权限和隐私提示；
- 打开 Side Panel；
- 查看最近报告。

### 3.2 Chrome Side Panel

主导航：

1. **Live：** 实时指数、当前主题、变化原因、实时事件；
2. **Transcript：** 字幕、标签、说话人和搜索；
3. **Timeline：** 多指标曲线与事件锚点；
4. **Claims：** 待核验、核验中、已支持、冲突和证据不足；
5. **Report：** 演讲结束后的总结与导出。

### 3.3 完整报告页

- 会话信息与来源 URL；
- 六项核心指数；
- 一句话结论；
- 核心观点和高价值洞察；
- 指标时间线；
- 情绪变化；
- 事实核验清单；
- 金句、传播点与风险片段；
- 完整字幕；
- 导出 Markdown / JSON / PDF（PDF 为 P1）。

---

## 4. 用户流程

### 4.1 首次使用

1. 安装插件。
2. 打开包含音频的视频或会议页面。
3. 点击插件图标。
4. 阅读并确认一次性音频捕获说明。
5. 选择“Current Tab”。
6. 点击“Analyze Current Tab”。
7. Chrome 请求标签页捕获权限。
8. Side Panel 自动打开，显示 Connecting。
9. 收到第一段稳定字幕后进入 Live。

### 4.2 实时分析

1. 音频进入 Offscreen Document。
2. 流式 STT 返回 interim 和 final 字幕。
3. 音频特征每 0.5 秒更新。
4. Jev 每 3–5 秒输出快速判断。
5. 内容窗口每 10–15 秒更新复杂指标。
6. 新主张被识别时进入事实核验队列。
7. 显著分数变化生成可解释事件。
8. 用户可点击事件回到对应字幕时间点。

### 4.3 结束与回看

1. 用户点击 Stop，或标签页关闭/媒体结束。
2. 系统完成最后一个字幕窗口。
3. 生成会话级总结和最终指标。
4. 报告页展示洞察、主张和时间线。
5. 用户可复制、下载或删除报告。

---

## 5. 分析模式

| 模式 | 权重变化 | 首页优先显示 |
|---|---|---|
| 综合模式 | 默认权重 | 六项核心指数 |
| 投资人模式 | 商业、市场、证据、执行力权重提高 | 商业价值、主张风险、团队信号 |
| AI 技术模式 | 技术深度、准确性、可行性权重提高 | AI 指数、技术含量、Buzzword 风险 |
| 事实核验模式 | 来源、可核查性和冲突权重提高 | Claims、证据状态、可信指数 |
| 演讲教练模式 | 结构、节奏、清晰度、说服力提高 | 表达指数、情绪、重复和停顿 |

MVP 实现综合模式；其他模式先通过配置文件预留权重。

---

## 6. 指标体系

### 6.1 六项核心指数

所有指数范围为 0–100，同时返回 `confidence`（0–1）、`trend`、`window` 和 `reasons`。

#### 6.1.1 Overall Value｜综合价值

衡量当前片段及全场内容对用户是否值得关注、记录和行动。

默认权重：

```text
Overall = Wisdom × 0.24
        + Trust × 0.20
        + InformationQuality × 0.18
        + EconomicRelevance × 0.14
        + AIRelevance × 0.10
        + Expression × 0.09
        + Actionability × 0.05
```

AI/经济相关性低不等于内容质量差。若当前主题与 AI 或经济无关，则在综合评分中动态降低对应权重并重新归一化。

#### 6.1.2 Trust｜可信指数

组成：

- 内部逻辑一致性 20%；
- 前后表述一致性 15%；
- 证据充分度 20%；
- 来源质量 15%；
- 已核验主张表现 20%；
- 事实/观点区分度 10%。

惩罚项：明显冲突、过度夸张、伪精确数字、引用缺失、选择性陈述。

显示状态：

- 80–100：高可信；
- 65–79：基本可信；
- 45–64：证据不足；
- 25–44：存在明显争议；
- 0–24：与可靠来源存在重大冲突。

#### 6.1.3 Wisdom｜智慧指数

组成：洞察深度、原创性、因果深度、系统性、反直觉程度、新信息增量、长期视角和可迁移性。

高分条件：提出明确问题、构建因果框架、揭示权衡、说明边界、提供可复用方法。

低分条件：重复常识、堆砌抽象概念、缺少因果关系、只有态度没有方法。

#### 6.1.4 AI Relevance｜AI 指数

代表内容的 AI 相关性和技术含量，不代表讲稿一定由 AI 生成。

组成：AI 主题占比、技术深度、模型/Agent/数据/算力相关性、应用价值、商业化程度、实施可行性、技术准确性和伦理风险意识。

辅助指标：AI Buzzword 密度、技术内容/营销包装比。

#### 6.1.5 Economic Relevance｜经济指数

组成：市场、商业模式、收入、成本、投资、行业影响、生产力、就业、竞争格局、政策、供应链和消费者影响。

同时输出：短期影响、长期影响、受影响主体和影响方向。

#### 6.1.6 Expression｜表达指数

组成：结构清晰度、可理解度、语速适宜度、节奏、简洁度、具体程度、说服力和听众适配度。

### 6.2 二级指标

#### 情绪与声音

- dominant_emotion
- emotion_intensity
- emotion_stability
- confidence_signal
- tension_signal
- empathy
- persuasion
- agitation
- speaking_rate_wpm
- volume_level
- volume_variance
- pause_ratio
- filler_word_rate
- interruption_count

#### 内容质量

- information_density
- viewpoint_density
- data_density
- example_density
- logical_coherence
- causal_strength
- evidence_strength
- structure_clarity
- specificity
- comprehensibility
- repetition
- topic_drift
- cliche_density
- marketing_language
- actionability

#### 智慧

- insight_depth
- originality
- counter_intuitiveness
- systems_thinking
- causal_depth
- long_term_view
- problem_framing
- simplification_quality
- cognitive_range
- novelty_delta
- transferability
- inspiration_value

#### 真实性与可信度

- checkable_claim_count
- verified_claim_ratio
- unresolved_claim_count
- contradicted_claim_count
- citation_completeness
- source_authority
- internal_consistency
- cross_time_consistency
- fact_opinion_separation
- exaggeration_risk
- ambiguity_risk
- evasion_risk
- cherry_picking_risk
- misleading_risk

#### AI

- ai_topic_relevance
- ai_technical_depth
- model_algorithm_relevance
- agent_relevance
- data_relevance
- compute_relevance
- ai_application_value
- ai_commercialization
- implementation_feasibility
- technical_accuracy
- ai_safety_awareness
- buzzword_density
- substance_to_hype_ratio
- ai_generated_language_signal（辅助，禁止作为确定性结论）

#### 经济与商业

- macro_relevance
- industry_impact
- market_size_relevance
- business_model_clarity
- revenue_relevance
- cost_relevance
- investment_value
- startup_opportunity
- productivity_impact
- employment_impact
- competition_impact
- policy_relevance
- supply_chain_impact
- consumer_impact
- commercialization_feasibility
- short_term_economic_value
- long_term_economic_value

#### 传播与听众

- attention_potential
- persuasiveness
- memorability
- quote_probability
- controversy
- shareability
- social_media_value
- expert_value
- general_audience_clarity
- q_and_a_risk
- reputation_risk

### 6.3 MVP 指标范围

MVP 不必一次上线全部二级指标。首版实现：

- 六项核心指数；
- dominant_emotion、emotion_intensity、speaking_rate_wpm、pause_ratio；
- information_density、logical_coherence、evidence_strength、repetition、actionability；
- insight_depth、originality、causal_depth、novelty_delta；
- checkable_claim_count、internal_consistency、exaggeration_risk；
- ai_technical_depth、buzzword_density、substance_to_hype_ratio；
- business_model_clarity、market_size_relevance、investment_value；
- quote_probability、shareability。

其余指标进入 P1/P2。

---

## 7. 实时计算与变化规则

### 7.1 多时间窗口

| 窗口 | 数据 | 用途 |
|---|---|---|
| 0.5–5 秒 | 音量、语速、停顿、音高等 | 即时声音与情绪变化 |
| 30 秒滑动窗口 | 字幕和音频摘要 | 当前观点、智慧、相关性 |
| 2 分钟上下文 | 最近多个片段 | 逻辑、重复、主题转折 |
| 全场累计 | 全部摘要与事件 | 总体趋势和最终报告 |

### 7.2 更新频率

- 音频特征：500ms；
- UI 轻量刷新：1s；
- Jev 快速判断：3–5s；
- 内容窗口判断：10–15s；
- 主张核验：事件触发，目标 10–60s；
- 会话级总结：每 2 分钟增量更新，结束时完成最终版。

### 7.3 平滑算法

```ts
displayScore =
  currentWindowScore * 0.35 +
  previousDisplayScore * 0.45 +
  sessionAverage * 0.20;
```

可配置规则：

- 分数变化小于 3：不触发可见事件；
- 变化 3–8：平滑过渡；
- 变化大于 8：高亮，并生成 `score_change` 事件；
- 低置信度（confidence < 0.55）：使用虚线/低透明度，不显示强结论；
- 若连续两个窗口方向相反，标记为 fluctuating，不触发通知。

### 7.4 变化解释

每次重要变化必须包含：

- `metric`：发生变化的指标；
- `before` / `after`；
- `direction`；
- `reason_code`；
- 一句用户可读解释；
- 对应字幕片段 ID；
- confidence；
- evidence type：audio / transcript / verified source / mixed。

示例：

```json
{
  "type": "score_change",
  "metric": "wisdom",
  "before": 68,
  "after": 82,
  "direction": "up",
  "reasonCode": "NEW_CAUSAL_FRAMEWORK",
  "explanation": "演讲者提出了新的因果框架，并说明了适用边界。",
  "segmentIds": ["seg_142", "seg_143"],
  "confidence": 0.84,
  "evidenceType": "transcript"
}
```

---

## 8. 事实核验模型

### 8.1 主张生命周期

```text
detected → queued → searching →
supported | contradicted | mixed | insufficient_evidence | expired
```

### 8.2 可核验主张类型

- 数字与比例；
- 日期与事件；
- 人物、公司和产品事实；
- 政策法规；
- 科学和技术性能；
- 市场规模；
- 因果结论；
- 引用或来源归属。

### 8.3 证据优先级

1. 官方文档、监管机构、公司公告；
2. 原始研究论文和公开数据集；
3. 高质量新闻机构；
4. 行业研究与数据库；
5. 二手文章和社交媒体，仅作线索。

### 8.4 用户显示原则

- 不将“未找到证据”显示为“错误”；
- 不因说话方式降低事实真实性；
- 显示来源日期，避免旧资料误判新事件；
- 对冲突来源显示“存在争议”；
- 所有外部核验结果可点击查看来源。

---

## 9. Jev 决策层设计

### 9.1 定位

Jev 只负责结构化快速判断，不负责生成长文本、直接检索事实或独立完成复杂推理。

### 9.2 判断器拆分

1. `emotion_judge`：情绪、强度、稳定性、说服信号；
2. `content_judge`：信息密度、逻辑、重复、行动价值；
3. `wisdom_judge`：洞察、因果、原创性、可迁移性；
4. `ai_economy_judge`：AI 与经济相关性和深度；
5. `credibility_judge`：证据、夸张、内部一致性、可核验主张；
6. `event_router`：是否触发深度分析、事实核验或 UI 事件。

MVP 可将 2 和 3 合并，将 4 保持独立。

### 9.3 输入状态

```ts
export interface JevAnalysisState {
  sessionId: string;
  language: string;
  mode: AnalysisMode;
  currentWindow: {
    startedAtMs: number;
    endedAtMs: number;
    transcript: string;
    audioFeatures: AudioFeatures;
  };
  recentSummary: string;
  previousScores: CoreScores;
  sessionAverages: CoreScores;
  currentTopic?: string;
  recentClaims: ClaimSummary[];
}
```

### 9.4 输出规范

```ts
export interface MetricDecision {
  score: number;          // 0..100
  confidence: number;     // 0..1
  trend: "up" | "down" | "flat" | "fluctuating";
  reasonCodes: string[];
}

export interface JevWindowResult {
  windowId: string;
  emotion: {
    label: EmotionLabel;
    intensity: number;
    confidence: number;
  };
  core: CoreScores;
  secondary: Record<string, MetricDecision>;
  shouldExtractClaims: boolean;
  shouldRunDeepAnalysis: boolean;
  eventCandidates: EventCandidate[];
}
```

### 9.5 实现要求

- 通过 `JevProvider` adapter 封装，不让业务层直接依赖 SDK；
- API key 只能保存在服务端；
- 失败时指数沿用上一稳定值，并显示数据延迟；
- 请求必须有 5 秒超时、指数退避和熔断；
- 保存原始 Jev response 仅用于开发调试，生产环境应脱敏且默认关闭；
- 开发时根据 TypeSafe 官方最新 SDK 确认 question type 和 response schema，本文档中的接口为业务层契约。

---

## 10. 系统架构

### 10.1 推荐技术栈

#### Extension

- TypeScript；
- React 19；
- Vite + `@crxjs/vite-plugin`，或 Plasmo（二选一，默认 Vite/CRXJS，控制更直接）；
- Chrome Manifest V3；
- Tailwind CSS；
- Zustand；
- TanStack Query；
- Recharts 或 Visx；
- Zod；
- Vitest + Testing Library + Playwright。

#### Backend

- Node.js 22 + TypeScript；
- Fastify 或 Hono（默认 Fastify）；
- WebSocket；
- Zod；
- Redis（P1；MVP 可内存队列）；
- PostgreSQL（P1；MVP 本地优先，可先不接账号）；
- OpenTelemetry + Sentry（P1）。

#### AI Services

- Streaming STT provider adapter；
- Jev provider adapter；
- LLM provider adapter；
- Search/fact-check provider adapter。

### 10.2 Monorepo 结构

```text
speechlens/
├─ apps/
│  ├─ extension/
│  │  ├─ src/background/
│  │  ├─ src/offscreen/
│  │  ├─ src/popup/
│  │  ├─ src/sidepanel/
│  │  ├─ src/report/
│  │  └─ public/icons/
│  └─ api/
│     ├─ src/routes/
│     ├─ src/ws/
│     ├─ src/providers/
│     ├─ src/pipelines/
│     └─ src/storage/
├─ packages/
│  ├─ contracts/
│  ├─ scoring/
│  ├─ ui/
│  ├─ config/
│  └─ test-fixtures/
├─ docs/
│  ├─ PRD.md
│  ├─ ARCHITECTURE.md
│  └─ PRIVACY.md
├─ pnpm-workspace.yaml
├─ turbo.json
└─ README.md
```

### 10.3 Chrome 组件职责

#### Service Worker

- 接收用户操作；
- 创建和维护 session；
- 请求 `tabCapture` stream ID；
- 创建 Offscreen Document；
- 打开 Side Panel；
- 转发状态和错误；
- 处理浏览器生命周期。

#### Offscreen Document

- 使用 Web Audio API 获取音频；
- 生成 PCM/Opus 音频帧；
- 计算本地音频特征；
- 将音频流发送给 STT；
- 保持标签页音频可继续播放；
- 不直接持有长期业务状态。

#### Side Panel

- 消费实时 session store；
- 显示指标、字幕、事件和主张；
- 支持暂停、恢复、停止；
- 支持回到对应媒体时间点（可用时）；
- 保持虚拟化列表，避免长会话卡顿。

#### IndexedDB

- 保存会话元数据；
- final transcript；
- metric snapshots；
- events；
- claims；
- report；
- 默认不保存 raw audio。

### 10.4 数据流

```text
tabCapture/microphone
  → Offscreen audio processor
  → audio feature frames (local)
  → streaming STT
  → finalized transcript segments
  → window aggregator
  → Jev judges
  → score smoother + event detector
  → Side Panel live store

new factual claim
  → LLM claim extractor
  → search/fact-check pipeline
  → evidence result
  → trust recalculation
  → claim event + UI update
```

---

## 11. 核心数据模型

```ts
export type SessionStatus =
  | "idle"
  | "requesting_permission"
  | "connecting"
  | "live"
  | "paused"
  | "finalizing"
  | "completed"
  | "error";

export interface AnalysisSession {
  id: string;
  sourceType: "tab" | "microphone";
  sourceUrl?: string;
  sourceTitle?: string;
  language: string;
  mode: AnalysisMode;
  status: SessionStatus;
  startedAt: string;
  endedAt?: string;
  privacy: {
    storeRawAudio: false;
    retention: "local" | "session_only";
  };
}

export interface TranscriptSegment {
  id: string;
  sessionId: string;
  speakerId?: string;
  startMs: number;
  endMs: number;
  text: string;
  language: string;
  confidence: number;
  isFinal: boolean;
  tags: SegmentTag[];
}

export interface CoreScores {
  overall: number;
  trust: number;
  wisdom: number;
  aiRelevance: number;
  economicRelevance: number;
  expression: number;
}

export interface MetricSnapshot {
  id: string;
  sessionId: string;
  windowStartMs: number;
  windowEndMs: number;
  raw: CoreScores;
  smoothed: CoreScores;
  confidence: Partial<Record<keyof CoreScores, number>>;
  secondary: Record<string, number>;
}

export type ClaimStatus =
  | "detected"
  | "queued"
  | "searching"
  | "supported"
  | "contradicted"
  | "mixed"
  | "insufficient_evidence"
  | "expired";

export interface Claim {
  id: string;
  sessionId: string;
  segmentIds: string[];
  text: string;
  normalizedClaim: string;
  claimType: string;
  importance: number;
  status: ClaimStatus;
  confidence: number;
  evidence: Evidence[];
}

export interface Evidence {
  id: string;
  title: string;
  url: string;
  publisher?: string;
  publishedAt?: string;
  authorityScore: number;
  stance: "supports" | "contradicts" | "context";
  snippet: string;
}

export interface AnalysisEvent {
  id: string;
  sessionId: string;
  type:
    | "topic_shift"
    | "score_change"
    | "insight"
    | "claim"
    | "claim_result"
    | "quote"
    | "repetition"
    | "emotion_shift"
    | "risk";
  timestampMs: number;
  severity: "info" | "positive" | "warning" | "critical";
  title: string;
  explanation: string;
  segmentIds: string[];
  metric?: keyof CoreScores;
  confidence: number;
}
```

---

## 12. API 与实时协议

### 12.1 REST

```text
POST   /v1/sessions
GET    /v1/sessions/:id
POST   /v1/sessions/:id/finalize
GET    /v1/sessions/:id/report
DELETE /v1/sessions/:id
POST   /v1/claims/:id/recheck
```

### 12.2 WebSocket

客户端 → 服务端：

- `audio.chunk`
- `session.pause`
- `session.resume`
- `session.stop`
- `feedback.metric`

服务端 → 客户端：

- `session.status`
- `transcript.interim`
- `transcript.final`
- `metrics.snapshot`
- `analysis.event`
- `claim.detected`
- `claim.updated`
- `report.progress`
- `report.ready`
- `error`

### 12.3 消息包络

```ts
export interface RealtimeEnvelope<T> {
  version: 1;
  messageId: string;
  sessionId: string;
  type: string;
  sequence: number;
  sentAt: string;
  payload: T;
}
```

要求：

- 客户端按 `sequence` 去重与重排；
- 断线后使用 `lastSequence` 恢复；
- 所有 schema 用 Zod 验证；
- 不兼容变更升级 `version`。

---

## 13. UI/UX 规范

### 13.1 视觉系统

```css
--bg: #07111F;
--surface: #0D1B2A;
--surface-elevated: #122338;
--border: #20344A;
--text-primary: #F8FAFC;
--text-secondary: #94A3B8;
--cyan: #22D3EE;
--violet: #A78BFA;
--emerald: #34D399;
--amber: #FBBF24;
--coral: #FB7185;
```

- 8px spacing system；
- 卡片圆角 12px；
- 图表线宽 2px；
- 动画 180–300ms；
- 不使用大面积霓虹发光；
- 核心数据字号 24–32px；
- 正文字号不小于 13px。

### 13.2 指标颜色

- Overall：Cyan；
- Trust：Emerald；冲突时 Coral；
- Wisdom：Violet；
- AI：Blue/Cyan；
- Economy：Amber；
- Expression：Purple；
- Waiting/Unknown：Slate。

### 13.3 动态行为

- 数值变化采用平滑计数，不瞬间跳变；
- sparkline 从右向左平移；
- 上升/下降箭头只保留 5 秒；
- 显著变化卡片高亮 2 秒；
- “Why it changed”默认只显示一条最重要解释；
- 用户悬停或点击后展开证据和字幕；
- 低 confidence 使用虚线和 `Low confidence` tooltip。

### 13.4 可访问性

- 所有颜色状态同时使用图标或文字；
- 支持键盘导航；
- 可关闭动画；
- 图表提供文字摘要；
- 对比度至少符合 WCAG AA；
- 支持 125% 和 150% 缩放。

---

## 14. 功能需求

### FR-01 标签页音频捕获（P0）

- 用户明确操作后调用 `chrome.tabCapture`；
- 捕获分析时不应静音原标签页；
- 切换标签页后仍分析原会话；
- 原标签页关闭时安全结束会话。

**验收：** YouTube 播放时启动分析，声音继续正常播放，10 秒内出现 final 字幕。

### FR-02 麦克风捕获（P1）

- 独立请求麦克风权限；
- 显示明显的录音状态；
- 支持输入设备选择。

### FR-03 流式字幕（P0）

- 支持 interim 和 final；
- 自动滚动且允许用户暂停自动滚动；
- 点击时间戳跳转媒体位置（页面能力允许时）；
- 中英文混合文本不应被错误分段。

### FR-04 核心指数（P0）

- 六项指数实时更新；
- 显示趋势和 confidence；
- 数据延迟时显示 stale，而非伪造新值。

### FR-05 变化原因（P0）

- 大于阈值的变化显示原因；
- 原因必须链接至少一个字幕片段；
- 用户可以反馈“不准确”。

### FR-06 实时事件（P0）

- 识别 topic shift、insight、claim、quote、repetition、emotion shift；
- 支持按类型筛选；
- 点击事件定位字幕。

### FR-07 事实核验（P1）

- 自动识别重要可核验主张；
- 显示核验进度；
- 显示结果、信心和来源；
- 支持手动重新核验。

### FR-08 完整报告（P0）

- 停止后自动生成；
- 包含摘要、洞察、事件、指标、主张和字幕；
- 支持 Markdown 和 JSON 导出。

### FR-09 本地会话管理（P0）

- 最近报告列表；
- 单条删除；
- 清空全部记录；
- 显示存储占用。

### FR-10 错误恢复（P0）

- 网络短暂中断后自动恢复；
- STT/Jev 单项失败不终止整个会话；
- 用户可手动重连；
- 所有错误提供用户可执行的下一步。

---

## 15. 非功能需求

### 15.1 性能目标

| 项目 | 目标 |
|---|---:|
| 插件打开到可操作 | < 500ms |
| 音频捕获启动 | P95 < 1.5s |
| final 字幕延迟 | P50 < 1.5s；P95 < 3s |
| 音频指标延迟 | < 1s |
| Jev 快速判断 | P95 < 1.5s（不含 STT） |
| Side Panel 渲染 | 60fps，长会话不明显下降 |
| 断线恢复 | < 5s |
| 1 小时会话内存 | < 250MB |

### 15.2 稳定性

- 30 分钟连续分析成功率 ≥ 95%；
- 单一 provider 故障时不丢失已完成字幕；
- 每 30 秒持久化一次会话 checkpoint；
- 恢复时不重复写入 segment/event。

### 15.3 隐私与安全

- 默认不保存原始音频；
- 页面上持续显示 Live 分析状态；
- API key 不进入 Extension bundle；
- 服务端日志不记录完整字幕，除非开发环境明确开启；
- 支持一键删除本地会话；
- 所有网络请求使用 TLS；
- 严格 Content Security Policy；
- 所有消息 payload 进行 schema 验证；
- 不执行网页传入的 HTML；
- 报告引用内容进行 XSS 转义。

---

## 16. 状态机

```text
IDLE
  → REQUESTING_PERMISSION
  → CONNECTING
  → LIVE
  ↔ PAUSED
  → FINALIZING
  → COMPLETED

CONNECTING / LIVE / PAUSED
  → ERROR_RECOVERABLE
  → CONNECTING

任意运行状态
  → ERROR_FATAL
  → COMPLETED_WITH_ERRORS
```

UI 不允许出现多个“真实状态源”。`SessionStateMachine` 是唯一状态权威，Popup、Side Panel 和 Background 均订阅它。

---

## 17. 错误场景与用户文案

| 错误 | 行为 | 文案 |
|---|---|---|
| 页面无音频 | 等待并显示空状态 | “等待当前标签页播放声音…” |
| tabCapture 被拒绝 | 返回 Idle | “需要标签页音频权限才能开始分析。” |
| STT 断开 | 缓冲短音频并重连 | “字幕暂时延迟，正在重连。” |
| Jev 超时 | 保持旧分数 | “实时评分暂时延迟。” |
| 核验失败 | 主张保持 unresolved | “暂未找到足够证据。” |
| 浏览器休眠 | 保存 checkpoint | “会话已暂停，返回后可继续。” |
| 源标签关闭 | 自动 finalize | “原标签页已关闭，正在生成报告。” |

---

## 18. 分析质量与评测

### 18.1 测试数据集

准备至少 50 段，每段 3–10 分钟：

- 10 段 AI 技术演讲；
- 10 段创业 Pitch；
- 10 段财经/政策演讲；
- 10 段课程/知识演讲；
- 10 段营销内容或低信息密度内容。

每段由至少 2 名人工标注：

- 主题与转折；
- 高价值洞察；
- 事实主张；
- 套话/重复；
- 六项核心指数区间；
- 变化发生时间。

### 18.2 质量指标

- 主题转折 F1；
- 主张提取 Precision/Recall；
- 高价值片段 Top-K 命中率；
- 指标与人工标注 Spearman 相关；
- 显著变化时间误差；
- 事实核验正确率与引用覆盖率；
- 人工“有帮助”评分。

### 18.3 产品阈值

- 主张提取 Precision ≥ 0.8；
- 高价值洞察 Top-3 至少 2 条被人工认为合理；
- 重大分数变化 80% 有可理解解释；
- 核验结果 100% 提供来源或明确显示证据不足；
- 不得将未核验内容显示为已证实。

---

## 19. 测试策略

### 19.1 单元测试

- score smoothing；
- dynamic weight normalization；
- event thresholds；
- claim state transitions；
- WebSocket sequence handling；
- Zod schema validation；
- IndexedDB repositories。

### 19.2 集成测试

- Mock STT → transcript → Jev → metrics；
- 断线/重连；
- 重复和乱序消息；
- provider timeout；
- session finalize；
- report export。

### 19.3 E2E

- 加载本地 unpacked extension；
- 打开测试音视频页面；
- 启动 tab capture；
- 验证字幕和指标；
- 暂停/恢复；
- 结束并查看报告；
- 删除会话。

Chrome 权限和 tabCapture 的自动化测试需要保留一组手工验收用例。

---

## 20. 产品分析事件

默认不记录字幕正文，仅记录产品操作和性能指标。

- extension_installed
- analysis_started
- permission_granted / denied
- first_transcript_received
- first_metric_received
- event_opened
- claim_opened
- source_opened
- feedback_submitted
- session_paused / resumed / completed
- report_viewed
- report_exported
- session_deleted
- provider_error

每个事件包含 app version、浏览器版本、模式、会话时长和匿名 session ID。

---

## 21. 开发阶段与任务拆分

### Phase 0｜工程骨架（0.5–1 天）

- 创建 pnpm monorepo；
- 初始化 Extension、API、contracts、scoring、ui；
- 配置 TypeScript、ESLint、Prettier、Vitest；
- 建立 `.env.example`；
- 创建基础 CI。

**完成标准：** `pnpm dev` 可同时启动 API 和加载开发版插件；`pnpm test` 通过。

### Phase 1｜可点击的 UI 原型（1–2 天）

- Popup；
- Side Panel 四个主要区块；
- 模拟实时数据；
- sparklines 与 timeline；
- 字幕和事件列表；
- 响应式与可访问性基础。

**完成标准：** 使用 fixture 可以完整演示实时分数变化，无需 AI 服务。

### Phase 2｜标签页音频与 STT（2–3 天）

- Manifest V3 权限；
- tabCapture；
- Offscreen Document；
- Web Audio pipeline；
- STT adapter；
- interim/final 字幕；
- reconnect 和 checkpoint。

**完成标准：** YouTube/Google Meet 网页音频可稳定转写 30 分钟。

### Phase 3｜Jev 实时指标（2–3 天）

- Jev provider adapter；
- window aggregator；
- 三到五组 judge；
- metric snapshots；
- smoothing；
- score change events；
- confidence 和 stale 状态。

**完成标准：** 六项核心指数随内容变化，并能解释变化原因。

### Phase 4｜洞察、主张与报告（2–4 天）

- LLM 深度分析 adapter；
- insight/quote/claim extraction；
- final report；
- Markdown/JSON export；
- 本地会话管理。

**完成标准：** 完整走通启动、分析、停止、报告和导出。

### Phase 5｜事实核验（3–5 天，P1）

- Search adapter；
- claim queue；
- evidence ranker；
- source UI；
- trust recalculation；
- recheck。

**完成标准：** 重要主张显示 supported/contradicted/mixed/insufficient，并附来源。

### Phase 6｜质量与发布（2–3 天）

- 性能与长会话测试；
- 错误恢复；
- 隐私说明；
- Chrome Web Store 素材；
- 生产构建与版本号；
- 验收清单。

---

## 22. MVP 验收标准

### 必须通过

1. 在支持的网页上，用户两次点击内开始分析。
2. 标签页声音不中断，10 秒内显示字幕。
3. 六项核心指数持续更新，且界面不频繁闪烁。
4. 重大指标变化显示可理解原因和对应字幕。
5. 至少识别 insight、claim、quote、topic shift 四类事件。
6. 点击事件可以定位字幕。
7. 结束会话后 30 秒内生成报告。
8. 报告可导出 Markdown 和 JSON。
9. 默认不保存原始音频。
10. 单个 provider 故障不会导致插件崩溃。
11. 连续运行 30 分钟无严重内存泄漏。
12. 所有“真实性”相关 UI 均显示证据状态，不显示“说谎概率”。

### 建议通过

- 支持中英文混合；
- 支持 60 分钟会话；
- 支持断线恢复；
- Side Panel 在 360–500px 宽度下可用；
- Chrome 最新两个稳定版本通过测试。

---

## 23. 风险与解决方案

| 风险 | 影响 | 解决方案 |
|---|---|---|
| AI 评分主观 | 用户不信任 | 给出定义、confidence、原因和对应字幕；允许反馈 |
| 事实核验延迟 | 实时感下降 | 快慢双通道；先显示 pending，随后更新 |
| STT 错误影响分析 | 指标偏差 | 使用 final transcript、低置信度降权、允许查看原句 |
| 指标太多 | 界面拥挤 | 首页六项；二级指标按主题展开 |
| 分数频繁跳动 | 用户焦虑 | 多窗口、EMA、事件阈值和冷却时间 |
| API 成本 | 无法规模化 | Jev 高频轻判断；LLM 仅事件触发；窗口摘要复用 |
| Chrome MV3 生命周期 | 会话中断 | Offscreen Document、checkpoint、幂等恢复 |
| 隐私顾虑 | 用户拒绝启用 | 本地优先、不存音频、清晰指示和一键删除 |
| “测谎”误解 | 法务与声誉风险 | 统一使用可信度/证据状态，禁止确定性心理判断 |

---

## 24. 环境变量

```bash
# API server
PORT=8787
ALLOWED_EXTENSION_IDS=

# Providers
TYPESAFE_API_KEY=
STT_API_KEY=
LLM_API_KEY=
SEARCH_API_KEY=

# Optional
DATABASE_URL=
REDIS_URL=
SENTRY_DSN=
LOG_LEVEL=info
STORE_RAW_AUDIO=false
```

任何 `.env` 不得提交 Git；Extension bundle 中不得包含 provider secret。

---

## 25. Codex 开发指令

下面内容可作为新 Codex 项目的第一条任务：

```text
请根据 docs/PRD.md 实现 SpeechLens MVP。

技术约束：
- pnpm + Turborepo monorepo
- Chrome Manifest V3
- TypeScript strict
- React + Vite/CRXJS
- Node.js + Fastify API
- Zod 作为所有跨边界数据的唯一 schema 来源
- Provider 必须通过 adapter 封装，先提供 deterministic mock provider
- 默认不保存 raw audio
- API key 只允许存在于 server

第一阶段只完成工程骨架和 Mock UI，不连接真实 AI 服务：
1. 创建 apps/extension、apps/api、packages/contracts、packages/scoring、packages/ui。
2. 实现 Popup、Side Panel、模拟字幕、六项动态指标、事件流和 Timeline。
3. 使用固定 fixture 每秒推送模拟数据，使 UI 可以完整演示。
4. 为 scoring、state machine 和 realtime envelope 编写单元测试。
5. 提供 README，说明安装、开发、构建和加载 unpacked extension 的步骤。

完成后：
- 运行 lint、typecheck、test、build；
- 修复所有错误；
- 启动本地插件并截图核对 UI；
- 更新 TASKS.md 和 WORKLOG.md；
- 不要提前实现下一阶段。
```

### 后续 Codex 指令顺序

1. “实现 Phase 2：tabCapture、Offscreen Document 和 Mock STT 流。”
2. “接入真实 Streaming STT provider，并保留 Mock provider。”
3. “实现 Phase 3：JevProvider、窗口聚合、平滑算法和变化事件。”
4. “实现 Phase 4：洞察、主张、报告和导出。”
5. “实现 Phase 5：搜索核验和证据 UI。”
6. “按 PRD 第 22 节执行完整验收并生成验收报告。”

---

## 26. 待确认项与默认决定

如果开发开始前没有额外决定，采用以下默认值：

- 产品名：SpeechLens；
- 首发语言：English UI，中英文语音；
- 默认模式：综合模式；
- 默认音频源：Current Tab；
- 默认存储：本地 IndexedDB；
- 默认保留：用户手动删除；
- 默认不保存原始音频；
- 默认指标更新：Jev 5 秒，内容窗口 15 秒；
- 默认 Side Panel 宽度：400px；
- 默认主题：Dark；
- 默认导出：Markdown + JSON；
- 默认先使用 Mock providers，逐一接入真实服务。

---

## 27. 发布路线

- **V0.1：** Mock UI 与动态演示；
- **V0.2：** 标签页音频 + Streaming STT；
- **V0.3：** Jev 实时指标；
- **V0.4：** 洞察、主张和报告；
- **V0.5：** 事实核验；
- **V1.0：** Chrome Web Store Beta；
- **V1.5：** 投资人/技术/教练模式；
- **V2.0：** 团队知识库与协作；
- **V3.0：** Rokid Glasses 实时 HUD。

---

## 28. 最终产品表达

**中文：**

> SpeechLens 是一个实时演讲智能体。它持续分析一场演讲的情绪、事实、洞察、AI 含量和经济价值，让你知道哪些值得记住，哪些需要核验。

**English：**

> SpeechLens is a real-time speech intelligence agent that reveals the emotion, evidence, insight, AI relevance, and economic value behind every talk.

**核心差异：**

- 字幕工具告诉你：他说了什么；
- 总结工具告诉你：主要内容是什么；
- SpeechLens 告诉你：什么值得相信、记住、核验和行动。

