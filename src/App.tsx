import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  FileText,
  Filter,
  Gauge,
  Headphones,
  Lightbulb,
  ListFilter,
  LockKeyhole,
  MessageSquareQuote,
  Mic2,
  MoreHorizontal,
  Pause,
  Play,
  Radio,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  Target,
  TrendingUp,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import { claims as initialClaims, initialEvents, metricMeta, seedMetrics, transcript } from "./mockData";
import { scoreTranscript } from "./analysis";
import type { MetricSnapshot, ScoreChange } from "./analysis";
import type { Claim, EventKind, InsightEvent, Metric, MetricKey, View } from "./types";

const navItems: Array<{ id: View; label: string; icon: typeof Activity }> = [
  { id: "live", label: "Live", icon: Activity },
  { id: "transcript", label: "Transcript", icon: FileText },
  { id: "timeline", label: "Timeline", icon: BarChart3 },
  { id: "claims", label: "Claims", icon: ShieldCheck },
  { id: "report", label: "Report", icon: BookOpen },
];

const eventKinds: Array<{ id: EventKind | "all"; label: string }> = [
  { id: "all", label: "All events" },
  { id: "insight", label: "Insights" },
  { id: "claim", label: "Claims" },
  { id: "quote", label: "Quotes" },
  { id: "topic_shift", label: "Topic shifts" },
];

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportTranscript() {
  const body = transcript.map((item) => `[${item.time}] ${item.speaker}: ${item.text}`).join("\n");
  downloadFile("speechlens-transcript.txt", body, "text/plain;charset=utf-8");
}

