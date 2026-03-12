/**
 * TranslatedDocument Artifact Renderer
 *
 * Renders when the AI model outputs a translated document artifact.
 * Shows:
 * 1. Translation summary with stats
 * 2. Side-by-side diff view (original → translated)
 * 3. Download button for the translated .docx
 * 4. Progress indicator during translation
 */
import { memo, useCallback, useMemo, useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────

interface TranslationEntry {
  confidence?: number;
  id: string;
  original: string;
  translated: string;
  type?: string;
}

interface TranslatedDocumentData {
  detectedLanguage?: string;
  diagramType?: string;
  fileName?: string;
  jobId?: string;
  route?: string;
  stats?: {
    fontAdjustments?: number;
    replacements?: number;
    totalElements?: number;
    unchanged?: number;
  };
  status?: 'extracting' | 'translating' | 'complete' | 'error';
  targetLang?: string;
  translations?: TranslationEntry[];
}

// ─── Sub-components ─────────────────────────────────────────────────

const ProgressBar = memo<{ progress: number; status: string }>(({ progress, status }) => (
  <div style={{ marginBottom: 16 }}>
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 4,
      }}
    >
      <span style={{ color: '#888', fontSize: 13 }}>{status}</span>
      <span style={{ color: '#aaa', fontSize: 12 }}>{progress}%</span>
    </div>
    <div
      style={{
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 4,
        height: 6,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(90deg, #00b894, #00cec9)',
          borderRadius: 4,
          height: '100%',
          transition: 'width 0.3s ease',
          width: `${progress}%`,
        }}
      />
    </div>
  </div>
));
ProgressBar.displayName = 'ProgressBar';

const DiffRow = memo<{ entry: TranslationEntry; index: number }>(({ entry, index }) => (
  <div
    style={{
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'grid',
      gap: 12,
      gridTemplateColumns: '32px 1fr 1fr',
      padding: '8px 0',
    }}
  >
    <span style={{ color: '#666', fontSize: 11, textAlign: 'right' }}>{index + 1}</span>
    <div
      style={{
        background: 'rgba(255, 107, 107, 0.08)',
        borderLeft: '2px solid rgba(255, 107, 107, 0.3)',
        borderRadius: 4,
        fontSize: 13,
        padding: '4px 8px',
      }}
    >
      {entry.original}
    </div>
    <div
      style={{
        background: 'rgba(0, 206, 201, 0.08)',
        borderLeft: '2px solid rgba(0, 206, 201, 0.3)',
        borderRadius: 4,
        fontSize: 13,
        padding: '4px 8px',
      }}
    >
      {entry.translated}
      {entry.confidence !== undefined && entry.confidence < 0.8 && (
        <span style={{ color: '#f39c12', fontSize: 10, marginLeft: 4 }}>
          ⚠ {Math.round(entry.confidence * 100)}%
        </span>
      )}
    </div>
  </div>
));
DiffRow.displayName = 'DiffRow';

const DownloadButton = memo<{ jobId?: string }>(({ jobId }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!jobId) return;
    setDownloading(true);
    try {
      const response = await fetch('/api/document-translation/apply', {
        body: JSON.stringify({ jobId }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translated_${Date.now()}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[TranslatedDocument] Download error:', err);
    } finally {
      setDownloading(false);
    }
  }, [jobId]);

  return (
    <button
      disabled={!jobId || downloading}
      onClick={handleDownload}
      style={{
        background: 'linear-gradient(135deg, #00b894, #00cec9)',
        border: 'none',
        borderRadius: 8,
        color: '#fff',
        cursor: jobId ? 'pointer' : 'not-allowed',
        fontSize: 14,
        fontWeight: 600,
        opacity: downloading ? 0.6 : 1,
        padding: '10px 24px',
        transition: 'opacity 0.2s',
      }}
      type="button"
    >
      {downloading ? '⏳ Đang tải...' : '📥 Tải file đã dịch (.docx)'}
    </button>
  );
});
DownloadButton.displayName = 'DownloadButton';

// ─── Stat Badge ─────────────────────────────────────────────────────

