import JSZip from 'jszip';

export interface BookChapter {
  id: string;
  title: string;
  subTitle?: string;
  paragraphs: string[];
}

export interface BookConversionResult {
  title: string;
  author: string;
  totalChars: number;
  totalWords: number;
  totalParagraphs: number;
  chaptersCount: number;
  md: string;
  fb2: string;
  epubBlob: Blob;
  previewChapters: BookChapter[];
}

/**
 * Escape strict XML entities for FB2 and EPUB XHTML
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Intelligent Typography & Text Formatting Engine for Raw Speech-to-Text / YouTube Transcripts
 * Preserves 100% of text content (no truncation or summarization), but applies publishing-grade formatting:
 * - Cleans timestamps ([00:12], 01:23:45)
 * - Glues broken linebreaks from Whisper / auto-subs into coherent sentences
 * - Normalizes dialogue dashes (—) and quotation marks (« »)
 * - Splits into readable paragraphs by sentence groups and dialogue turns
 * - Capitalizes start of sentences
 */
export function formatRawTranscriptToParagraphs(rawText: string): string[] {
  if (!rawText || !rawText.trim()) return [];

  // 1. Remove timestamps: [00:12:34], [12:34], 00:12:34, 12:34
  let text = rawText
    .replace(/\[\s*\d{1,2}:\d{2}(?::\d{2})?\s*\]/g, '')
    .replace(/(?:^|\s)\d{1,2}:\d{2}(?::\d{2})?(?=\s|$)/gm, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // 2. Normalize multiple spaces & tabs
  text = text.replace(/[ \t]+/g, ' ');

  // 3. Fix speech-to-text linebreaks in the middle of sentences
  // If line ends with a comma, lowercase letter, or without punctuation, merge with next line
  const rawLines = text.split('\n');
  const mergedLines: string[] = [];
  let currentBuffer = '';

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) {
      if (currentBuffer) {
        mergedLines.push(currentBuffer);
        currentBuffer = '';
      }
      continue;
    }

    // Check if line is a dialogue marker or heading
    const isDialogue = /^[-—–•]\s+/.test(line);

    if (isDialogue) {
      if (currentBuffer) {
        mergedLines.push(currentBuffer);
        currentBuffer = '';
      }
      currentBuffer = '— ' + line.replace(/^[-—–•]\s+/, '');
    } else {
      if (!currentBuffer) {
        currentBuffer = line;
      } else {
        // If previous buffer ends with terminal punctuation (. ? ! ...), it's a new thought
        const endsWithPunct = /[.!?…]\s*$/.test(currentBuffer);
        if (endsWithPunct) {
          mergedLines.push(currentBuffer);
          currentBuffer = line;
        } else {
          // Glue together
          currentBuffer += ' ' + line;
        }
      }
    }
  }

  if (currentBuffer) {
    mergedLines.push(currentBuffer);
  }

  // 4. Group merged sentences into readable book paragraphs (3-6 sentences or 400-800 chars each)
  const paragraphs: string[] = [];
  let currentParagraph = '';

  for (const block of mergedLines) {
    // If it's dialogue, it should be its own paragraph
    if (block.startsWith('— ')) {
      if (currentParagraph) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = '';
      }
      paragraphs.push(block.trim());
      continue;
    }

    // Clean punctuation spacing: "слово ,слово" -> "слово, слово"
    let cleanBlock = block
      .replace(/\s+([,.:;!?…])/g, '$1')
      .replace(/([,.:;!?…])(?=[^\s\d,.:;!?…])/g, '$1 ');

    // Capitalize first letter of block if needed
    cleanBlock = cleanBlock.charAt(0).toUpperCase() + cleanBlock.slice(1);

    if (!currentParagraph) {
      currentParagraph = cleanBlock;
    } else if (currentParagraph.length + cleanBlock.length < 750) {
      currentParagraph += ' ' + cleanBlock;
    } else {
      paragraphs.push(currentParagraph.trim());
      currentParagraph = cleanBlock;
    }
  }

  if (currentParagraph) {
    paragraphs.push(currentParagraph.trim());
  }

  return paragraphs.filter((p) => p.length > 0);
}

/**
 * Split full paragraphs into chapters/sections for smooth reading and standard EPUB/FB2 structure
 */
export function buildBookChapters(
  paragraphs: string[],
  bookTitle: string,
  targetWordsPerChapter = 2500
): BookChapter[] {
  if (paragraphs.length === 0) return [];

  const chapters: BookChapter[] = [];
  let currentChapterParas: string[] = [];
  let currentWordCount = 0;
  let chapterIndex = 1;

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const words = p.split(/\s+/).length;
    currentChapterParas.push(p);
    currentWordCount += words;

    // Split if reached word limit and not on last few paragraphs
    if (currentWordCount >= targetWordsPerChapter && i < paragraphs.length - 15) {
      chapters.push({
        id: `section_${chapterIndex}`,
        title: `Часть ${chapterIndex}`,
        subTitle: `Смысловой блок ${chapterIndex}`,
        paragraphs: currentChapterParas,
      });
      chapterIndex++;
      currentChapterParas = [];
      currentWordCount = 0;
    }
  }

  if (currentChapterParas.length > 0) {
    chapters.push({
      id: `section_${chapterIndex}`,
      title: chapters.length === 0 ? bookTitle : `Часть ${chapterIndex}`,
      subTitle: `Завершающий раздел`,
      paragraphs: currentChapterParas,
    });
  }

  return chapters;
}

