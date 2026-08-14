import { useState } from 'react'
import { uploadDocument } from '../api'

function DocumentUpload({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported')
      return
    }

    setError('')
    setUploading(true)

    try {
      const response = await uploadDocument(file, file.name)
      onUploadSuccess(response.data.document)
    } catch (err) {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <p className="text-gray-600 mb-3">Upload a PDF to start chatting</p>
      <label className="inline-block bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700">
        {uploading ? 'Uploading...' : 'Choose PDF'}
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
    </div>
  )
}

export default DocumentUpload