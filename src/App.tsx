import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface FileWithPreview extends File {
  preview?: string;
}

interface PDFPreview {
  original?: string;
  compressed?: string;
}

function App() {
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [compressedFile, setCompressedFile] = useState<Blob | null>(null);
  const [compressedPreview, setCompressedPreview] = useState<string>('');
  const [pdfPreviews, setPdfPreviews] = useState<PDFPreview>({});
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string>('');
  const [compressionLevel, setCompressionLevel] = useState<number>(1);
  const [customSize, setCustomSize] = useState<string>('');
  const [pdfQuality, setPdfQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [useCustomSize, setUseCustomSize] = useState<boolean>(false);
  const [sizeUnit, setSizeUnit] = useState<'KB' | 'MB'>('KB');
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const compressedCanvasRef = useRef<HTMLCanvasElement>(null);

  const generatePDFPreview = async (pdfBlob: Blob, canvasRef: React.RefObject<HTMLCanvasElement>) => {
    try {
      const url = URL.createObjectURL(pdfBlob);
      const pdf = await pdfjsLib.getDocument(url).promise;
      const page = await pdf.getPage(1);
      
      const canvas = canvasRef.current;
      if (!canvas) return;

      const viewport = page.getViewport({ scale: 1.0 });
      const context = canvas.getContext('2d');
      if (!context) return;

      // Calculate scale to fit within preview area (e.g., 400px width)
      const desiredWidth = 400;
      const scale = desiredWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      await page.render({
        canvasContext: context,
        viewport: scaledViewport,
      }).promise;

      URL.revokeObjectURL(url);
      return canvas.toDataURL();
    } catch (err) {
      console.error('Error generating PDF preview:', err);
      return null;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError('');
    const selectedFile = acceptedFiles[0];
    
    if (!selectedFile) return;
    
    // Check file size (5MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Upgrade to Pro to compress larger files');
      return;
    }

    const fileWithPreview = Object.assign(selectedFile, {
      preview: URL.createObjectURL(selectedFile)
    });
    
    setFile(fileWithPreview);
    setCompressedFile(null);
    setCompressedPreview('');
    setPdfPreviews({});
    setCustomSize('500');

    // Generate PDF preview if it's a PDF
    if (selectedFile.type === 'application/pdf') {
      const preview = await generatePDFPreview(selectedFile, originalCanvasRef);
      if (preview) {
        setPdfPreviews(prev => ({ ...prev, original: preview }));
      }
    }
  }, []);

  useEffect(() => {
    // Cleanup previews when component unmounts
    return () => {
      if (file?.preview) URL.revokeObjectURL(file.preview);
      if (compressedPreview) URL.revokeObjectURL(compressedPreview);
    };
  }, [file]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf']
    }
  });

  const validateAndSetCustomSize = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;

    const maxSizeInKB = 5 * 1024; // 5MB in KB
    const sizeInKB = sizeUnit === 'MB' ? numValue * 1024 : numValue;

    if (sizeInKB > maxSizeInKB) {
      setError('Free tier limited to 5MB. Upgrade to Pro for larger files.');
      return;
    }

    setError('');
    setCustomSize(value);
  };

  const getTargetSizeInMB = () => {
    if (!useCustomSize) return compressionLevel;
    
    const numValue = parseFloat(customSize);
    if (isNaN(numValue)) return 1;

    return sizeUnit === 'KB' ? numValue / 1024 : numValue;
  };

  const compressFile = async () => {
    if (!file) return;
    
    try {
      setIsCompressing(true);
      setError('');

      const targetSizeInMB = getTargetSizeInMB();

      if (file.type.startsWith('image/')) {
        // Compress image
        const options = {
          maxSizeMB: targetSizeInMB,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        };
        
        const compressedImage = await imageCompression(file, options);
        setCompressedFile(compressedImage);
        setCompressedPreview(URL.createObjectURL(compressedImage));
      } else if (file.type === 'application/pdf') {
        // Compress PDF
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        // PDF quality settings
        const qualitySettings = {
          low: { useObjectStreams: false, objectsPerTick: 10 },
          medium: { useObjectStreams: false, objectsPerTick: 20 },
          high: { useObjectStreams: false, objectsPerTick: 30 }
        };
        
        const compressedPdfBytes = await pdfDoc.save(qualitySettings[pdfQuality]);
        const compressedPdfBlob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
        setCompressedFile(compressedPdfBlob);

        // Generate preview for compressed PDF
        const preview = await generatePDFPreview(compressedPdfBlob, compressedCanvasRef);
        if (preview) {
          setPdfPreviews(prev => ({ ...prev, compressed: preview }));
        }
      }
    } catch (err) {
      setError('Error compressing file. Please try again.');
      console.error(err);
    } finally {
      setIsCompressing(false);
    }
  };

  const downloadCompressedFile = () => {
    if (!compressedFile || !file) return;
    
    const url = URL.createObjectURL(compressedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed-${file.name}`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getCompressionRatio = () => {
    if (!file || !compressedFile) return null;
    const ratio = ((file.size - compressedFile.size) / file.size * 100).toFixed(1);
    return ratio;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">File Compressor</h1>
          <p className="text-gray-600 mb-4">Compress your images and PDFs while maintaining quality. Supports JPG, PNG, WebP, and PDF formats.</p>
        </header>

        <section className="bg-white p-6 rounded-lg shadow-md" role="main">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
            role="button"
            tabIndex={0}
            aria-label="Drag and drop file upload area"
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-blue-500">Drop the file here...</p>
            ) : (
              <p className="text-gray-500">
                Drag & drop a file here, or click to select<br />
                <span className="text-sm">(JPG, PNG, WebP, or PDF)</span>
              </p>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {file && !error && (
            <div className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Original File Preview */}
                <div className="border rounded-lg p-4" role="region" aria-label="Original file preview">
                  <h3 className="font-medium text-gray-900 mb-2">Original File</h3>
                  {file.type.startsWith('image/') ? (
                    <img
                      src={file.preview}
                      alt="Original"
                      className="w-full h-48 object-contain mb-3"
                    />
                  ) : file.type === 'application/pdf' && (
                    <div className="mb-3">
                      <canvas ref={originalCanvasRef} className="max-w-full" />
                      {pdfPreviews.original && (
                        <img src={pdfPreviews.original} alt="PDF Preview" className="hidden" />
                      )}
                    </div>
                  )}
                  <p className="text-sm text-gray-500">Name: {file.name}</p>
                  <p className="text-sm text-gray-500">Size: {formatSize(file.size)}</p>
                  <p className="text-sm text-gray-500">Type: {file.type}</p>
                </div>

                {/* Compressed File Preview */}
                {compressedFile && (
                  <div className="border rounded-lg p-4" role="region" aria-label="Compressed file preview">
                    <h3 className="font-medium text-gray-900 mb-2">Compressed File</h3>
                    {file.type.startsWith('image/') && compressedPreview ? (
                      <img
                        src={compressedPreview}
                        alt="Compressed"
                        className="w-full h-48 object-contain mb-3"
                      />
                    ) : file.type === 'application/pdf' && (
                      <div className="mb-3">
                        <canvas ref={compressedCanvasRef} className="max-w-full" />
                        {pdfPreviews.compressed && (
                          <img src={pdfPreviews.compressed} alt="Compressed PDF Preview" className="hidden" />
                        )}
                      </div>
                    )}
                    <p className="text-sm text-gray-500">
                      Size: {formatSize(compressedFile.size)}
                    </p>
                    <p className="text-sm font-medium text-green-600">
                      Reduced by {getCompressionRatio()}%
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-4 mb-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      checked={!useCustomSize}
                      onChange={() => setUseCustomSize(false)}
                    />
                    <span className="ml-2">Use slider</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      checked={useCustomSize}
                      onChange={() => setUseCustomSize(true)}
                    />
                    <span className="ml-2">Specify size</span>
                  </label>
                </div>

                {file.type.startsWith('image/') ? (
                  useCustomSize ? (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Target File Size
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <input
                            type="number"
                            min="1"
                            max={sizeUnit === 'KB' ? file.size / 1024 : file.size / (1024 * 1024)}
                            value={customSize}
                            onChange={(e) => validateAndSetCustomSize(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder={`Enter target size in ${sizeUnit}`}
                          />
                        </div>
                        <select
                          value={sizeUnit}
                          onChange={(e) => setSizeUnit(e.target.value as 'KB' | 'MB')}
                          className="px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                          <option value="KB">KB</option>
                          <option value="MB">MB</option>
                        </select>
                      </div>
                      <p className="text-sm text-gray-500">
                        Original size: {formatSize(file.size)}
                      </p>
                      {error && (
                        <p className="text-sm text-red-600">{error}</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Target Size (MB): {compressionLevel}
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max={Math.min(5, file.size / (1024 * 1024))}
                        step="0.1"
                        value={compressionLevel}
                        onChange={(e) => setCompressionLevel(parseFloat(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>
                  )
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PDF Compression Quality
                    </label>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as const).map((quality) => (
                        <button
                          key={quality}
                          onClick={() => setPdfQuality(quality)}
                          className={`flex-1 py-2 px-3 text-sm rounded-md capitalize
                            ${pdfQuality === quality
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                          {quality}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={compressFile}
                  disabled={isCompressing}
                  className={`mt-4 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white
                    ${isCompressing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                >
                  {isCompressing ? 'Compressing...' : 'Compress File'}
                </button>
              </div>
            </div>
          )}

          {compressedFile && (
            <div className="mt-4">
              <button
                onClick={downloadCompressedFile}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white
                  bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Download Compressed File
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default App; 