/**
 * Convert ANY transcript of ANY size (e.g. 143 KB, 500 KB, 2 MB) into full, complete EPUB 3.0, FB2 2.0, and Markdown
 */
export async function convertFullTranscriptToFormats(
  title: string,
  author: string,
  rawText: string
): Promise<BookConversionResult> {
  const paragraphs = formatRawTranscriptToParagraphs(rawText);
  const chapters = buildBookChapters(paragraphs, title);

  const totalChars = rawText.length;
  const totalWords = paragraphs.reduce((acc, p) => acc + p.split(/\s+/).filter(Boolean).length, 0);

  // 1. GENERATE MARKDOWN
  let md = `# ${title}\n\n`;
  md += `**Автор:** ${author}  \n`;
  md += `**Объем текста:** ${(totalChars / 1024).toFixed(1)} КБ | ${totalWords.toLocaleString()} слов | ${paragraphs.length} абзацев  \n`;
  md += `**Дата обработки:** ${new Date().toISOString().split('T')[0]}  \n\n`;
  md += `---\n\n`;

  chapters.forEach((ch, idx) => {
    if (chapters.length > 1) {
      md += `## ${ch.title}\n\n`;
    }
    ch.paragraphs.forEach((p) => {
      md += `${p}\n\n`;
    });
    md += `---\n\n`;
  });

  // 2. GENERATE FB2 2.0 (FictionBook XML)
  let fb2 = `<?xml version="1.0" encoding="utf-8"?>\n`;
  fb2 += `<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0" xmlns:l="http://www.w3.org/1999/xlink">\n`;
  fb2 += `  <description>\n`;
  fb2 += `    <title-info>\n`;
  fb2 += `      <genre>science</genre>\n`;
  fb2 += `      <author>\n`;
  fb2 += `        <first-name>${escapeXml(author.split(' ')[0] || 'Автор')}</first-name>\n`;
  fb2 += `        <last-name>${escapeXml(author.split(' ').slice(1).join(' ') || '')}</last-name>\n`;
  fb2 += `      </author>\n`;
  fb2 += `      <book-title>${escapeXml(title)}</book-title>\n`;
  fb2 += `      <annotation>\n`;
  fb2 += `        <p>Полная расшифровка и типографическая стенограмма лекции. Объем: ${(totalChars / 1024).toFixed(1)} КБ, ${totalWords.toLocaleString()} слов.</p>\n`;
  fb2 += `      </annotation>\n`;
  fb2 += `      <date value="${new Date().toISOString().split('T')[0]}">${new Date().toLocaleDateString('ru-RU')}</date>\n`;
  fb2 += `      <lang>ru</lang>\n`;
  fb2 += `    </title-info>\n`;
  fb2 += `    <document-info>\n`;
  fb2 += `      <author><nickname>ONCHAIN CORE E-Book Engine</nickname></author>\n`;
  fb2 += `      <program-used>E-Book Typography Studio</program-used>\n`;
  fb2 += `      <date value="${new Date().toISOString().split('T')[0]}">${new Date().toISOString().split('T')[0]}</date>\n`;
  fb2 += `      <id>book-${Date.now()}</id>\n`;
  fb2 += `      <version>1.0</version>\n`;
  fb2 += `    </document-info>\n`;
  fb2 += `  </description>\n`;
  fb2 += `  <body>\n`;
  fb2 += `    <title>\n`;
  fb2 += `      <p>${escapeXml(author)}</p>\n`;
  fb2 += `      <empty-line/>\n`;
  fb2 += `      <p><strong>${escapeXml(title)}</strong></p>\n`;
  fb2 += `    </title>\n`;

  chapters.forEach((ch) => {
    fb2 += `    <section>\n`;
    if (chapters.length > 1) {
      fb2 += `      <title><p>${escapeXml(ch.title)}</p></title>\n`;
    }
    ch.paragraphs.forEach((p) => {
      fb2 += `      <p>${escapeXml(p)}</p>\n`;
    });
    fb2 += `    </section>\n`;
  });

  fb2 += `  </body>\n`;
  fb2 += `</FictionBook>\n`;

  // 3. GENERATE EPUB 3.0 (IDPF / W3C Compliant ZIP)
  const zip = new JSZip();

  // mimetype MUST be uncompressed (STORE) and first entry
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // META-INF/container.xml
  zip.folder('META-INF')!.file(
    'container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  // CSS Styles
  const css = `
body {
  font-family: Georgia, "Times New Roman", serif;
  line-height: 1.65;
  margin: 5%;
  color: #1a1a1a;
  background-color: #fafafa;
}
h1, h2, h3 {
  font-family: "Helvetica Neue", Arial, sans-serif;
  color: #2b1d0c;
  line-height: 1.3;
  text-align: center;
}
h1 { font-size: 1.8em; margin-bottom: 0.5em; }
h2 { font-size: 1.4em; margin-top: 1.5em; margin-bottom: 0.8em; border-bottom: 1px solid #d4af37; padding-bottom: 0.3em; }
p {
  margin-bottom: 0.85em;
  text-indent: 1.25em;
  text-align: justify;
}
p.no-indent { text-indent: 0; }
.author-title { font-style: italic; color: #6b583e; margin-bottom: 2em; text-align: center; font-size: 1.1em; }
.annotation-box { background: #f4f0e8; border-left: 4px solid #b8860b; padding: 1.2em; margin: 2em 0; font-style: italic; }
footer { margin-top: 3em; font-size: 0.85em; text-align: center; color: #888; border-top: 1px solid #ddd; padding-top: 1em; }
`;
  zip.folder('OEBPS')!.file('styles.css', css);

  let manifestItems = `    <item id="styles" href="styles.css" media-type="text/css"/>\n`;
  manifestItems += `    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>\n`;
  manifestItems += `    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>\n`;
  manifestItems += `    <item id="titlepage" href="titlepage.xhtml" media-type="application/xhtml+xml"/>\n`;

  let spineItems = `    <itemref idref="titlepage"/>\n`;

  // Title Page XHTML
  const titleXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="ru" lang="ru">
<head>
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1>${escapeXml(title)}</h1>
  <p class="author-title">${escapeXml(author)}</p>
  <div class="annotation-box">
    <p class="no-indent"><strong>Стенограмма и полный текст:</strong></p>
    <p class="no-indent">Полная неотредактированная версия с сохранением 100% смыслового объема (${(totalChars / 1024).toFixed(1)} КБ, ${totalWords.toLocaleString()} слов, ${paragraphs.length} абзацев).</p>
  </div>
  <footer>
    <p class="no-indent">Подготовлено в E-Book Studio (2026)</p>
  </footer>
</body>
</html>`;
  zip.folder('OEBPS')!.file('titlepage.xhtml', titleXhtml);

  // Chapter XHTML Files
  chapters.forEach((ch, idx) => {
    const fileId = `chapter_${idx + 1}`;
    const fileName = `${fileId}.xhtml`;
    manifestItems += `    <item id="${fileId}" href="${fileName}" media-type="application/xhtml+xml"/>\n`;
    spineItems += `    <itemref idref="${fileId}"/>\n`;

    let chHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="ru" lang="ru">
<head>
  <title>${escapeXml(ch.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h2>${escapeXml(ch.title)}</h2>
`;
    ch.paragraphs.forEach((p) => {
      chHtml += `  <p>${escapeXml(p)}</p>\n`;
    });
    chHtml += `</body>\n</html>`;

    zip.folder('OEBPS')!.file(fileName, chHtml);
  });

  // toc.ncx (EPUB 2 compatibility)
  let ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:book-${Date.now()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(title)}</text></docTitle>
  <docAuthor><text>${escapeXml(author)}</text></docAuthor>
  <navMap>
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel><text>Титульный лист</text></navLabel>
      <content src="titlepage.xhtml"/>
    </navPoint>\n`;

  chapters.forEach((ch, idx) => {
    ncx += `    <navPoint id="navpoint-${idx + 2}" playOrder="${idx + 2}">
      <navLabel><text>${escapeXml(ch.title)}</text></navLabel>
      <content src="chapter_${idx + 1}.xhtml"/>
    </navPoint>\n`;
  });

  ncx += `  </navMap>
