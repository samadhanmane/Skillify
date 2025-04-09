import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CalendarIcon, ExternalLinkIcon, FileIcon, ImageIcon, Link as LinkIcon, Eye, FileText, Image, Link, Globe, Lock, Share2 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { format } from 'date-fns';
import { Certificate } from '@/lib/types';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface CertificateCardProps {
  certificate: Certificate;
  readOnly?: boolean;
}

const CertificateCard: React.FC<CertificateCardProps> = ({ certificate, readOnly = false }) => {
  const { deleteCertificate, toggleCertificatePrivacy } = useAppContext();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const [useDirectPdfUrl, setUseDirectPdfUrl] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  
  // Fix 1: Normalize properties to handle different property cases correctly
  const certificateImageUrl = certificate.certificateImage || '';
  const certificateFileUrl = certificate.certificateFile || '';
  // Handle both camelCase (frontend) and uppercase (backend) property names
  const credentialUrl = certificate.credentialUrl || certificate.credentialURL || '';
  
  // Explicit boolean checks to ensure links display properly
  const hasImage = Boolean(certificateImageUrl && certificateImageUrl.length > 0);
  const hasPdf = Boolean(certificateFileUrl && certificateFileUrl.length > 0);
  const hasUrl = Boolean(credentialUrl && credentialUrl.length > 0);
  
  // Check if certificate is public (properly handle all cases)
  const isPublic = certificate.isPublic !== false;
  
  // Fix 2: Check if certificate should be displayed (not private)
  useEffect(() => {
    if (certificate.isPublic === false) {
      console.warn(`Displaying a private certificate: ${certificate.id} - ${certificate.title}`);
    }
    
    console.log(`Certificate ${certificate.id} - ${certificate.title}:`, {
      hasImage,
      hasPdf,
      hasUrl,
      certificateImageUrl: certificateImageUrl || null,
      certificateFileUrl: certificateFileUrl || null, 
      credentialUrl: credentialUrl || null,
      fileType: certificate.fileType || 'none',
      isPublic: certificate.isPublic
    });
  }, [certificate, hasImage, hasPdf, hasUrl, certificateImageUrl, certificateFileUrl, credentialUrl]);

  // Format date from ISO string to readable format
  const formatDate = (dateString: string) => {
    try {
      if(!dateString) return 'N/A';
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Get icon based on file type for display
  const getFileTypeIcon = () => {
    if (certificate.fileType === 'pdf' || hasPdf) {
      return <FileText className="h-4 w-4" />;
    } else if (certificate.fileType === 'image' || hasImage) {
      return <Image className="h-4 w-4" />;
    } else if (certificate.fileType === 'url' || hasUrl) {
      return <Link className="h-4 w-4" />;
    } else {
      return <ExternalLinkIcon className="h-4 w-4" />; // Default
    }
  };

  // Check if any credential link is available
  const hasAnyCredential = hasUrl || hasPdf || hasImage;

  const handleViewImage = () => {
    setViewerOpen(true);
  };
  
  const handleViewPdf = () => {
    setPdfViewerOpen(true);
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
    if (!hasPdf) return '';
    
    // Get the file ID from the URL
    const fileId = extractFileIdFromUrl(certificateFileUrl);
    
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
      originalUrl: certificateFileUrl,
      fileId,
      apiBaseUrl,
      finalUrl: pdfUrl
    });
    
    return pdfUrl;
  };

  // Add function to handle sharing
  const handleShare = () => {
    // Create the share URL
    const shareUrl = `${window.location.origin}/certificate/${certificate.user?.email || 'user'}/${certificate.id}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast.success('Share link copied to clipboard');
      })
      .catch(() => {
        toast.error('Failed to copy share link');
      });
  };

  return (
    <Card className="w-full h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <div className="flex items-center gap-2">
          <CardTitle className="text-md font-bold">{certificate.title}</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-2">
                  {isPublic ? (
                    <Globe className="h-4 w-4 text-green-500" />
                  ) : (
                    <Lock className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isPublic ? 'Public credential' : 'Private credential'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {!readOnly && (
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => toggleCertificatePrivacy(certificate.id, !certificate.isPublic)}
                >
                  {certificate.isPublic ? 'Make Private' : 'Make Public'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleShare}
                  disabled={!certificate.isPublic}
                  className={!certificate.isPublic ? "text-muted-foreground cursor-not-allowed" : ""}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Certificate
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 cursor-pointer"
                  onClick={() => deleteCertificate(certificate.id)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-3">
          <div className="flex items-center gap-1">
            <Badge variant="secondary">
              {certificate.issuer || 'No issuer'}
            </Badge>
            {certificate.category && (
              <Badge variant="outline">
                {certificate.category}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarIcon className="mr-1 h-4 w-4" />
            <span>Issued: {formatDate(certificate.date || certificate.issueDate)}</span>
          </div>
          
          {certificate.expiryDate && (
            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarIcon className="mr-1 h-4 w-4" />
              <span>Expires: {formatDate(certificate.expiryDate)}</span>
            </div>
          )}
          
          {certificate.description && (
            <div className="text-sm mt-2">
              {certificate.description}
            </div>
          )}
          
          {certificate.skills && certificate.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {certificate.skills.map((skill, index) => (
                <div key={index}>
                  <Badge variant="secondary">
                    {typeof skill === 'string' ? skill : skill.name}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col items-start pt-2 mt-auto border-t">
        <div className="w-full flex flex-wrap gap-2">
          {hasUrl && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 hover:bg-blue-50" 
              onClick={() => window.open(credentialUrl, '_blank')}
            >
              <Link className="h-4 w-4 text-blue-500" />
              <span>View Link</span>
            </Button>
          )}
          
          {hasImage && (
            <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1 hover:bg-purple-50"
                >
                  <Image className="h-4 w-4 text-purple-500" />
                  <span>View Image</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
                <div className="w-full flex flex-col">
                  <div className="flex justify-center flex-1">
                    <img 
                      src={certificateImageUrl} 
                      alt={certificate.title} 
                      className="max-w-full max-h-[70vh] object-contain" 
                    />
                  </div>
                  <div className="py-2 text-center border-t mt-auto">
                    <Button
                      variant="outline"
                      onClick={() => window.open(certificateImageUrl, '_blank')}
                      className="flex items-center gap-1"
                    >
                      <Image className="h-4 w-4 text-purple-500" />
                      <span>Open in new tab</span>
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          {hasPdf && (
            <Dialog 
              open={pdfViewerOpen} 
              onOpenChange={(open) => {
                setPdfViewerOpen(open);
                if (!open) {
                  // Reset states when dialog closes
                  setPdfLoadError(false);
                  setUseDirectPdfUrl(false);
                  setIsPdfLoading(true);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1 hover:bg-red-50"
                >
                  <FileText className="h-4 w-4 text-red-500" />
                  <span>View PDF</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl h-[80vh]">
                <div className="flex flex-col h-full">
                  {isPdfLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-70 z-10">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                        <p className="text-muted-foreground">Loading PDF...</p>
                      </div>
                    </div>
                  )}
                  <iframe 
                    src={useDirectPdfUrl ? certificateFileUrl : getPdfViewUrl()} 
                    className="w-full h-full" 
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
                  <div className="py-2 text-center border-t mt-auto">
                    {pdfLoadError && (
                      <p className="text-red-500 mb-2 text-sm">
                        Having trouble viewing the PDF? Try opening it in a new tab.
                      </p>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => window.open(useDirectPdfUrl ? certificateFileUrl : getPdfViewUrl(), '_blank')}
                      className="flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Open in new tab</span>
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export { CertificateCard };
export default CertificateCard;
