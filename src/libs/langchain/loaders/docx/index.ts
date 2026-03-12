import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

import { loaderConfig } from '../config';

/**
 * Extract readable text from docx XML without using DOMParser.
 * Handles <w:t> tags, paragraph breaks, and table cells.
 */
function extractTextFromDocxXml(xml: string): string {
  const lines: string[] = [];

  // Split by paragraph end tags and extract text from each
  const paragraphs = xml.split(/<\/w:p>/gi);

  for (const para of paragraphs) {
    // Match all <w:t> tags (with or without xml:space="preserve")
    const textMatches = para.match(/<w:t[^>]*>([^<]*)<\/w:t>/gi);
    if (textMatches) {
      const texts = textMatches.map((match) => {
        return match.replace(/<w:t[^>]*>/i, '').replace(/<\/w:t>/i, '');
      });
      const currentParagraph = texts.join('');

      if (currentParagraph.trim()) {
        lines.push(currentParagraph.trim());
      }
    }
  }

  return lines.join('\n');
}

/**
 * Custom DocxLoader that uses JSZip to extract text from .docx files.
 * Replaces @langchain/community DocxLoader which crashes with:
 * "DOMParser.parseFromString: the provided mimeType 'undefined' is not valid"
 * due to @xmldom/xmldom v0.9.8 requiring explicit mimeType.
 */
export const DocxLoader = async (fileBlob: Blob | string) => {
  const jszipModule = await import('jszip');
  const JSZip = jszipModule.default;

  let buffer: ArrayBuffer;
  if (typeof fileBlob === 'string') {
    const encoder = new TextEncoder();
    buffer = encoder.encode(fileBlob).buffer as ArrayBuffer;
  } else {
    buffer = await fileBlob.arrayBuffer();
  }

  const zip = await JSZip.loadAsync(buffer);
  const documentXml = zip.file('word/document.xml');

  if (!documentXml) {
    throw new Error('Invalid .docx file: word/document.xml not found');
  }

  const xmlContent = await documentXml.async('text');
  const textContent = extractTextFromDocxXml(xmlContent);

  const documents = [
    new Document({
      metadata: { source: 'docx' },
      pageContent: textContent,
    }),
  ];

  const splitter = new RecursiveCharacterTextSplitter(loaderConfig);
  return await splitter.splitDocuments(documents);
};
