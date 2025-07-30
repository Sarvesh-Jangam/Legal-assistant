'use client';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import ClauseAnalysisResults from '../components/ClauseAnalysisResults';

export default function ClauseAnalysis() {
  const [analysisMode, setAnalysisMode] = useState('extract'); // extract, compare, text
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e, fileNumber) => {
    const file = e.target.files[0];
    if (fileNumber === 1) {
      setFile1(file);
    } else {
      setFile2(file);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      let url = '/api/ai/extract-clauses';

      if (analysisMode === 'extract') {
        if (!file1) throw new Error('Please upload a file for extraction.');
        formData.append('file', file1);
      } else if (analysisMode === 'compare') {
        if (!file1 || !file2) throw new Error('Please upload two files for comparison.');
        formData.append('file1', file1);
        formData.append('file2', file2);
        url = '/api/ai/compare-clauses';
      } else if (analysisMode === 'text') {
        if (!textInput.trim()) throw new Error('Please enter text for analysis.');
        const response = await fetch('/api/ai/extract-clauses-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ document_text: textInput }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Analysis failed');
        setAnalysisResult(data);
        setLoading(false);
        return;
      }

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysisResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Clause Analysis</h1>

          {/* Analysis Mode Selection */}
          <div className="flex space-x-4 mb-6">
            <button onClick={() => setAnalysisMode('extract')} className={`px-4 py-2 rounded-lg ${analysisMode === 'extract' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
              Extract Clauses
            </button>
            <button onClick={() => setAnalysisMode('compare')} className={`px-4 py-2 rounded-lg ${analysisMode === 'compare' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
              Compare Documents
            </button>
            <button onClick={() => setAnalysisMode('text')} className={`px-4 py-2 rounded-lg ${analysisMode === 'text' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
              Analyze Text
            </button>
          </div>

          {/* File/Text Inputs */}
          <div className="space-y-4 mb-6">
            {analysisMode === 'extract' && (
              <input type="file" onChange={(e) => handleFileChange(e, 1)} className="w-full p-2 border rounded-lg" />
            )}
            {analysisMode === 'compare' && (
              <div className="flex space-x-4">
                <input type="file" onChange={(e) => handleFileChange(e, 1)} className="w-full p-2 border rounded-lg" />
                <input type="file" onChange={(e) => handleFileChange(e, 2)} className="w-full p-2 border rounded-lg" />
              </div>
            )}
            {analysisMode === 'text' && (
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your legal text here..."
                className="w-full p-2 border rounded-lg h-40"
              />
            )}
          </div>

          {/* Analyze Button */}
          <button onClick={handleAnalyze} disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400">
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>

          {/* Error Message */}
          {error && <p className="text-red-500 mt-4">{error}</p>}

          {/* Analysis Result */}
          {analysisResult && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Analysis Result</h2>
              {analysisMode === 'extract' && (
                <div className="space-y-4">
                  <p><strong>Summary:</strong> {analysisResult.summary}</p>
                  <p><strong>Total Clauses:</strong> {analysisResult.total_clauses}</p>
                  <div className="space-y-2">
                    {analysisResult.clauses.map((clause, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h3 className="font-bold">{clause.type}</h3>
                        <p><strong>Risk:</strong> {clause.risk_level}</p>
                        <p><strong>Text:</strong> {clause.text}</p>
                        <p><strong>Analysis:</strong> {clause.analysis}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {analysisMode === 'compare' && (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-lg mb-2">{analysisResult.document1.filename}</h3>
                    <p>Total Clauses: {analysisResult.document1.total_clauses}</p>
                    {/* Display clauses for doc 1 */}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{analysisResult.document2.filename}</h3>
                    <p>Total Clauses: {analysisResult.document2.total_clauses}</p>
                    {/* Display clauses for doc 2 */}
                  </div>
                  <div className="col-span-2">
                    <h3 className="font-bold text-lg mb-2">Comparison</h3>
                    <p>{analysisResult.comparison.comparison_analysis}</p>
                  </div>
                </div>
              )}
               {analysisMode === 'text' && (
                <div className="space-y-4">
                  <p><strong>Summary:</strong> {analysisResult.summary}</p>
                  <p><strong>Total Clauses:</strong> {analysisResult.total_clauses}</p>
                  <div className="space-y-2">
                    {analysisResult.clauses.map((clause, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h3 className="font-bold">{clause.type}</h3>
                        <p><strong>Risk:</strong> {clause.risk_level}</p>
                        <p><strong>Text:</strong> {clause.text}</p>
                        <p><strong>Analysis:</strong> {clause.analysis}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

