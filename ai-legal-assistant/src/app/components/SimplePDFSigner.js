'use client';
import { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function SimplePDFSigner({ signature, onClose, preloadedFile }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const iframeRef = useRef(null);

  // Load preloaded file on component mount
  useEffect(() => {
    const loadPreloadedFile = async () => {
      if (preloadedFile) {
        setIsProcessing(true);
        try {
          const arrayBuffer = await preloadedFile.arrayBuffer();
          setPdfFile(arrayBuffer);
          
          // Create URL for iframe display
          const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        } catch (error) {
          console.error('Error loading preloaded PDF:', error);
          alert('Error loading PDF file');
        } finally {
          setIsProcessing(false);
        }
      }
    };
    
    loadPreloadedFile();
  }, [preloadedFile]);

  // Load PDF file
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file');
      return;
    }

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      setPdfFile(arrayBuffer);
      
      // Create URL for iframe display
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Error loading PDF file');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle click on PDF iframe (simplified approach)
  const handlePDFClick = (event) => {
    if (!signature) {
      alert('Please create a signature first');
      return;
    }

    // Get click coordinates relative to the PDF viewer
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newSignature = {
      id: Date.now(),
      x: x,
      y: y,
      signature: signature
    };
    
    setSignatures([...signatures, newSignature]);
  };

  // Remove signature
  const removeSignature = (id) => {
    setSignatures(signatures.filter(sig => sig.id !== id));
  };

  // Download signed PDF
  const downloadSignedPDF = async () => {
    if (!pdfFile || signatures.length === 0) {
      alert('Please add at least one signature before downloading');
      return;
    }

    setIsProcessing(true);
    try {
      const pdfDoc = await PDFDocument.load(pdfFile);
      const pages = pdfDoc.getPages();
      
      // For simplicity, add all signatures to the first page
      // In a real implementation, you'd track which page each signature belongs to
      const firstPage = pages[0];
      if (firstPage) {
        const { width, height } = firstPage.getSize();
        
        for (const sig of signatures) {
          // Convert signature image to PDF image
          const signatureImage = await pdfDoc.embedPng(sig.signature);
          
          // Calculate position (adjust for PDF coordinate system)
          const pdfX = (sig.x / 800) * width; // Assuming 800px viewer width
          const pdfY = height - (sig.y / 600) * height; // Assuming 600px viewer height, flip Y
          
          // Add signature to PDF
          firstPage.drawImage(signatureImage, {
            x: Math.max(0, pdfX - 50),
            y: Math.max(0, pdfY - 25),
            width: 100,
            height: 50,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      
      // Download the signed PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'signed-document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('Signed PDF downloaded successfully!');
    } catch (error) {
      console.error('Error creating signed PDF:', error);
      alert('Error creating signed PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">📄 Simple PDF Document Signer</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {!pdfFile ? (
            // File upload section
            <div className="text-center py-12">
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload PDF Document</h3>
              <p className="text-gray-500 mb-6">Select a PDF file to add your signature</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {isProcessing ? 'Loading...' : 'Choose PDF File'}
              </button>
            </div>
          ) : (
            // PDF viewer and signing section
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">
                  Click on the PDF preview below to place signatures
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Signatures: {signatures.length}</span>
                  <button
                    onClick={downloadSignedPDF}
                    disabled={signatures.length === 0 || isProcessing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                  >
                    {isProcessing ? 'Processing...' : 'Download Signed PDF'}
                  </button>
                </div>
              </div>

              {/* PDF Display */}
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-600 mb-2">Click anywhere on the PDF preview to place your signature</p>
                <div className="relative inline-block w-full">
                  <div
                    className="relative cursor-crosshair bg-white border border-gray-300 shadow-lg"
                    onClick={handlePDFClick}
                    style={{
                      width: '100%',
                      height: '600px',
                      maxWidth: '800px',
                      margin: '0 auto'
                    }}
                  >
                    {/* PDF Preview using iframe */}
                    <iframe
                      ref={iframeRef}
                      src={pdfUrl}
                      className="w-full h-full pointer-events-none"
                      title="PDF Preview"
                    />
                    
                    {/* Render signatures overlay */}
                    {signatures.map(sig => (
                      <div
                        key={sig.id}
                        className="absolute border-2 border-blue-500 bg-white bg-opacity-90 rounded cursor-pointer shadow-lg"
                        style={{
                          left: sig.x - 50,
                          top: sig.y - 25,
                          width: 100,
                          height: 50
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSignature(sig.id);
                        }}
                        title="Click to remove signature"
                      >
                        <img
                          src={sig.signature}
                          alt="Signature"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Instructions:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Click anywhere on the PDF preview to place your signature</li>
                  <li>• Click on placed signatures to remove them</li>
                  <li>• Signatures will be added to the first page of the document</li>
                  <li>• Download the signed PDF when you're done</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
