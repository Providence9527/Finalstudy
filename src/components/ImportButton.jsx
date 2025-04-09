// src/components/ImportButton.jsx
import { useState, useRef, useEffect } from 'react'

const ImportButton = ({ onImportLocal, onImportURL }) => {
  const [showOptions, setShowOptions] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [fileKey, setFileKey] = useState(Date.now())
  const wrapperRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target) &&
        !triggerRef.current.contains(event.target)
      ) {
        setShowOptions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      onImportLocal(file)
      setFileKey(Date.now())
    }
  }

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onImportURL(urlInput.trim())
      setUrlInput('')
      setShowOptions(false)
    }
  }

  return (
    <div className="import-controls" ref={wrapperRef}>
      <button
        ref={triggerRef}
        className="import-toggle"
        onClick={() => setShowOptions(!showOptions)}
      >
        📥 导入书籍
      </button>

      {showOptions && (
        <div className="import-options">
          <label className="import-option file-upload">
            <span>📂 选择本地文件</span>
            <input
              key={fileKey}
              type="file"
              accept=".pdf,.epub,.txt,.docx"
              onChange={handleFileChange}
            />
            <small>支持格式: PDF, EPUB, TXT, DOCX</small>
          </label>

          <div className="divider">或</div>

          <div className="import-option url-import">
            <input
              type="url"
              placeholder="https://example.com/book.pdf"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
            <button
              className="url-submit"
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim()}
            >
              导入URL
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImportButton