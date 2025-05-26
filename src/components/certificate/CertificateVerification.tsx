import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import apiClient from '@/lib/axios';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  AlertCircleIcon, 
  ClockIcon, 
  ArrowUpIcon, 
  LinkIcon, 
  FileIcon, 
  SearchIcon,
  DownloadIcon,
  RotateCwIcon
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppContext } from '@/context/AppContext';

interface VerificationStatus {
  id: string;
  issuer: string;
  certificateName: string;
  holderName: string;
  issuedDate: string;
  expiryDate?: string;
  status: 'verified' | 'rejected' | 'pending';
  verificationMethod: string;
  verificationDate: string;
  verificationId: string;
  message?: string;
  blockchain?: {
    network: string;
    transactionId: string;
    blockNumber: number;
  };
}

const CertificateVerification = () => {
  const { checkForBadges } = useAppContext();
  
  const [verificationMethod, setVerificationMethod] = useState<'upload' | 'link' | 'id'>('upload');
  const [link, setLink] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<VerificationStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('upload');

  const handleVerify = async () => {
    setVerifying(true);
    setProgress(0);
    setError(null);
    
    try {
      let response;
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);
      
      switch (verificationMethod) {
        case 'upload':
          if (files.length === 0) {
            setError('Please upload at least one certificate file');
            clearInterval(progressInterval);
            setVerifying(false);
            return;
          }
          
          const formData = new FormData();
          files.forEach(file => {
            formData.append('certificates', file);
          });
          
          response = await apiClient.post('/certificates/verify/files', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          break;
          
        case 'link':
          if (!link) {
            setError('Please enter a valid certificate link');
            clearInterval(progressInterval);
            setVerifying(false);
            return;
          }
          
          response = await apiClient.post('/certificates/verify/link', { link });
          break;
          
        case 'id':
          if (!verificationId) {
            setError('Please enter a valid verification ID');
            clearInterval(progressInterval);
            setVerifying(false);
            return;
          }
          
          response = await apiClient.get(`/certificates/verify/${verificationId}`);
          break;
      }
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (response?.data?.success) {
        setResults(response.data.results);
        
        // Check if any certificates were verified and check for badges
        if (response.data.results.some(result => result.status === 'verified')) {
          try {
            // Check for new badges after verification
            if (checkForBadges) {
              await checkForBadges();
            }
          } catch (badgeError) {
            console.error('Error checking for badges:', badgeError);
          }
        }
      } else {
        setError(response?.data?.message || 'Verification failed');
      }
    } catch (err) {
      console.error('Certificate verification error:', err);
      setError('Error during verification process. Please try again.');
    } finally {
      setVerifying(false);
    }
  };
  
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles]);
    }
  });
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const resetVerification = () => {
    setFiles([]);
    setLink('');
    setVerificationId('');
    setResults([]);
    setError(null);
    setProgress(0);
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-amber-500" />;
      default:
        return <AlertCircleIcon className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="success">Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Invalid</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Certificate Verification</CardTitle>
          <CardDescription>
            Verify the authenticity of certificates through our secure verification system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" onClick={() => setVerificationMethod('upload')}>
                Upload Files
              </TabsTrigger>
              <TabsTrigger value="link" onClick={() => setVerificationMethod('link')}>
                Certificate Link
              </TabsTrigger>
              <TabsTrigger value="id" onClick={() => setVerificationMethod('id')}>
                Verification ID
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="pt-4">
              <div
                {...getRootProps()}
                className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <input {...getInputProps()} />
                <ArrowUpIcon className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-center">
                  Drag & drop certificate files here, or click to select files
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: PDF, PNG, JPG (max 5MB each)
                </p>
              </div>
              
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-medium">Selected Files ({files.length})</h3>
                  <div className="max-h-40 overflow-y-auto">
                    {files.map((file, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between bg-muted/40 p-2 rounded-md text-sm"
                      >
                        <div className="flex items-center">
                          <FileIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">{file.name}</span>
                          <span className="ml-2 text-muted-foreground text-xs">
                            ({(file.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-8 w-8 p-0"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="link" className="pt-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="certificate-link" className="text-sm font-medium">
                    Certificate Link
                  </label>
                  <div className="mt-1 flex">
                    <div className="relative w-full">
                      <Input
                        id="certificate-link"
                        placeholder="https://example.com/certificate/123"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="pl-9"
                      />
                      <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the URL provided by the certificate issuer
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="id" className="pt-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="verification-id" className="text-sm font-medium">
                    Verification ID
                  </label>
                  <div className="mt-1 flex">
                    <div className="relative w-full">
                      <Input
                        id="verification-id"
                        placeholder="e.g. CERT-1234-ABCD-5678"
                        value={verificationId}
                        onChange={(e) => setVerificationId(e.target.value)}
                        className="pl-9"
                      />
                      <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the unique verification ID printed on the certificate
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={resetVerification}
            disabled={verifying}
          >
            Reset
          </Button>
          <Button 
            onClick={handleVerify}
            disabled={verifying}
          >
            {verifying ? (
              <>
                <RotateCwIcon className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : 'Verify Certificate'}
          </Button>
        </CardFooter>
      </Card>
      
      {verifying && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Verification in Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {progress < 100 
                ? "Processing certificate data..." 
                : "Finalizing verification results..."}
            </p>
          </CardContent>
        </Card>
      )}
      
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Verification Results</CardTitle>
            <CardDescription>
              {results.length} certificate{results.length > 1 ? 's' : ''} processed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="border rounded-md overflow-hidden">
                  <div className="flex justify-between items-center p-4 bg-muted/30">
                    <div className="flex items-center">
                      {getStatusIcon(result.status)}
                      <h3 className="font-medium ml-2">{result.certificateName}</h3>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Certificate Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Holder</span>
                            <span>{result.holderName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Issuer</span>
                            <span>{result.issuer}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Issued Date</span>
                            <span>{new Date(result.issuedDate).toLocaleDateString()}</span>
                          </div>
                          {result.expiryDate && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Expiry Date</span>
                              <span>{new Date(result.expiryDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Verification Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Method</span>
                            <span>{result.verificationMethod}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Date</span>
                            <span>{new Date(result.verificationDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Verification ID</span>
                            <div className="flex items-center">
                              <span className="truncate max-w-[120px]">{result.verificationId}</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      <DownloadIcon className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Download verification report</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {result.message && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium mb-1">Additional Information</h4>
                          <p className="text-sm">{result.message}</p>
                        </div>
                      </>
                    )}
                    
                    {result.blockchain && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium mb-1">Blockchain Verification</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Network</span>
                              <span>{result.blockchain.network}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Transaction ID</span>
                              <div className="flex items-center">
                                <span className="truncate max-w-[120px]">{result.blockchain.transactionId}</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6"
                                        onClick={() => window.open(`https://etherscan.io/tx/${result.blockchain.transactionId}`, '_blank')}
                                      >
                                        <LinkIcon className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View on blockchain explorer</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Block Number</span>
                              <span>{result.blockchain.blockNumber}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CertificateVerification; 