const StatBadge = memo<{ label: string; value: string | number }>(({ label, value }) => (
  <div
    style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: 8,
      padding: '8px 12px',
      textAlign: 'center',
    }}
  >
    <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{value}</div>
    <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{label}</div>
  </div>
));
StatBadge.displayName = 'StatBadge';

// ─── Route Badge ────────────────────────────────────────────────────

const routeLabels: Record<string, { color: string; icon: string; label: string }> = {
  hybrid: { color: '#a29bfe', icon: '🔀', label: 'Hybrid' },
  vision_ai: { color: '#fd79a8', icon: '👁️', label: 'Vision AI' },
  xml_parsing: { color: '#00cec9', icon: '📐', label: 'XML Parsing' },
};

// ─── Main Component ─────────────────────────────────────────────────

function parseContent(content: string): TranslatedDocumentData | null {
  try {
    let cleaned = content.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) return null;
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    return JSON.parse(cleaned) as TranslatedDocumentData;
  } catch {
    return null;
  }
}

const TranslatedDocumentRenderer = memo<{ content: string }>(({ content }) => {
  const data = useMemo(() => parseContent(content), [content]);

  if (!data) {
    return (
      <div style={{ color: '#e74c3c', padding: 16 }}>
        ❌ Không thể đọc dữ liệu dịch thuật. Vui lòng thử lại.
      </div>
    );
  }

  const isInProgress = data.status === 'extracting' || data.status === 'translating';
  const isComplete = data.status === 'complete';
  const translations = data.translations || [];
  const routeInfo = routeLabels[data.route || 'xml_parsing'] || routeLabels.xml_parsing;

  const progress =
    data.status === 'extracting'
      ? 30
      : data.status === 'translating'
        ? 70
        : data.status === 'complete'
          ? 100
          : 0;

  const statusText =
    data.status === 'extracting'
      ? 'Đang trích xuất văn bản từ sơ đồ...'
      : data.status === 'translating'
        ? 'Đang dịch thuật...'
        : data.status === 'complete'
          ? 'Hoàn tất!'
          : 'Đợi xử lý...';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        height: '100%',
        overflow: 'auto',
        padding: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 8,
          justifyContent: 'space-between',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
          📄 Dịch tài liệu giữ nguyên cấu trúc
        </h3>
        <div
          style={{
            alignItems: 'center',
            background: `${routeInfo.color}20`,
            borderRadius: 12,
            color: routeInfo.color,
            display: 'flex',
            fontSize: 11,
            gap: 4,
            padding: '3px 10px',
          }}
        >
          {routeInfo.icon} {routeInfo.label}
        </div>
      </div>

      {/* Progress */}
      {isInProgress && <ProgressBar progress={progress} status={statusText} />}

      {/* Stats row */}
      {data.stats && (
        <div
          style={{
            display: 'grid',
            gap: 8,
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
          }}
        >
          <StatBadge label="Tổng phần tử" value={data.stats.totalElements || translations.length} />
          <StatBadge label="Đã thay thế" value={data.stats.replacements || translations.length} />
          <StatBadge label="Không đổi" value={data.stats.unchanged || 0} />
          {data.detectedLanguage && (
            <StatBadge label="Ngôn ngữ gốc" value={data.detectedLanguage} />
          )}
        </div>
      )}

      {/* Diff view */}
      {translations.length > 0 && (
        <div>
          <div
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'grid',
              gap: 12,
              gridTemplateColumns: '32px 1fr 1fr',
              marginBottom: 4,
              paddingBottom: 6,
            }}
          >
            <span style={{ color: '#666', fontSize: 11 }}>#</span>
            <span style={{ color: '#ff6b6b', fontSize: 12, fontWeight: 600 }}>Gốc</span>
            <span style={{ color: '#00cec9', fontSize: 12, fontWeight: 600 }}>Đã dịch</span>
          </div>
          {translations.map((entry, i) => (
            <DiffRow entry={entry} index={i} key={entry.id} />
          ))}
        </div>
      )}

      {/* Download button */}
      {isComplete && (
        <div style={{ paddingTop: 8, textAlign: 'center' }}>
          <DownloadButton jobId={data.jobId} />
        </div>
      )}
    </div>
  );
});

TranslatedDocumentRenderer.displayName = 'TranslatedDocumentRenderer';

export default TranslatedDocumentRenderer;
