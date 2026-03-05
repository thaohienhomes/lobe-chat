'use client';

/**
 * PdfUploader — Research Mode Discovery Phase Component
 * Lets users upload PDF research papers and extract their text for analysis.
 * Extracted text is added to the research store as a searchable paper entry.
 */

import { Button } from '@lobehub/ui';
import { Upload } from 'antd';
import { createStyles } from 'antd-style';
import { FileText, UploadCloud, X } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { type PaperResult, useResearchStore } from '@/store/research';

const useStyles = createStyles(({ css, token }) => ({
    dropzone: css`
    cursor: pointer;

    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    justify-content: center;

    padding: 24px 16px;

    text-align: center;

    border: 2px dashed ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;

    transition: all 0.2s;

    &:hover {
      background: ${token.colorFillQuaternary};
      border-color: ${token.colorPrimary};
    }
  `,
    errorMsg: css`
    padding: 8px 12px;

    font-size: 12px;
    color: ${token.colorError};

    background: ${token.colorErrorBg};
    border: 1px solid ${token.colorErrorBorder};
    border-radius: ${token.borderRadiusLG}px;
  `,
    fileCard: css`
    padding: 12px 14px;

    background: ${token.colorFillQuaternary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
    hint: css`
    font-size: 11px;
    color: ${token.colorTextQuaternary};
  `,
    label: css`
    font-size: 13px;
    font-weight: 600;
    color: ${token.colorTextSecondary};
  `,
    preview: css`
    overflow: hidden;

    max-height: 60px;

    font-size: 11px;
    font-family: monospace;
    color: ${token.colorTextTertiary};
    white-space: pre-wrap;
  `,
    root: css`
    width: 100%;
  `,
    successMsg: css`
    padding: 8px 12px;

    font-size: 12px;
    color: ${token.colorSuccess};

    background: ${token.colorSuccessBg};
    border: 1px solid ${token.colorSuccessBorder};
    border-radius: ${token.borderRadiusLG}px;
  `,
    title: css`
    font-size: 13px;
    font-weight: 600;
    color: ${token.colorText};
  `,
}));

interface ExtractedFile {
    charCount: number;
    filename: string;
    preview: string;
    text: string;
    title: string;
}

const PdfUploader = memo(() => {
    const { styles } = useStyles();
    const addPaper = useResearchStore((s) => s.addPaper);
    const setSearchQuery = useResearchStore((s) => s.setSearchQuery);

    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [extractedFiles, setExtractedFiles] = useState<ExtractedFile[]>([]);

    const handleFile = useCallback(async (file: File) => {
        setError(null);
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/pdf/extract', {
                body: formData,
                method: 'POST',
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error ?? 'Extraction failed');
            }

            const data = await res.json();

            if (!data.text || data.text.length < 50) {
                throw new Error(data.warning ?? 'Could not extract text from this PDF. It may be scanned or encrypted.');
            }

            // Add to extracted files state
            const extracted: ExtractedFile = {
                charCount: data.charCount,
                filename: file.name,
                preview: data.text.slice(0, 200),
                text: data.text,
                title: data.title || file.name.replace('.pdf', ''),
            };
            setExtractedFiles((prev) => [...prev, extracted]);

            // Add to research store as a paper entry
            const paper: PaperResult = {
                abstract: data.text.slice(0, 500),
                authors: 'Uploaded Document',
                id: `pdf-${Date.now()}-${file.name}`,
                journal: 'Local PDF Upload',
                source: 'PubMed', // use as a generic source type
                title: extracted.title,
                year: new Date().getFullYear(),
            };
            addPaper(paper);

            // Auto-fill search query with the title
            if (extracted.title.length > 5) {
                setSearchQuery(extracted.title.slice(0, 100));
            }
        } catch (err: any) {
            setError(err?.message ?? 'Upload failed');
        } finally {
            setUploading(false);
        }
    }, [addPaper, setSearchQuery]);

    const removeFile = useCallback((filename: string) => {
        setExtractedFiles((prev) => prev.filter((f) => f.filename !== filename));
    }, []);

    return (
        <Flexbox className={styles.root} gap={12}>
            <span className={styles.label}>📄 Upload PDF Papers</span>

            <Upload.Dragger
                accept=".pdf,application/pdf"
                beforeUpload={(file) => {
                    handleFile(file);
                    return false; // prevent default upload
                }}
                className={styles.dropzone}
                multiple
                showUploadList={false}
            >
                <Flexbox align="center" gap={8}>
                    <UploadCloud size={28} style={{ color: 'var(--ant-color-text-quaternary)' }} />
                    <span className={styles.label}>
                        {uploading ? 'Extracting text...' : 'Drop PDF files here or click to browse'}
                    </span>
                    <span className={styles.hint}>Max 20MB per file · Text will be extracted and added to your library</span>
                </Flexbox>
            </Upload.Dragger>

            {error && <div className={styles.errorMsg}>⚠️ {error}</div>}

            {extractedFiles.map((f) => (
                <Flexbox className={styles.fileCard} gap={8} key={f.filename}>
                    <Flexbox align="center" horizontal justify="space-between">
                        <Flexbox align="center" gap={8} horizontal>
                            <FileText size={16} style={{ flexShrink: 0 }} />
                            <span className={styles.title}>{f.filename}</span>
                        </Flexbox>
                        <Button
                            icon={<X size={14} />}
                            onClick={() => removeFile(f.filename)}
                            size="small"
                            type="text"
                        />
                    </Flexbox>
                    <div className={styles.successMsg}>
                        ✅ Extracted {f.charCount.toLocaleString()} characters — added to research library
                    </div>
                    <div className={styles.preview}>{f.preview}...</div>
                </Flexbox>
            ))}
        </Flexbox>
    );
});

PdfUploader.displayName = 'PdfUploader';
export default PdfUploader;
