import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2, Image, FileText, Link, Calendar, Award, Verified, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SharedCertificate {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  certificateImage?: string;
  certificateFile?: string;
  fileType?: string;
  skills: Array<{ name: string; category: string }>;
  isVerified: boolean;
  verificationStatus: string;
  isPublic: boolean;
  user?: {
    name: string;
    profileImage: string;
  };
}

const SharedCertificatePage: React.FC = () => {
  const { email, certificateId } = useParams<{ email: string; certificateId: string }>();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<SharedCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const [useDirectPdfUrl, setUseDirectPdfUrl] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const response = await fetch(`/api/certificates/public/${certificateId}`);
        if (!response.ok) {
          throw new Error('Certificate not found or not public');
        }
        const data = await response.json();
        
        // Check if the response has the expected structure
        if (data.success && data.certificate) {
          console.log('Received certificate data:', data.certificate);
          setCertificate(data.certificate);
        } else {
          console.error('Unexpected API response format:', data);
          throw new Error('Invalid certificate data format');
        }
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError(err instanceof Error ? err.message : 'Failed to load certificate');
        toast.error('Failed to load certificate');
      } finally {
        setLoading(false);
      }
    };

    if (email && certificateId) {
      fetchCertificate();
    }
  }, [email, certificateId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Extract file ID from Cloudinary URL for our download endpoint
  const extractFileIdFromUrl = (url: string): string => {
    try {
      console.log('Extracting file ID from URL:', url);
      
      // Check if URL is empty
      if (!url) {
        console.error('Empty URL provided to extractFileIdFromUrl');
        return '';
      }
      
      // Handle Cloudinary raw URL format
      // Example: https://res.cloudinary.com/demo/raw/upload/skillify-certificates-pdf/certificate_1234567890
      if (url.includes('/raw/upload/')) {
        const match = url.match(/\/raw\/upload\/(.+?)\/([^\/]+)$/);
        if (match && match[2]) {
          return match[2];
        }
      }
      
      // Handle regular Cloudinary image URL format
      // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/skillify-certificates/image_1234567890.jpg
      if (url.includes('/image/upload/')) {
        const match = url.match(/\/[^\/]+\/upload\/[^\/]+\/([^\/]+)\.([^\.]+)$/);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      // Fallback to simple path extraction
      // Get the filename without extension from the path
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1];
      // Remove any query parameters and file extension
      const fileId = filename.split('?')[0].split('.')[0];
      
      console.log('Extracted fileId:', fileId);
      return fileId;
    } catch (e) {
      console.error('Error extracting file ID from URL:', e);
      return '';
    }
  };
  
  // Get proper PDF URL for viewing and downloading
  const getPdfViewUrl = (): string => {
    if (!certificate?.certificateFile) return '';
    
    // Get the file ID from the URL
    const fileId = extractFileIdFromUrl(certificate.certificateFile);
    
    // Get API base URL
    let apiBaseUrl = import.meta.env.VITE_API_URL || '';
    
    // If the URL doesn't contain 'http', assume it's relative and add the host
    if (!apiBaseUrl.startsWith('http')) {
      const port = import.meta.env.VITE_BACKEND_PORT || '4000';
      apiBaseUrl = `http://localhost:${port}${apiBaseUrl}`;
    }
    
    // Remove '/api' if it exists at the end of the URL
    if (apiBaseUrl.endsWith('/api')) {
      apiBaseUrl = apiBaseUrl.slice(0, -4);
    }
    
    // Build the final URL
    const pdfUrl = `${apiBaseUrl}/api/certificates/download/${fileId}`;
    
    console.log('PDF View URL Info:', {
      originalUrl: certificate.certificateFile,
      fileId,
      apiBaseUrl,
      finalUrl: pdfUrl
    });
    
    return pdfUrl;
  };

  const shareUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300">Loading Certificate</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Please wait while we fetch the certificate details...</p>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 p-4">
        <div className="text-center max-w-md">
          <div className="inline-flex h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Certificate Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'The requested certificate could not be found or is not publicly available.'}</p>
          <Button size="lg" onClick={() => navigate('/')} className="font-medium px-6">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  // Extract image and PDF URLs from the certificate data
  const imageUrl = certificate.certificateImage;
  const pdfUrl = certificate.certificateFile;
  const credentialUrl = certificate.credentialUrl || certificate.credentialURL;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 py-12 px-4 shared-certificate-bg">
      <div className="container mx-auto max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800 rounded-xl shared-certificate-card relative">
            {imageUrl && (
              <div className="w-full h-40 bg-gradient-to-r from-blue-500 to-purple-600 relative overflow-hidden">
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-20 blur-sm" 
                  style={{ backgroundImage: `url(${imageUrl})` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-center text-white"
                  >
                    <Award className="h-12 w-12 mx-auto mb-2 drop-shadow-md" />
                    <h2 className="text-2xl font-bold drop-shadow-md">Certificate of Achievement</h2>
                  </motion.div>
                </div>
              </div>
            )}
            
            <CardHeader className="dark:bg-card relative">
              <div className="flex justify-between items-start mb-1">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <CardTitle className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                    {certificate.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 mt-1 text-lg">
                    Issued by {certificate.issuer}
                  </CardDescription>
                </motion.div>
                <motion.div 
                  className="flex space-x-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  {certificate.isVerified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60 flex items-center gap-1 px-3 py-1">
                      <Verified className="h-3.5 w-3.5 mr-1" />
                      Verified
                    </Badge>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="rounded-full h-9 w-9 p-0 flex items-center justify-center" 
                    onClick={shareUrl}
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="sr-only">Share</span>
                  </Button>
                </motion.div>
              </div>
            </CardHeader>
            
            <CardContent className="dark:bg-card">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
                    <div>
                      <h3 className="font-medium text-gray-700 dark:text-gray-300">Issue Date</h3>
                      <p className="text-gray-600 dark:text-gray-400">{formatDate(certificate.issueDate)}</p>
                    </div>
                  </div>

                  {certificate.expiryDate && (
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-orange-500 dark:text-orange-400 mr-2" />
                      <div>
                        <h3 className="font-medium text-gray-700 dark:text-gray-300">Expiry Date</h3>
                        <p className="text-gray-600 dark:text-gray-400">{formatDate(certificate.expiryDate)}</p>
                      </div>
                    </div>
                  )}

                  {certificate.credentialId && (
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                      <div>
                        <h3 className="font-medium text-gray-700 dark:text-gray-300">Credential ID</h3>
                        <p className="text-gray-600 dark:text-gray-400">{certificate.credentialId}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {certificate.user && (
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                      {certificate.user.profileImage ? (
                        <img src={certificate.user.profileImage} alt={certificate.user.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700 dark:text-gray-300">Earned By</h3>
                      <p className="text-gray-600 dark:text-gray-400">{certificate.user.name}</p>
                    </div>
                  </div>
                )}
              </motion.div>

              {certificate.skills && certificate.skills.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="mb-6"
                >
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Skills Demonstrated</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {certificate.skills.map((skill, index) => (
                      <motion.div
                        key={skill.name || skill}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + index * 0.05, duration: 0.3 }}
                      >
                        <Badge 
                          variant="secondary" 
                          className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30 dark:hover:bg-blue-900/40 animation-pulse"
                        >
                          {skill.name || skill}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="flex flex-wrap gap-3 mt-8"
              >
                {imageUrl && (
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                    onClick={() => setShowImage(true)}
                  >
                    <Image className="h-4 w-4" />
                    <span>View Certificate</span>
                  </Button>
                )}
                {pdfUrl && (
                  <Button 
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 shadow-sm transition-all duration-200 flex items-center gap-2"
                    onClick={() => setShowPdf(true)}
                  >
                    <FileText className="h-4 w-4" />
                    <span>View PDF</span>
                  </Button>
                )}
                {credentialUrl && (
                  <Button 
                    variant="outline"
                    className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30 shadow-sm transition-all duration-200 flex items-center gap-2"
                    asChild
                  >
                    <a href={credentialUrl} target="_blank" rel="noopener noreferrer">
                      <Link className="h-4 w-4" />
                      <span>Verify Credential</span>
                    </a>
                  </Button>
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-6 text-center text-gray-500 dark:text-gray-400 text-sm"
        >
          <p>This certificate is shared publicly through Skillify. <a href="/" className="text-blue-600 dark:text-blue-400 hover:underline">Learn more</a></p>
        </motion.div>
      </div>

      <Dialog open={showImage} onOpenChange={setShowImage}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden dark:bg-card dark:border-gray-700">
          <div className="w-full flex flex-col">
            <div className="flex justify-center flex-1 bg-gray-50 dark:bg-gray-800/50 p-4">
              {imageUrl && (
                <motion.img 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  src={imageUrl} 
                  alt={certificate.title} 
                  className="max-w-full max-h-[75vh] object-contain shadow-lg rounded-md" 
                />
              )}
            </div>
            <div className="py-3 px-4 text-right border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <h3 className="font-medium">{certificate.title}</h3>
                <p>Issued by {certificate.issuer}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.open(imageUrl, '_blank')}
                className="flex items-center gap-1 dark:border-gray-600"
              >
                <Image className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                <span>Open in new tab</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={showPdf} 
        onOpenChange={(open) => {
          setShowPdf(open);
          if (!open) {
            // Reset states when dialog closes
            setPdfLoadError(false);
            setUseDirectPdfUrl(false);
            setIsPdfLoading(true);
          }
        }}
      >
        <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden dark:bg-slate-800 dark:border-gray-700 dialog-content-pdf">
          <div className="flex flex-col h-full pdf-viewer">
            {isPdfLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10 dark:bg-slate-800 dark:bg-opacity-90 pdf-loading-spinner">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-500 mb-4 loading-spinner"></div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Loading PDF document...</p>
                </div>
              </div>
            )}
            <iframe 
              src={useDirectPdfUrl ? pdfUrl : getPdfViewUrl()} 
              className="w-full h-full dark:border-gray-700 pdf-viewer-iframe" 
              title={certificate.title} 
              onError={(e) => {
                console.error('PDF iframe loading error:', e);
                setPdfLoadError(true);
                setIsPdfLoading(false);
                // Try using direct URL on first error
                if (!useDirectPdfUrl) {
                  console.log('Switching to direct URL for PDF viewing');
                  setUseDirectPdfUrl(true);
                  setIsPdfLoading(true);
                }
              }}
              onLoad={() => {
                console.log(`PDF loaded successfully using ${useDirectPdfUrl ? 'direct URL' : 'download endpoint'}`);
                setPdfLoadError(false);
                setIsPdfLoading(false);
              }}
            />
            <div className="py-3 px-4 text-right border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <h3 className="font-medium">{certificate.title}</h3>
                <p>Issued by {certificate.issuer}</p>
              </div>
              {pdfLoadError && (
                <p className="text-red-500 text-sm dark:text-red-400 pdf-error-message mr-3">
                  Having trouble viewing the PDF?
                </p>
              )}
              <Button
                variant="outline"
                onClick={() => window.open(useDirectPdfUrl ? pdfUrl : getPdfViewUrl(), '_blank')}
                className="flex items-center gap-1 dark:border-gray-600 pdf-open-button"
              >
                <FileText className="h-4 w-4 dark:text-blue-400" />
                <span>Open in new tab</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SharedCertificatePage; 