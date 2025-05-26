import React, { useState } from 'react';
import apiClient from '@/lib/axios';
import { Upload, FileUp, AlertCircle, FileCheck, Search, BarChart } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { useToast } from '../ui/use-toast';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "../ui/alert";

interface BulkVerificationProps {
  maxFiles?: number;
}

interface CertificateFile {
  id: string;
  file: File;
  preview: string;
  metadata: {
    title: string;
    issuer: string;
    issueDate: string;
    credentialID: string;
    holderName: string;
  };
  status: 'pending' | 'processing' | 'verified' | 'rejected' | 'error';
  result?: any;
}

const BulkVerification: React.FC<BulkVerificationProps> = ({ maxFiles = 10 }) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<CertificateFile[]>([]);
  const [checkIssuerDatabase, setCheckIssuerDatabase] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const newFiles = Array.from(e.target.files).slice(0, maxFiles - files.length);
    
    if (newFiles.length + files.length > maxFiles) {
      toast({
        title: "Maximum files exceeded",
        description: `You can only upload a maximum of ${maxFiles} files at once.`,
        variant: "destructive"
      });
    }
    
    // Process each file
    const filesPromises = newFiles.map((file) => {
      return new Promise<CertificateFile>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = e.target?.result as string;
          resolve({
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            preview,
            metadata: {
              title: '',
              issuer: '',
              issueDate: '',
              credentialID: '',
              holderName: ''
            },
            status: 'pending'
          });
        };
        reader.readAsDataURL(file);
      });
    });
    
    Promise.all(filesPromises).then((newCertFiles) => {
      setFiles((prev) => [...prev, ...newCertFiles]);
    });
    
    // Reset the file input
    e.target.value = '';
  };
  
  const removeFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
  };
  
  const updateMetadata = (id: string, field: string, value: string) => {
    setFiles(files.map(file => {
      if (file.id === id) {
        return {
          ...file,
          metadata: {
            ...file.metadata,
            [field]: value
          }
        };
      }
      return file;
    }));
  };
  
  const startBulkVerification = async () => {
    if (files.length === 0) {
      toast({
        title: "No files to verify",
        description: "Please upload at least one certificate image.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    setResults(null);
    
    // Mark all files as processing
    setFiles(files.map(file => ({ ...file, status: 'processing' })));
    
    try {
      // Prepare the request data
      const requestData = {
        certificates: files.map(file => ({
          id: file.id,
          imageUrl: file.preview,
          metadata: file.metadata
        })),
        checkIssuerDatabase
      };
      
      // Send bulk verification request
      const response = await apiClient.post('/ml/bulk-verify', requestData);
      
      if (response.data.success) {
        // Update files with results
        const updatedFiles = files.map(file => {
          const result = response.data.results.find((r: any) => r.id === file.id);
          if (result) {
            if (result.success) {
              return {
                ...file,
                status: result.verificationResult.aiDecision === 'verified' 
                  ? 'verified' 
                  : (result.verificationResult.aiDecision === 'rejected' ? 'rejected' : 'pending'),
                result
              };
            } else {
              return { ...file, status: 'error', result: { message: result.message } };
            }
          }
          return file;
        });
        
        setFiles(updatedFiles);
        setResults(response.data.summary);
        
        toast({
          title: "Verification Complete",
          description: `Successfully processed ${response.data.summary.total} certificates.`,
        });
      } else {
        toast({
          title: "Verification Failed",
          description: response.data.message || "An error occurred during bulk verification.",
          variant: "destructive"
        });
        
        // Mark all files as pending again
        setFiles(files.map(file => ({ ...file, status: 'pending' })));
      }
    } catch (error) {
      console.error('Bulk verification error:', error);
      toast({
        title: "Error",
        description: "An error occurred during verification.",
        variant: "destructive"
      });
      
      // Mark all files as pending again
      setFiles(files.map(file => ({ ...file, status: 'pending' })));
    } finally {
      setIsProcessing(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500">Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'error':
        return <Badge className="bg-rose-500">Error</Badge>;
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>;
    }
  };
  
  const getStatusSummary = () => {
    if (!results) return null;
    
    const { total, verified, rejected, needsReview, failed, averageConfidence, securityLevelCounts } = results;
    
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Verification Summary
          </CardTitle>
          <CardDescription>
            Summary of bulk verification results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{verified}</div>
              <div className="text-sm text-gray-500">Verified</div>
            </div>
            <div className="bg-slate-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{rejected}</div>
              <div className="text-sm text-gray-500">Rejected</div>
            </div>
            <div className="bg-slate-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{needsReview}</div>
              <div className="text-sm text-gray-500">Needs Review</div>
            </div>
            <div className="bg-slate-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{failed}</div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Average Confidence</Label>
              <span className="font-medium">{averageConfidence}%</span>
            </div>
            <Progress value={averageConfidence} className="h-2" />
          </div>
          
          {securityLevelCounts && Object.keys(securityLevelCounts).length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-2">Security Level Distribution</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(securityLevelCounts).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                      <span className="text-xs capitalize">{level.replace('-', ' ')}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Bulk Certificate Verification
          </CardTitle>
          <CardDescription>
            Upload multiple certificate images for AI verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File upload area */}
          <div 
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => document.getElementById('bulk-file-upload')?.click()}
          >
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <h3 className="text-sm font-semibold">Upload Certificate Images</h3>
            <p className="mt-1 text-xs text-gray-500">
              Drag and drop or click to select up to {maxFiles} files (PNG, JPG)
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {files.length} of {maxFiles} files selected
            </p>
            <input
              id="bulk-file-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFilesSelect}
              disabled={isProcessing}
            />
          </div>
          
          {/* Verification options */}
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="issuerCheck"
              checked={checkIssuerDatabase}
              onCheckedChange={setCheckIssuerDatabase}
              disabled={isProcessing}
            />
            <Label htmlFor="issuerCheck" className="cursor-pointer">
              Verify against issuer databases when available
            </Label>
          </div>
          
          {/* File list */}
          {files.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2">Certificates to Verify</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto p-1">
                {files.map((cert) => (
                  <div 
                    key={cert.id} 
                    className="flex flex-col sm:flex-row gap-4 p-3 border rounded-lg relative"
                  >
                    {/* Preview image */}
                    <div className="w-full sm:w-24 h-24 flex-shrink-0">
                      <img 
                        src={cert.preview} 
                        alt="Certificate preview" 
                        className="w-full h-full object-contain rounded"
                      />
                    </div>
                    
                    {/* Status badge */}
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(cert.status)}
                    </div>
                    
                    {/* Metadata */}
                    <div className="flex-1 space-y-2">
                      <div className="text-sm font-medium">{cert.file.name}</div>
                      
                      {cert.status === 'error' && cert.result?.message && (
                        <Alert variant="destructive" className="p-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            {cert.result.message}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {cert.status === 'pending' && (
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            placeholder="Certificate title" 
                            className="text-xs p-1 border rounded"
                            value={cert.metadata.title}
                            onChange={(e) => updateMetadata(cert.id, 'title', e.target.value)}
                            disabled={isProcessing}
                          />
                          <input 
                            type="text" 
                            placeholder="Issuer" 
                            className="text-xs p-1 border rounded"
                            value={cert.metadata.issuer}
                            onChange={(e) => updateMetadata(cert.id, 'issuer', e.target.value)}
                            disabled={isProcessing}
                          />
                          <input 
                            type="text" 
                            placeholder="Credential ID (Optional but recommended)" 
                            className="text-xs p-1 border rounded"
                            value={cert.metadata.credentialID}
                            onChange={(e) => updateMetadata(cert.id, 'credentialID', e.target.value)}
                            disabled={isProcessing}
                          />
                          <input 
                            type="text" 
                            placeholder="Holder name" 
                            className="text-xs p-1 border rounded"
                            value={cert.metadata.holderName}
                            onChange={(e) => updateMetadata(cert.id, 'holderName', e.target.value)}
                            disabled={isProcessing}
                          />
                        </div>
                      )}
                      
                      {cert.status !== 'pending' && cert.status !== 'processing' && cert.status !== 'error' && cert.result && (
                        <div className="text-xs text-gray-600">
                          <div><strong>Confidence:</strong> {cert.result.verificationResult.confidenceScore}%</div>
                          <div><strong>Security Level:</strong> {cert.result.certificateSecurityLevel}</div>
                        </div>
                      )}
                      
                      {cert.status === 'processing' && (
                        <Progress value={undefined} className="h-1.5" />
                      )}
                      
                      {/* Remove button */}
                      <div className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs text-red-500 hover:text-red-700 p-0 h-auto"
                          onClick={() => removeFile(cert.id)}
                          disabled={isProcessing}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setFiles([])}
            disabled={files.length === 0 || isProcessing}
          >
            Clear All
          </Button>
          <Button 
            onClick={startBulkVerification}
            disabled={files.length === 0 || isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Processing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Verify {files.length} Certificate{files.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Results summary */}
      {results && getStatusSummary()}
      
      {/* Detailed results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Verification Results</CardTitle>
            <CardDescription>
              Detailed results for all certificates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Verification details for {files.length} certificate{files.length !== 1 ? 's' : ''}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Security Level</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell>
                      {getStatusBadge(cert.status)}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <img 
                          src={cert.preview} 
                          alt="Certificate" 
                          className="w-8 h-8 object-cover rounded" 
                        />
                        <span className="text-xs truncate max-w-[120px]">{cert.file.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {cert.result?.verificationResult?.confidenceScore 
                        ? `${cert.result.verificationResult.confidenceScore}%` 
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {cert.result?.certificateSecurityLevel 
                        ? cert.result.certificateSecurityLevel.replace('-', ' ') 
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {cert.result?.verificationSummary ? (
                        <p className="text-xs max-w-[250px] text-gray-500 truncate">
                          {cert.result.verificationSummary}
                        </p>
                      ) : (
                        cert.result?.message || '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkVerification; 