function Sparkline({ points, color, muted = false }: { points: number[]; color: string; muted?: boolean }) {
  const width = 110;
  const height = 34;
  const min = Math.min(...points) - 2;
  const max = Math.max(...points) + 2;
  const path = points.map((point, index) => {
    const x = (index / (points.length - 1)) * width;
    const y = height - ((point - min) / (max - min)) * height;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  return <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} aria-label="Metric trend" role="img">
    <path d={path} fill="none" stroke={`var(--${color})`} strokeWidth="2" strokeLinecap="round" opacity={muted ? 0.42 : 1} />
  </svg>;
}

function ScoreRing({ score, color, size = 54 }: { score: number; color: string; size?: number }) {
  const radius = size / 2 - 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return <div className="score-ring" style={{ width: size, height: size }}>
    <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle className="ring-track" cx={size / 2} cy={size / 2} r={radius} />
      <circle className="ring-value" cx={size / 2} cy={size / 2} r={radius} stroke={`var(--${color})`} strokeDasharray={circumference} strokeDashoffset={offset} />
    </svg>
    <span>{score}</span>
  </div>;
}

function MetricCard({ metric, onSelect, selected }: { metric: Metric; onSelect: (key: MetricKey) => void; selected: boolean }) {
  const TrendIcon = metric.trend === "down" ? ArrowDownRight : metric.trend === "up" ? ArrowUpRight : Activity;
  return <button className={`metric-card ${selected ? "selected" : ""}`} onClick={() => onSelect(metric.key)}>
    <div className="metric-card-top">
      <div className="metric-label"><span className={`metric-dot ${metric.color}`} />{metric.label}</div>
      <MoreHorizontal size={16} className="muted-icon" />
    </div>
    <div className="metric-card-body">
      <div>
        <div className="metric-score">{metric.score}</div>
        <div className="metric-description">{metric.description}</div>
      </div>
      <Sparkline points={metric.points} color={metric.color} />
    </div>
    <div className="metric-card-foot">
      <span className={`delta ${metric.trend}`}><TrendIcon size={13} />{metric.delta === 0 ? "Stable" : `${Math.abs(metric.delta)} pts`}</span>
      <span className="confidence"><span className="confidence-bar"><i style={{ width: `${metric.confidence * 100}%` }} /></span>{Math.round(metric.confidence * 100)}%</span>
    </div>
  </button>;
}

function EventRow({ event, onJump }: { event: InsightEvent; onJump: (id: string) => void }) {
  const icon = event.kind === "insight" ? <Lightbulb size={15} /> : event.kind === "claim" ? <ShieldCheck size={15} /> : event.kind === "quote" ? <MessageSquareQuote size={15} /> : event.kind === "topic_shift" ? <Target size={15} /> : <AlertTriangle size={15} />;
  return <button className="event-row" onClick={() => onJump(event.segmentId)}>
    <span className={`event-icon ${event.severity}`}>{icon}</span>
    <span className="event-content"><span className="event-meta"><b>{event.label}</b><time>{event.time}</time></span><strong>{event.title}</strong><small>{event.explanation}</small></span>
    <ChevronRight size={15} className="event-chevron" />
  </button>;
}

function LiveView({ metrics, selectedMetric, onSelectMetric, events, onJump, isPaused, eventFilter, onEventFilter, onNavigate, currentSegment, snapshot, scoringError }: { metrics: Metric[]; selectedMetric: MetricKey; onSelectMetric: (key: MetricKey) => void; events: InsightEvent[]; onJump: (id: string) => void; isPaused: boolean; eventFilter: EventKind | "all"; onEventFilter: (filter: EventKind | "all") => void; onNavigate: (view: View) => void; currentSegment: number; snapshot: MetricSnapshot | null; scoringError: string | null }) {
  const selected = metrics.find((metric) => metric.key === selectedMetric) ?? metrics[0];
  const latest = transcript[currentSegment];
  return <div className="view-stack">
    <section className="section-heading compact-heading"><div><p className="eyebrow">Local rules service</p><h1>Live analysis</h1></div><div className={`stream-state ${isPaused || snapshot?.stale || scoringError ? "paused" : ""}`}><span />{isPaused ? "Paused" : scoringError ? "Scoring offline" : snapshot?.stale ? "Data delayed" : "Analyzing transcript"}</div></section>
    <section className="metrics-grid">{metrics.map((metric) => <MetricCard key={metric.key} metric={metric} selected={metric.key === selectedMetric} onSelect={onSelectMetric} />)}</section>
    <section className="content-grid">
      <div className="primary-column">
        <div className="panel topic-panel">
          <div className="panel-heading"><div><span className="panel-kicker"><Radio size={13} /> CURRENT TOPIC</span><h2>Agent workflows are becoming the product</h2></div></div>
          <div className="topic-tags"><span>AI systems</span><span>Product strategy</span><span className="tag-live">Live topic</span></div>
          <div className="topic-insight"><Sparkles size={16} /><span><b>Strongest signal:</b> the speaker is moving from model capability to organizational adoption.</span></div>
        </div>
        <div className="panel transcript-panel">
          <div className="panel-heading"><div><span className="panel-kicker"><Mic2 size={13} /> NOW SPEAKING</span><h2>Live transcript</h2></div><button className="text-button" onClick={() => onNavigate("transcript")}>Open transcript <ChevronRight size={14} /></button></div>
          <div className="live-caption"><span className="caption-time">{latest.time}</span><p>{latest.text}</p><span className="caption-cursor" /></div>
          <div className="caption-meta"><span><span className="speaker-avatar">S1</span>{latest.speaker}</span><span><Gauge size={14} /> {Math.round(latest.confidence * 100)}% transcript confidence</span><span className="tone"><span />{latest.tone}</span></div>
        </div>
        <div className="panel event-panel">
          <div className="panel-heading"><div><span className="panel-kicker"><Bell size={13} /> SIGNALS</span><h2>What changed</h2></div><div className="panel-heading-actions"><select className="event-filter" value={eventFilter} onChange={(event) => onEventFilter(event.target.value as EventKind | "all")} aria-label="Filter signals">{eventKinds.map((kind) => <option key={kind.id} value={kind.id}>{kind.label}</option>)}</select><button className="text-button" onClick={() => onNavigate("timeline")}>View all <ChevronRight size={14} /></button></div></div>
          <div className="event-list">{events.slice(0, 3).map((event) => <EventRow event={event} key={event.id} onJump={onJump} />)}</div>
        </div>
      </div>
      <aside className="secondary-column">
        <div className="panel why-panel">
          <div className="panel-heading"><div><span className="panel-kicker"><Activity size={13} /> WHY IT CHANGED</span><h2>{selected.label}</h2></div><span className="confidence-pill">{Math.round(selected.confidence * 100)}% conf.</span></div>
          <div className="why-score"><ScoreRing score={selected.score} color={selected.color} size={64} /><div><b>{selected.trend === "up" ? "Trending up" : selected.trend === "down" ? "Trending down" : "Holding steady"}</b><span>{selected.delta > 0 ? "+" : ""}{selected.delta} points in the last window</span></div></div>
          <div className="reason-box"><span className="reason-marker" />{snapshot?.reasons[selected.key]?.text ?? "Waiting for the next finalized transcript window."}</div>
          <button className="subtle-button" onClick={() => onJump(snapshot?.reasons[selected.key]?.segmentIds.at(-1) ?? latest.id)}>See supporting transcript <ChevronRight size={14} /></button>
        </div>
        <div className="panel signal-panel">
          <div className="panel-heading"><div><span className="panel-kicker"><Headphones size={13} /> DELIVERY SIGNALS</span><h2>Voice & tone</h2></div></div>
          <div className="signal-row"><span className="signal-label"><span className="signal-icon cyan"><Activity size={14} /></span>Dominant emotion</span><strong>{snapshot?.secondary.dominantEmotion ?? "Waiting"}</strong><span className="signal-value">{snapshot ? `${snapshot.secondary.emotionIntensity}%` : "--"}</span></div>
          <div className="signal-row"><span className="signal-label"><span className="signal-icon violet"><TrendingUp size={14} /></span>Speaking rate</span><strong>{snapshot?.secondary.speakingRateWpm ?? "--"} <small>wpm</small></strong><span className="signal-value good">{snapshot ? `${snapshot.secondary.informationDensity} density` : "--"}</span></div>
          <div className="signal-row"><span className="signal-label"><span className="signal-icon amber"><Clock3 size={14} /></span>Pause ratio</span><strong>{snapshot?.secondary.pauseRatio ?? "--"} <small>%</small></strong><span className="signal-value">{snapshot ? `${snapshot.secondary.evidenceStrength} evidence` : "waiting"}</span></div>
        </div>
        <div className="privacy-note"><LockKeyhole size={14} /><span><b>Privacy first</b> Raw audio is never stored. Analysis is local to this session.</span></div>
      </aside>
    </section>
  </div>;
}

function TranscriptView({ onJump }: { onJump: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState(false);
  const filtered = transcript.filter((item) => (item.text.toLowerCase().includes(query.toLowerCase()) || item.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))) && (!tagFilter || item.tags.includes("claim") || item.tags.includes("insight")));
  return <div className="view-stack"><section className="section-heading"><div><p className="eyebrow">Session transcript</p><h1>Transcript</h1><p className="section-subtitle">6 final segments · 00:10:14 analyzed</p></div><button className="outline-button" onClick={exportTranscript}><Download size={15} /> Export</button></section><div className="panel transcript-full"><div className="transcript-toolbar"><div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transcript or tags" /></div><button className={`filter-button ${tagFilter ? "active" : ""}`} onClick={() => setTagFilter((value) => !value)} aria-pressed={tagFilter}><Filter size={15} /> {tagFilter ? "Tagged only" : "Filter"} <span>2</span></button></div><div className="full-transcript-list">{filtered.length ? filtered.map((item) => <button className="full-segment" key={item.id} onClick={() => onJump(item.id)}><span className="segment-time">{item.time}</span><span className="segment-body"><span className="segment-speaker"><span className="speaker-avatar">S1</span>{item.speaker}<span className="segment-confidence">{Math.round(item.confidence * 100)}%</span></span><span className="segment-text">{item.text}</span><span className="segment-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</span></span><ChevronRight size={15} className="segment-arrow" /></button>) : <p className="empty-state">No transcript segments match this filter.</p>}</div></div></div>;
}

