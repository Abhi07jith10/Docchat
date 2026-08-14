import { useState } from 'react'
import { Document, Page } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import '../pdfWorker'

function PDFViewer({ fileUrl, currentPage }) {
  const [numPages, setNumPages] = useState(null)

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-100 flex flex-col items-center p-4">
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<p className="text-sm text-gray-500 mt-8">Loading PDF...</p>}
        error={<p className="text-sm text-red-500 mt-8">Failed to load PDF.</p>}
      >
        {numPages &&
          Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <div
              key={pageNum}
              className="mb-4"
              id={`pdf-page-${pageNum}`}
              style={
                pageNum === currentPage
                  ? { boxShadow: '0 0 0 3px #3b82f6', borderRadius: '4px' }
                  : { boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }
              }
            >
              <Page pageNumber={pageNum} width={380} />
            </div>
          ))}
      </Document>
    </div>
  )
}

export default PDFViewer