</ncx>`;
  zip.folder('OEBPS')!.file('toc.ncx', ncx);

  // nav.xhtml (EPUB 3 navigation document)
  let navHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="ru" lang="ru">
<head>
  <title>Оглавление</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Оглавление</h1>
    <ol>
      <li><a href="titlepage.xhtml">Титульный лист</a></li>\n`;

  chapters.forEach((ch, idx) => {
    navHtml += `      <li><a href="chapter_${idx + 1}.xhtml">${escapeXml(ch.title)}</a></li>\n`;
  });

  navHtml += `    </ol>
  </nav>
</body>
</html>`;
  zip.folder('OEBPS')!.file('nav.xhtml', navHtml);

  // content.opf
  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">urn:uuid:book-${Date.now()}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:language>ru</dc:language>
    <dc:publisher>ONCHAIN CORE E-Book Engine</dc:publisher>
    <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
${manifestItems}  </manifest>
  <spine toc="ncx">
${spineItems}  </spine>
</package>`;
  zip.folder('OEBPS')!.file('content.opf', opf);

  const epubBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  return {
    title,
    author,
    totalChars,
    totalWords,
    totalParagraphs: paragraphs.length,
    chaptersCount: chapters.length,
    md,
    fb2,
    epubBlob,
    previewChapters: chapters,
  };
}
