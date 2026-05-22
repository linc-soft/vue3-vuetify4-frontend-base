/**
 * PDF 打印工具函数
 * 使用 jsPDF + jspdf-autotable 生成 PDF 文件
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * PDF 配置选项
 */
export interface PdfOptions {
  /** 文档标题 */
  title: string
  /** 文件名（不含扩展名） */
  filename?: string
  /** 页面方向 */
  orientation?: 'portrait' | 'landscape'
}

/**
 * 表格列定义
 */
export interface TableColumn<T> {
  /** 列标题 */
  header: string
  /** 数据字段 key */
  key: keyof T | string
  /** 列宽度（mm） */
  width?: number
  /** 自定义渲染函数 */
  render?: (item: T) => string | number
}

/**
 * 详情字段定义
 */
export interface DetailField<T> {
  /** 字段标签 */
  label: string
  /** 字段 key */
  key: keyof T | string
  /** 自定义渲染函数 */
  render?: (data: T) => string | number | null | undefined
}

// 字体缓存
let fontLoaded = false
let fontLoading = false
const FONT_NAME = 'chinese-font'

/**
 * 加载中文字体
 */
async function loadChineseFont(): Promise<string | null> {
  if (fontLoaded) return null
  if (fontLoading) {
    // 等待加载完成
    await new Promise(resolve => setTimeout(resolve, 500))
    return null
  }

  fontLoading = true

  // 尝试从本地加载字体
  const fontUrls = ['/fonts/NotoSansSC-Regular.ttf', '/fonts/simhei.ttf']

  for (const url of fontUrls) {
    try {
      const response = await fetch(url)
      if (!response.ok) continue

      const arrayBuffer = await response.arrayBuffer()
      // 转换为 base64
      let binary = ''
      const bytes = new Uint8Array(arrayBuffer)
      for (const byte of bytes) {
        binary += String.fromCodePoint(byte)
      }
      const base64 = btoa(binary)

      fontLoaded = true
      fontLoading = false
      return base64
    } catch {
      continue
    }
  }

  fontLoading = false

  // 未找到字体，输出警告
  console.warn('未找到中文字体文件，PDF 可能无法正确显示中文/日文')
  console.warn('请下载字体文件并放到 public/fonts/ 目录')
  console.warn('推荐字体: Noto Sans SC (https://fonts.google.com/noto/specimen/Noto+Sans+SC)')

  return null
}

/**
 * 创建 PDF 文档
 */
async function createPdfDocument(options: PdfOptions): Promise<jsPDF> {
  const { orientation = 'portrait' } = options

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  // 加载中文字体
  const fontBase64 = await loadChineseFont()

  if (fontBase64) {
    try {
      // 添加字体到虚拟文件系统
      doc.addFileToVFS('chinese-font.ttf', fontBase64)
      // 注册字体（normal 和 bold 都使用同一个字体文件）
      doc.addFont('chinese-font.ttf', FONT_NAME, 'normal')
      doc.addFont('chinese-font.ttf', FONT_NAME, 'bold')
      // 设置字体
      doc.setFont(FONT_NAME)
    } catch {
      console.warn('字体加载失败，使用默认字体')
      doc.setFont('helvetica')
    }
  } else {
    doc.setFont('helvetica')
  }

  return doc
}

/**
 * 设置字体
 */
function setFont(doc: jsPDF, bold = false) {
  if (fontLoaded) {
    try {
      doc.setFont(FONT_NAME, bold ? 'bold' : 'normal')
    } catch {
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
    }
  } else {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
  }
}

/**
 * 添加页眉
 */
function addHeader(doc: jsPDF, title: string) {
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(18)
  setFont(doc, true)
  doc.text(title, pageWidth / 2, 15, { align: 'center' })

  doc.setFontSize(10)
  setFont(doc, false)
  const now = new Date()
  const dateStr = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  doc.text(`生成时间: ${dateStr}`, 14, 25)
}

/**
 * 添加页脚
 */
function addFooters(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.setTextColor(150)
    setFont(doc, false)
    doc.text(`第 ${i} 页 / 共 ${pageCount} 页`, pageWidth / 2, pageHeight - 10, { align: 'center' })
  }
}

/**
 * 生成列表 PDF
 */
export async function generateListPdf<T extends Record<string, unknown>>(
  options: PdfOptions,
  columns: TableColumn<T>[],
  data: T[],
): Promise<void> {
  const doc = await createPdfDocument(options)

  addHeader(doc, options.title)

  const headers = columns.map(col => col.header)
  const body = data.map(item =>
    columns.map(col => {
      if (col.render) {
        const rendered = col.render(item)
        return rendered == null ? '-' : String(rendered)
      }
      const value = item[col.key as keyof T]
      return value == null ? '-' : String(value)
    }),
  )

  autoTable(doc, {
    startY: 30,
    head: [headers],
    body,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    margin: { top: 30, bottom: 25 },
    didDrawPage: () => {
      const pageInfo = doc.getCurrentPageInfo()
      if (pageInfo.pageNumber > 1) {
        doc.setFontSize(14)
        setFont(doc, true)
        doc.text(options.title, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' })
      }
    },
  })

  addFooters(doc)

  const filename = options.filename || options.title
  doc.save(`${filename}_${Date.now()}.pdf`)
}

/**
 * 生成详情 PDF
 */
export async function generateDetailPdf<T extends Record<string, unknown>>(
  options: PdfOptions,
  fields: DetailField<T>[],
  data: T,
): Promise<void> {
  const doc = await createPdfDocument(options)

  addHeader(doc, options.title)

  const body = fields.map(field => {
    let value: string
    if (field.render) {
      const rendered = field.render(data)
      value = rendered == null ? '-' : String(rendered)
    } else {
      const rawValue = data[field.key as keyof T]
      value = rawValue == null ? '-' : String(rawValue)
    }
    return [field.label, value]
  })

  autoTable(doc, {
    startY: 35,
    body,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', fillColor: [245, 245, 245] },
      1: { cellWidth: 'auto' },
    },
    margin: { top: 35, bottom: 25 },
  })

  addFooters(doc)

  const filename = options.filename || options.title
  doc.save(`${filename}_${Date.now()}.pdf`)
}

/**
 * 生成带分组的列表 PDF
 */
export async function generateGroupedListPdf<T extends Record<string, unknown>>(
  options: PdfOptions,
  columns: TableColumn<T>[],
  groups: { name: string; items: T[] }[],
): Promise<void> {
  const doc = await createPdfDocument(options)

  addHeader(doc, options.title)

  let finalY = 30

  for (const group of groups) {
    if (finalY > 220) {
      doc.addPage()
      finalY = 20
      doc.setFontSize(14)
      setFont(doc, true)
      doc.text(options.title, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' })
    }

    doc.setFontSize(11)
    setFont(doc, true)
    doc.text(`${group.name} (${group.items.length})`, 14, finalY + 5)

    const headers = columns.map(col => col.header)
    const body = group.items.map(item =>
      columns.map(col => {
        if (col.render) {
          const rendered = col.render(item)
          return rendered == null ? '-' : String(rendered)
        }
        const value = item[col.key as keyof T]
        return value == null ? '-' : String(value)
      }),
    )

    autoTable(doc, {
      startY: finalY + 8,
      head: [headers],
      body,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      margin: { top: 30, bottom: 25 },
    })

    finalY = (doc as any).lastAutoTable?.finalY || finalY + 30
  }

  addFooters(doc)

  const filename = options.filename || options.title
  doc.save(`${filename}_${Date.now()}.pdf`)
}
