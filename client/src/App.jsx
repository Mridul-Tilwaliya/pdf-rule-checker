import { useState } from 'react'
import './App.css'

function App() {
  const [pdfFile, setPdfFile] = useState(null)
  const [rules, setRules] = useState(['', '', ''])
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
      setError(null)
    } else {
      setError('Please upload a valid PDF file')
      setPdfFile(null)
    }
  }

  const handleRuleChange = (index, value) => {
    const newRules = [...rules]
    newRules[index] = value
    setRules(newRules)
  }

  const handleCheck = async () => {
    if (!pdfFile) {
      setError('Please upload a PDF file')
      return
    }

    const validRules = rules.filter(rule => rule.trim().length > 0)
    if (validRules.length === 0) {
      setError('Please enter at least one rule')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const formData = new FormData()
      formData.append('pdf', pdfFile)
      formData.append('rules', JSON.stringify(validRules))

      const response = await fetch('/api/check-pdf', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to check PDF')
      }

      const data = await response.json()
      setResults(data.results)
    } catch (err) {
      setError(err.message || 'An error occurred while checking the PDF')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    return status === 'pass' ? '#10b981' : '#ef4444'
  }

  const getStatusBg = (status) => {
    return status === 'pass' ? '#d1fae5' : '#fee2e2'
  }

  return (
    <div className="app">
      <div className="container">
        <header>
          <h1>📄 PDF Rule Checker</h1>
          <p>Upload a PDF and define rules to check against it</p>
        </header>

        <div className="upload-section">
          <div className="upload-box">
            <input
              type="file"
              id="pdf-upload"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={loading}
            />
            <label htmlFor="pdf-upload" className="upload-label">
              {pdfFile ? `📎 ${pdfFile.name}` : '📤 Upload PDF'}
            </label>
          </div>
        </div>

        <div className="rules-section">
          <h2>Enter 3 Rules</h2>
          {rules.map((rule, index) => (
            <div key={index} className="rule-input-group">
              <label>Rule {index + 1}</label>
              <input
                type="text"
                placeholder={`e.g., "The document must have a purpose section."`}
                value={rule}
                onChange={(e) => handleRuleChange(index, e.target.value)}
                disabled={loading}
              />
            </div>
          ))}
        </div>

        <button
          className="check-button"
          onClick={handleCheck}
          disabled={loading || !pdfFile}
        >
          {loading ? '🔄 Checking...' : '✅ Check Document'}
        </button>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {results && (
          <div className="results-section">
            <h2>Results</h2>
            <div className="results-table">
              <table>
                <thead>
                  <tr>
                    <th>Rule</th>
                    <th>Status</th>
                    <th>Evidence</th>
                    <th>Reasoning</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index}>
                      <td className="rule-cell">{result.rule}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: getStatusBg(result.status),
                            color: getStatusColor(result.status)
                          }}
                        >
                          {result.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="evidence-cell">{result.evidence}</td>
                      <td className="reasoning-cell">{result.reasoning}</td>
                      <td>
                        <div className="confidence-bar">
                          <div
                            className="confidence-fill"
                            style={{
                              width: `${result.confidence}%`,
                              backgroundColor: getStatusColor(result.status)
                            }}
                          />
                          <span className="confidence-text">{result.confidence}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