function TimelineView({ metrics, events, onJump }: { metrics: Metric[]; events: InsightEvent[]; onJump: (id: string) => void }) {
  const [active, setActive] = useState<MetricKey[]>(["overall", "wisdom", "trust"]);
  const width = 900; const height = 250;
  const coords = (metric: Metric) => metric.points.map((point, index) => `${(index / (metric.points.length - 1)) * width},${height - ((point - 35) / 65) * height}`).join(" ");
  return <div className="view-stack"><section className="section-heading"><div><p className="eyebrow">Session history</p><h1>Timeline</h1><p className="section-subtitle">Track how the signal changed across the conversation.</p></div><button className="outline-button"><Clock3 size={15} /> 10:14 analyzed</button></section><div className="panel timeline-panel"><div className="timeline-controls"><div><span className="panel-kicker"><BarChart3 size={13} /> CORE INDICES</span><h2>Metric movement</h2></div><div className="metric-toggles">{metrics.map((metric) => <button key={metric.key} className={active.includes(metric.key) ? "active" : ""} onClick={() => setActive((current) => current.includes(metric.key) ? current.filter((key) => key !== metric.key) : [...current, metric.key])}><span className={`metric-dot ${metric.color}`} />{metric.label}</button>)}</div></div><div className="chart-wrap"><svg viewBox={`0 0 ${width} ${height + 34}`} preserveAspectRatio="none" aria-label="Core indices over time" role="img"><g className="chart-grid">{[0, 1, 2, 3, 4].map((row) => <line key={row} x1="0" x2={width} y1={row * (height / 4)} y2={row * (height / 4)} />)}</g>{active.map((key) => { const metric = metrics.find((item) => item.key === key); return metric ? <polyline key={key} points={coords(metric)} fill="none" stroke={`var(--${metric.color})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /> : null; })}<g className="chart-axis"><text x="0" y={height + 22}>08:42</text><text x={width / 2 - 18} y={height + 22}>09:30</text><text x={width - 42} y={height + 22}>10:14</text></g></svg>{events.map((event, index) => <button className={`chart-event event-${index}`} key={event.id} style={{ left: `${24 + index * 22}%` }} onClick={() => onJump(event.segmentId)}><span />{event.label}</button>)}</div><div className="chart-legend"><span><i className="legend-line cyan" /> Higher signal</span><span><i className="legend-line slate" /> Low confidence segments use lighter lines</span></div></div><div className="panel event-panel timeline-events"><div className="panel-heading"><div><span className="panel-kicker"><Bell size={13} /> EVENT ANCHORS</span><h2>Moments worth revisiting</h2></div></div><div className="event-list two-column">{events.map((event) => <EventRow event={event} key={event.id} onJump={onJump} />)}</div></div></div>;
}

function ClaimsView() {
  const [statusFilter, setStatusFilter] = useState<Claim["status"] | "all">("all");
  const visible = initialClaims.filter((claim) => statusFilter === "all" || claim.status === statusFilter);
  const [notice, setNotice] = useState<string | null>(null);
  const [rechecking, setRechecking] = useState(false);
  const recheck = () => { setRechecking(true); setNotice("Evidence re-check queued locally; no external verifier is configured."); window.setTimeout(() => setRechecking(false), 1000); };
  return <div className="view-stack"><section className="section-heading"><div><p className="eyebrow">Evidence queue</p><h1>Claims</h1><p className="section-subtitle">Separate what was said from what has been verified.</p></div><button className="outline-button" onClick={recheck} disabled={rechecking}><Search size={15} /> {rechecking ? "Queuing…" : "Re-check all"}</button></section><div className="claims-summary"><div><span className="summary-number">3</span><span>Detected</span></div><div><span className="summary-number amber-text">1</span><span>Searching</span></div><div><span className="summary-number emerald-text">1</span><span>Supported</span></div><div><span className="summary-number slate-text">1</span><span>Needs evidence</span></div></div><div className="panel claims-panel"><div className="claims-toolbar"><div><span className="panel-kicker"><ShieldCheck size={13} /> FACT CHECKING</span><h2>Evidence status</h2></div><div className="select-wrap"><ListFilter size={15} /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as Claim["status"] | "all")}><option value="all">All claims</option><option value="searching">Searching</option><option value="supported">Supported</option><option value="insufficient_evidence">Needs evidence</option></select></div></div><div className="claim-list">{visible.map((claim) => <div className="claim-row" key={claim.id}><div className={`claim-status ${claim.status}`}><span>{claim.status === "supported" ? <Check size={15} /> : claim.status === "searching" ? <Activity size={15} /> : <CircleHelp size={15} />}</span><small>{claim.status === "insufficient_evidence" ? "Needs evidence" : claim.status}</small></div><div className="claim-main"><p>{claim.text}</p><div><span className="claim-type">{claim.type}</span><span className="claim-time"><Clock3 size={12} /> {claim.time}</span></div>{claim.source && <div className="claim-source"><ShieldCheck size={13} /><span><b>{claim.source}</b><small>{claim.sourceMeta}</small></span></div>}</div><div className="claim-confidence"><span>Confidence</span><b>{Math.round(claim.confidence * 100)}%</b><div><i style={{ width: `${claim.confidence * 100}%` }} /></div></div><button className="icon-button" aria-label="Open claim" onClick={() => setNotice(`Claim selected: ${claim.type} · ${claim.time}`)}><ChevronRight size={17} /></button></div>)}</div><div className="evidence-footnote"><TriangleAlert size={14} /><span>{notice ?? "Insufficient evidence is not an error verdict. SpeechLens never turns an unverified claim into a fact."}</span></div></div></div>;
}

function ReportView({ metrics, events, onJump }: { metrics: Metric[]; events: InsightEvent[]; onJump: (id: string) => void }) {
  const overall = metrics.find((metric) => metric.key === "overall")!;
  const exportJson = () => downloadFile("speechlens-report.json", JSON.stringify({ metrics, events, transcript, claims: initialClaims }, null, 2), "application/json;charset=utf-8");
  const exportMarkdown = () => downloadFile("speechlens-report.md", `# SpeechLens report\n\n## Conclusion\n\nStrong insight density and technical depth, with one key performance claim still awaiting evidence.\n\n## Metrics\n\n${metrics.map((metric) => `- ${metric.label}: ${metric.score}`).join("\n")}\n`, "text/markdown;charset=utf-8");
  return <div className="view-stack"><section className="section-heading"><div><p className="eyebrow">Session complete</p><h1>Analysis report</h1><p className="section-subtitle">AI Systems & the next interface · 10:14 analyzed · Today, 09:42</p></div><div className="report-actions"><button className="outline-button" onClick={exportJson}><Download size={15} /> Export JSON</button><button className="primary-button" onClick={exportMarkdown}><Download size={15} /> Export Markdown</button></div></section><div className="report-hero panel"><div className="report-score"><ScoreRing score={overall.score} color="cyan" size={92} /><div><span className="panel-kicker">OVERALL VALUE</span><h2>Worth a closer look</h2><p>Strong insight density and technical depth, with one key performance claim still awaiting evidence.</p></div></div><div className="report-meta"><span><Clock3 size={14} /> 10:14</span><span><Users size={14} /> 1 speaker</span><span><ShieldCheck size={14} /> 3 claims</span></div></div><div className="report-grid"><div className="panel report-section"><div className="panel-heading"><div><span className="panel-kicker"><Lightbulb size={13} /> KEY INSIGHTS</span><h2>What to remember</h2></div></div><div className="report-insight"><span className="number-badge">01</span><div><b>The interface is becoming the product</b><p>Models create value when they observe intent, retrieve context, and take bounded actions inside real workflows.</p></div></div><div className="report-insight"><span className="number-badge">02</span><div><b>Feedback loops create durable advantage</b><p>The strongest differentiation moves from prompt quality to correction data generated by work in context.</p></div></div></div><div className="panel report-section"><div className="panel-heading"><div><span className="panel-kicker"><MessageSquareQuote size={13} /> HIGH-VALUE CLIPS</span><h2>Worth sharing</h2></div></div>{events.filter((event) => event.kind === "quote" || event.kind === "insight").map((event) => <button className="quote-row" key={event.id} onClick={() => onJump(event.segmentId)}><MessageSquareQuote size={16} /><span><b>“{event.title}”</b><small>{event.time} · {event.kind === "quote" ? "92% quote probability" : "86% insight value"}</small></span><ChevronRight size={15} /></button>)}</div></div><div className="report-metrics"><span className="panel-kicker">FINAL INDICES</span>{metrics.map((metric) => <div className="report-metric" key={metric.key}><span className={`metric-dot ${metric.color}`} /><span>{metric.label}</span><b>{metric.score}</b><span className={`mini-delta ${metric.trend}`}>{metric.delta > 0 ? "+" : ""}{metric.delta}</span></div>)}</div></div>;
}

export default function App() {
  const [view, setView] = useState<View>("live");
  const [metrics, setMetrics] = useState<Metric[]>(seedMetrics);
  const [events, setEvents] = useState<InsightEvent[]>(initialEvents);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("overall");
  const [eventFilter, setEventFilter] = useState<EventKind | "all">("all");
  const [jumpNotice, setJumpNotice] = useState<string | null>(null);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [snapshot, setSnapshot] = useState<MetricSnapshot | null>(null);
  const [scoringError, setScoringError] = useState<string | null>(null);

  useEffect(() => {
    if (isPaused || sessionDone) return;
    const timer = window.setInterval(() => setCurrentSegment((index) => Math.min(index + 1, transcript.length - 1)), 5000);
    return () => window.clearInterval(timer);
  }, [isPaused, sessionDone]);

  useEffect(() => {
    const context = transcript.slice(0, currentSegment + 1);
    const controller = new AbortController();
    let cancelled = false;
    void scoreTranscript("demo-session", context, controller.signal).then(({ snapshot: next, changes }) => {
      if (cancelled) return;
      setScoringError(null);
      setSnapshot(next);
      if (next.stale) return;
      setMetrics((current) => current.map((metric) => {
        const score = next.smoothed[metric.key];
        const delta = score - metric.score;
        return { ...metric, score, delta, confidence: next.confidence[metric.key], trend: delta > 0 ? "up" : delta < 0 ? "down" : "flat", points: [...metric.points.slice(-7), score] };
      }));
      setEvents((current) => [...changes.map((change: ScoreChange): InsightEvent => ({
        id: `score-${next.window.id}-${change.metric}`, kind: "insight", label: "Score change",
        title: `${metricMeta.find((metric) => metric.key === change.metric)?.label} ${change.direction === "up" ? "increased" : "decreased"}`,
        explanation: change.reason.text, time: context.at(-1)!.time,
        severity: change.direction === "up" ? "positive" : "warning", metric: change.metric,
        segmentId: change.reason.segmentIds.at(-1) ?? context.at(-1)!.id,
      })), ...current]);
    }).catch((error: Error) => {
      if (!cancelled && error.name !== "AbortError") setScoringError("Local scoring service unavailable");
    });
    return () => { cancelled = true; controller.abort(); };
  }, [currentSegment]);

  const filteredEvents = useMemo(() => eventFilter === "all" ? events : events.filter((event) => event.kind === eventFilter), [events, eventFilter]);
  const currentView = sessionDone && view === "live" ? "report" : view;

  const jumpToSegment = (segmentId: string) => {
    const segment = transcript.find((item) => item.id === segmentId);
    setJumpNotice(segment ? `Jumped to ${segment.time} · ${segment.text.slice(0, 42)}…` : "Segment not available");
    window.setTimeout(() => setJumpNotice(null), 2800);
  };

  const stopSession = () => { setSessionDone(true); setIsPaused(false); setView("report"); };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><span>S</span><i /></div><div><b>SpeechLens</b><small>Real-time intelligence</small></div></div>
      <div className="session-card"><div className="session-card-top"><span className="live-indicator"><span /> {sessionDone ? "Completed" : isPaused ? "Paused" : "Live session"}</span></div><p>AI Systems & the next interface</p><div className="session-source"><span className="youtube-glyph">▶</span><span>youtube.com</span><span className="source-duration">10:14</span></div></div>
      <nav className="main-nav" aria-label="Main navigation">{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={currentView === item.id ? "active" : ""} onClick={() => setView(item.id)}><Icon size={17} /><span>{item.label}</span>{item.id === "claims" && <em>3</em>}</button>; })}</nav>
      <div className="sidebar-bottom"><button className="sidebar-link" onClick={() => setJumpNotice("Settings are available when a local session is connected.")}><Settings2 size={16} /> Settings</button><button className="sidebar-link" onClick={() => setJumpNotice("Help: start the local scorer, then open the Live view.")}><CircleHelp size={16} /> Help center</button><div className="privacy-sidebar"><LockKeyhole size={14} /><span>Local session<br /><b>Raw audio off</b></span><Check size={14} /></div><div className="user-row"><span className="user-avatar">W</span><span><b>Wei Qi</b><small>Personal workspace</small></span><MoreHorizontal size={15} /></div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="mobile-brand"><div className="brand-mark"><span>S</span><i /></div><b>SpeechLens</b></div><div className="breadcrumb"><span>Sessions</span><ChevronRight size={14} /><b>AI Systems & the next interface</b></div><div className="topbar-actions"><span className="latency"><span /> local scorer</span><button className="icon-button" aria-label="Notifications" onClick={() => setJumpNotice("No new notifications.")}><Bell size={17} /></button><button className="icon-button" aria-label="More options" onClick={() => setJumpNotice("Session actions are available from the bottom bar.")}><MoreHorizontal size={17} /></button></div></header>
      <div className="content-area">
        {currentView === "live" && <LiveView metrics={metrics} selectedMetric={selectedMetric} onSelectMetric={setSelectedMetric} events={filteredEvents} onJump={jumpToSegment} isPaused={isPaused} eventFilter={eventFilter} onEventFilter={setEventFilter} onNavigate={setView} currentSegment={currentSegment} snapshot={snapshot} scoringError={scoringError} />}
        {currentView === "transcript" && <TranscriptView onJump={jumpToSegment} />}
        {currentView === "timeline" && <TimelineView metrics={metrics} events={events} onJump={jumpToSegment} />}
        {currentView === "claims" && <ClaimsView />}
        {currentView === "report" && <ReportView metrics={metrics} events={events} onJump={jumpToSegment} />}
      </div>
      <footer className="control-bar"><div className="control-context"><span className="control-dot" /><span>{sessionDone ? "Session complete" : isPaused ? "Analysis paused" : "Analyzing current tab"}</span><span className="control-separator" /><span className="control-muted"><LockKeyhole size={13} /> Raw audio not stored</span></div><div className="control-actions">{!sessionDone && <><button className="control-button" onClick={() => setIsPaused((value) => !value)}>{isPaused ? <Play size={15} /> : <Pause size={15} />}{isPaused ? "Resume" : "Pause"}</button><button className="stop-button" onClick={stopSession}><Square size={13} fill="currentColor" /> End session</button></>}</div></footer>
    </main>
    {jumpNotice && <div className="jump-notice"><Check size={15} />{jumpNotice}<button onClick={() => setJumpNotice(null)} aria-label="Dismiss"><X size={14} /></button></div>}
  </div>;
}
