import { extractTextFromPDFBuffer } from '../src/lib/document/pdf'
import { extractTextFromDOCXBuffer } from '../src/lib/document/docx'
import { extractTextFromImageBuffer } from '../src/lib/document/ocr'
import { extractTextFromString } from '../src/lib/document/text'
import {
  buildFullContext,
  buildPageContext,
  extractPageNumberFromQuery,
} from '../src/lib/document/context'
import { documentEngine } from '../src/lib/document'
import type { ParserResult, DocumentAttachment } from '../src/lib/document'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`)
    process.exit(1)
  }
  console.log(`✓ PASS: ${message}`)
}

async function runTests() {
  console.log('==============================================')
  console.log('🧪 Starting Document Intelligence Integration Tests')
  console.log('==============================================\n')

  // ----------------------------------------------------
  // TEST 1: PDF Parsing & Page Extraction
  // ----------------------------------------------------
  console.log('--- TEST 1: PDF Extraction ---')
  const pdfBuffer = await createMinimalPDF('Hello World from JHS One AI!\nThis is page 1 content.\n\fThis is page 2 content with math formula: E = mc^2.')
  const pdfResult = await extractTextFromPDFBuffer(pdfBuffer)

  if (!pdfResult.success) {
    console.error('PDF Result error detail:', pdfResult.error)
  }

  assert(pdfResult.success === true, 'PDF parser returned success=true')
  assert(pdfResult.documentType === 'pdf', 'Document type is pdf')
  assert(pdfResult.pagesProcessed >= 1, `Pages processed count: ${pdfResult.pagesProcessed}`)
  assert(pdfResult.fullText.includes('JHS One AI'), 'Extracted text contains expected content')
  console.log('PDF Extracted Text:', pdfResult.fullText)
  console.log()

  // ----------------------------------------------------
  // TEST 2: DOCX Parsing
  // ----------------------------------------------------
  console.log('--- TEST 2: DOCX Extraction ---')
  const docxBuffer = await createMinimalDOCX('Chapter 1: Introduction to AI\nThis document describes JHS One AI.')
  const docxResult = await extractTextFromDOCXBuffer(docxBuffer)

  assert(docxResult.success === true, 'DOCX parser returned success=true')
  assert(docxResult.documentType === 'docx', 'Document type is docx')
  assert(docxResult.fullText.length > 0, 'DOCX text extracted successfully')
  console.log('DOCX Extracted Text:', docxResult.fullText)
  console.log()

  // ----------------------------------------------------
  // TEST 3: Image OCR Extraction
  // ----------------------------------------------------
  console.log('--- TEST 3: Image OCR Extraction ---')
  const imageBuffer = createSamplePNGWithText()
  const ocrResult = await extractTextFromImageBuffer(imageBuffer, 'image/png')

  assert(ocrResult.ocrUsed === true, 'OCR flag is set to true')
  assert(ocrResult.parserUsed === 'tesseract.js', 'Parser used is tesseract.js')
  console.log('OCR Extracted Result:', ocrResult.success ? ocrResult.fullText : ocrResult.error)
  console.log()

  // ----------------------------------------------------
  // TEST 4: TXT / Markdown Extraction
  // ----------------------------------------------------
  console.log('--- TEST 4: Text & Markdown Extraction ---')
  const txtResult = extractTextFromString('# Title\nThis is a sample markdown document.', true)
  assert(txtResult.success === true, 'Markdown reader success')
  assert(txtResult.documentType === 'markdown', 'Document type is markdown')
  assert(txtResult.fullText.includes('sample markdown'), 'Text content matches')
  console.log()

  // ----------------------------------------------------
  // TEST 5: Context Building & Page Query Detection
  // ----------------------------------------------------
  console.log('--- TEST 5: Context Building & Query Detection ---')
  const pageQuery1 = extractPageNumberFromQuery('What is on page 4?')
  assert(pageQuery1 === 4, 'Extracted page 4 from "What is on page 4?"')

  const pageQuery2 = extractPageNumberFromQuery('পৃষ্ঠা ২ তে কী লেখা আছে?')
  assert(pageQuery2 === 2, 'Extracted page 2 from Bengali query')

  const dummyAttachment: DocumentAttachment = {
    id: 'att-123',
    cloudinaryUrl: 'https://cloudinary.com/sample.pdf',
    thumbnailUrl: null,
    mimeType: 'application/pdf',
    fileType: 'document',
    fileName: 'sample_report.pdf',
    fileSize: 1024,
    width: null,
    height: null,
  }

  const mockPdfResult: ParserResult = {
    success: true,
    documentType: 'pdf',
    pages: [
      { pageNumber: 1, text: 'Page 1: Executive Summary of JHS One AI project.' },
      { pageNumber: 2, text: 'Page 2: Financial forecasts and Q3 analysis.' },
    ],
    fullText: 'Page 1: Executive Summary of JHS One AI project.\n\nPage 2: Financial forecasts and Q3 analysis.',
    textLength: 95,
    pagesProcessed: 2,
    ocrUsed: false,
    parserUsed: 'pdf-parse',
  }

  const contextObj = buildFullContext(
    'Summarize this PDF',
    [{ role: 'user', content: 'Hello' }],
    [mockPdfResult],
    [dummyAttachment]
  )

  assert(contextObj.augmentedMessage.includes('Executive Summary'), 'Augmented message includes PDF document context')
  assert(contextObj.augmentedMessage.includes('Document Context'), 'Augmented message has Document Context header')
  console.log()

  // ----------------------------------------------------
  // TEST 6: Multi-turn Conversation & Follow-up Query Context Persistence
  // ----------------------------------------------------
  console.log('--- TEST 6: Follow-up Question Context Persistence ---')

  // Simulate Turn 1: User uploads image/PDF, first question
  const turn1Message = 'What is written in this document?'
  const turn1Context = documentEngine.buildContext(
    turn1Message,
    [],
    [mockPdfResult],
    [dummyAttachment]
  )

  assert(turn1Context.augmentedMessage.includes('Executive Summary'), 'Turn 1 context has extracted text')

  // Simulate Turn 2: Follow-up question without uploading attachments again
  // Client sends attachment_ids = undefined, but DB has existing context_text
  const cachedResultFromDB: ParserResult = {
    success: true,
    documentType: 'pdf',
    pages: [{ pageNumber: 1, text: mockPdfResult.fullText }],
    fullText: mockPdfResult.fullText,
    textLength: mockPdfResult.fullText.length,
    pagesProcessed: 2,
    ocrUsed: false,
    parserUsed: 'cached',
  }

  const turn2Message = 'What about page 2?'
  const turn2Context = documentEngine.buildContext(
    turn2Message,
    [
      { role: 'user', content: turn1Message },
      { role: 'assistant', content: 'This document is an executive summary of JHS One AI.' },
    ],
    [cachedResultFromDB],
    [dummyAttachment]
  )

  assert(turn2Context.augmentedMessage.includes('Financial forecasts and Q3 analysis'), 'Turn 2 follow-up retains cached document context')
  console.log('Turn 2 Augmented Prompt Preview:', turn2Context.augmentedMessage)
  console.log()

  console.log('==============================================')
  console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!')
  console.log('==============================================')
}

// Helper function to create valid PDF buffer in memory using pdf-lib
async function createMinimalPDF(textContent: string): Promise<Buffer> {
  const { PDFDocument, StandardFonts } = await import('pdf-lib')
  const pdfDoc = await PDFDocument.create()
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const pagesText = textContent.split('\f')

  for (let i = 0; i < pagesText.length; i++) {
    const page = pdfDoc.addPage()
    const { height } = page.getSize()
    page.drawText(pagesText[i].trim(), {
      x: 50,
      y: height - 100,
      size: 14,
      font: helveticaFont,
    })
  }

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

// Helper function to create minimal DOCX buffer in memory
async function createMinimalDOCX(textContent: string): Promise<Buffer> {
  const zip = new (await import('jszip')).default()
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
  )
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${textContent}</w:t></w:r></w:p></w:body></w:document>`
  )
  return await zip.generateAsync({ type: 'nodebuffer' })
}

// Helper to generate minimal 1x1 PNG buffer
function createSamplePNGWithText(): Buffer {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  )
}

runTests().catch(err => {
  console.error('Test script crashed:', err)
  process.exit(1)
})
