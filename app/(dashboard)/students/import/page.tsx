// app/(dashboard)/students/import/page.tsx
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Download,
  FileSpreadsheet,
  Users,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  Info,
  Calendar,
  User,
  Hash,
  Phone,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

// --- Types ---
interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  totalRecords: number;
  successfulImports: number;
  failedImports: number;
  errors: ValidationError[];
  duplicateEntries: number;
}

interface StudentRecord {
  rowNumber: number;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: string;
  className?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianRelationship?: string;
  status: 'pending' | 'valid' | 'error';
  errors?: string[];
}

interface ImportStats {
  total: number;
  valid: number;
  errors: number;
  duplicates: number;
}

// --- Constants ---
const REQUIRED_FIELDS = [
  'admission_number',
  'first_name',
  'last_name',
  'date_of_birth',
  'gender',
];

const FIELD_MAPPINGS = {
  'Admission Number': 'admission_number',
  'First Name': 'first_name',
  'Last Name': 'last_name',
  'Middle Name': 'middle_name',
  'Date of Birth': 'date_of_birth',
  'Gender': 'gender',
  'Class': 'class_name',
  'Guardian Name': 'guardian_name',
  'Guardian Phone': 'guardian_phone',
  'Guardian Email': 'guardian_email',
  'Guardian Relationship': 'guardian_relationship',
  'Medical Info': 'medical_info',
  'Special Needs': 'special_needs',
  'Previous School': 'previous_school',
  'Nationality': 'nationality',
  'Religion': 'religion',
  'Birth Certificate No': 'birth_certificate_no',
  'NEMIS Number': 'nemis_number',
};

// --- CSV Template Generation ---
function downloadCSVTemplate() {
  const headers = Object.keys(FIELD_MAPPINGS);
  const sampleData = [
    'STU-2024-001',
    'John',
    'Doe',
    'Michael',
    '2015-05-15',
    'male',
    'Grade 4 A',
    'Jane Doe',
    '+254712345678',
    'jane@example.com',
    'mother',
    'Asthma - uses inhaler',
    'None',
    'St. Mary\'s Primary',
    'Kenyan',
    'Christian',
    'BC123456',
    'NEMIS-001',
  ];

  const csvContent = [
    headers.join(','),
    sampleData.join(','),
    '',
    'Instructions:',
    '1. Fill in the data for each student',
    '2. Keep the header row as is',
    '3. Date format: YYYY-MM-DD',
    '4. Gender: male, female, or other',
    '5. Class format: "Grade 4 A" or "Grade 4"',
    '6. Save as CSV file',
    '7. Maximum 500 records per file',
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `students-import-template-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


// --- Progress Component ---
interface ProgressProps {
  value: number;
  className?: string;
}

function Progress({ value, className }: ProgressProps) {
  return (
    <div className={cn('w-full bg-gray-200 rounded-full h-2', className)}>
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// --- Progress Steps ---
interface ProgressStep {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'current' | 'completed';
}

function ProgressSteps({ steps }: { steps: ProgressStep[] }) {
  return (
    <nav aria-label="Progress">
      <ol className="overflow-hidden">
        {steps.map((step, stepIdx) => (
          <li
            key={step.name}
            className={cn(
              stepIdx !== steps.length - 1 ? 'pb-10' : '',
              'relative'
            )}
          >
            {step.status === 'completed' ? (
              <>
                {stepIdx !== steps.length - 1 && (
                  <div
                    className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-green-600"
                    aria-hidden="true"
                  />
                )}
                <div className="group relative flex items-start">
                  <span className="flex h-9 items-center">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
                      <CheckCircle className="h-5 w-5 text-white" aria-hidden="true" />
                    </span>
                  </span>
                  <span className="ml-4 flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-green-600">{step.name}</span>
                    <span className="text-sm text-gray-500">{step.description}</span>
                  </span>
                </div>
              </>
            ) : step.status === 'current' ? (
              <>
                {stepIdx !== steps.length - 1 && (
                  <div
                    className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300"
                    aria-hidden="true"
                  />
                )}
                <div className="group relative flex items-start" aria-current="step">
                  <span className="flex h-9 items-center" aria-hidden="true">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-600 bg-white">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                    </span>
                  </span>
                  <span className="ml-4 flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-blue-600">{step.name}</span>
                    <span className="text-sm text-gray-500">{step.description}</span>
                  </span>
                </div>
              </>
            ) : (
              <>
                {stepIdx !== steps.length - 1 && (
                  <div
                    className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300"
                    aria-hidden="true"
                  />
                )}
                <div className="group relative flex items-start">
                  <span className="flex h-9 items-center" aria-hidden="true">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                      <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
                    </span>
                  </span>
                  <span className="ml-4 flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-gray-500">{step.name}</span>
                    <span className="text-sm text-gray-500">{step.description}</span>
                  </span>
                </div>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// --- Validation Summary Component ---
function ValidationSummary({ stats }: { stats: ImportStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Records</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Valid</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{stats.valid}</p>
            </div>
            <div className="rounded-full bg-green-100 p-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Errors</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{stats.errors}</p>
            </div>
            <div className="rounded-full bg-red-100 p-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Duplicates</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{stats.duplicates}</p>
            </div>
            <div className="rounded-full bg-amber-100 p-2">
              <RefreshCw className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Data Preview Table ---
function DataPreviewTable({ data }: { data: StudentRecord[] }) {
  if (data.length === 0) {return null;}

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Admission No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Guardian</TableHead>
                <TableHead className="w-24">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((record) => (
                <TableRow
                  key={record.rowNumber}
                  className={cn(
                    'transition-colors',
                    record.status === 'error' && 'bg-red-50',
                    record.status === 'valid' && 'bg-green-50',
                    record.status === 'pending' && 'bg-gray-50'
                  )}
                >
                  <TableCell className="font-medium">{record.rowNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Hash className="h-3 w-3 text-gray-400" />
                      <span className="font-mono text-sm">{record.admissionNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-gray-400" />
                      <span>
                        {record.firstName} {record.middleName && `${record.middleName} `}
                        {record.lastName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span>{record.dateOfBirth}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        record.gender === 'male'
                          ? 'default'
                          : record.gender === 'female'
                          ? 'success'
                          : 'warning'
                      }
                    >
                      {record.gender}
                    </Badge>
                  </TableCell>
                  <TableCell>{record.className || '-'}</TableCell>
                  <TableCell>
                    {record.guardianName ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{record.guardianName}</span>
                        </div>
                        {record.guardianPhone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{record.guardianPhone}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        record.status === 'valid'
                          ? 'success'
                          : record.status === 'error'
                          ? 'error'
                          : 'default'
                      }
                    >
                      {record.status === 'valid' ? 'Valid' : record.status === 'error' ? 'Error' : 'Pending'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Error List Component ---
function ErrorList({ errors }: { errors: ValidationError[] }) {
  if (errors.length === 0) {return null;}

  return (
    <Card>
      <CardContent className="p-0">
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Validation Errors
          </h3>
          <p className="text-sm text-gray-500">
            Please fix these errors before importing
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Row</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.map((error, index) => (
                <TableRow key={index} className="bg-red-50">
                  <TableCell className="font-medium">{error.row}</TableCell>
                  <TableCell>
                    <span className="font-medium text-red-700">{error.field}</span>
                  </TableCell>
                  <TableCell className="text-red-600">{error.message}</TableCell>
                  <TableCell className="text-gray-500">
                    {error.value ? `"${error.value}"` : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main Import Page Component ---
export default function StudentsBulkImportPage() {
  const router = useRouter();
  const { user, checkPermission } = useAuth();
  const { success, error: toastError, info } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- State ---
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importStats, setImportStats] = useState<ImportStats>({
    total: 0,
    valid: 0,
    errors: 0,
    duplicates: 0,
  });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'validate' | 'import'>('upload');
  const [progress, setProgress] = useState(0);

  // --- Permissions ---
  const canImport = checkPermission('students', 'create');

  // --- Progress Steps ---
  const steps: ProgressStep[] = [
    {
      id: 1,
      name: 'Upload File',
      description: 'Select and upload CSV/Excel file',
      status: currentStep === 'upload' ? 'current' : currentStep === 'validate' || currentStep === 'import' ? 'completed' : 'pending',
    },
    {
      id: 2,
      name: 'Validate Data',
      description: 'Check for errors and duplicates',
      status: currentStep === 'validate' ? 'current' : currentStep === 'import' ? 'completed' : 'pending',
    },
    {
      id: 3,
      name: 'Import Students',
      description: 'Create student records',
      status: currentStep === 'import' ? 'current' : 'pending',
    },
  ];

  // --- Handlers ---
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {return;}

    // Validate file type
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
      toastError('Invalid File', 'Please select a CSV or Excel file.');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toastError('File Too Large', 'File size must be less than 10MB.');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setRecords([]);
    setValidationErrors([]);
    setImportResult(null);
    setCurrentStep('upload');
  };

  const handleValidateFile = async () => {
    if (!file) {return;}

    setIsValidating(true);
    setProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'validate');

      const response = await fetch('/api/students/import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Validation failed');
      }

      const result = await response.json();
      
      if (result.success) {
        setRecords(result.data.records || []);
        setValidationErrors(result.data.errors || []);
        setImportStats({
          total: result.data.totalRecords || 0,
          valid: result.data.validRecords || 0,
          errors: result.data.errorCount || 0,
          duplicates: result.data.duplicateCount || 0,
        });
        
        setCurrentStep('validate');
        
        if (result.data.errorCount === 0) {
          success('Validation Complete', `Found ${result.data.validRecords} valid records ready for import.`);
        } else {
          info('Validation Complete', `Found ${result.data.errorCount} errors that need fixing.`);
        }
      } else {
        toastError('Validation Failed', result.message || 'Failed to validate file.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to validate file';
      toastError('Error', message);
    } finally {
      setIsValidating(false);
      setProgress(100);
    }
  };

  const handleImport = async () => {
    if (!file || importStats.errors > 0) {return;}

    setIsImporting(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'import');

      const response = await fetch('/api/students/import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();
      setImportResult(result.data);
      
      if (result.success) {
        success(
          'Import Complete',
          `Successfully imported ${result.data.successfulImports} of ${result.data.totalRecords} students.`
        );
        setCurrentStep('import');
        
        // Reset for next import
        setTimeout(() => {
          setFile(null);
          setFileName('');
          setRecords([]);
          setValidationErrors([]);
          setImportResult(null);
          setCurrentStep('upload');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 3000);
      } else {
        toastError('Import Failed', result.message || 'Failed to import students.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import students';
      toastError('Error', message);
    } finally {
      setIsImporting(false);
      setProgress(100);
    }
  };

  const handleDownloadTemplate = () => {
    downloadCSVTemplate();
    success('Template Downloaded', 'CSV template has been downloaded. Fill it with your student data.');
  };

  const handleReset = () => {
    setFile(null);
    setFileName('');
    setRecords([]);
    setValidationErrors([]);
    setImportResult(null);
    setCurrentStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // --- Render ---
  if (!user) {
    return null;
  }

  if (!canImport) {
    return (
      <div className="space-y-6">
        <PageHeader title="Bulk Import Students" />
        <Alert variant="destructive">
          You do not have permission to import students. Please contact your administrator.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Bulk Import Students"
        description="Import multiple students at once using CSV or Excel files"
      >
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadTemplate}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/students')}
          >
            Back to Students
          </Button>
        </div>
      </PageHeader>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <ProgressSteps steps={steps} />
        </CardContent>
      </Card>

      {/* Upload Section */}
      {currentStep === 'upload' && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                  <Upload className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  Upload Student Data
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Upload a CSV or Excel file with student information. Maximum 500 records per file.
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  id="file-upload"
                />
                
                {!file ? (
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Upload className="h-12 w-12 text-gray-400" />
                      <div>
                        <span className="text-blue-600 hover:text-blue-500 font-medium">
                          Click to upload
                        </span>
                        <span className="text-gray-500"> or drag and drop</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        CSV or Excel files up to 10MB
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <FileSpreadsheet className="h-12 w-12 text-green-500" />
                    <div>
                      <p className="font-medium text-gray-900">{fileName}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleReset}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleValidateFile}
                        loading={isValidating}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Validate File
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-2 flex items-center gap-2 font-medium text-gray-900">
                  <Info className="h-4 w-4 text-blue-500" />
                  File Format Requirements
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li> Required fields: Admission Number, First Name, Last Name, Date of Birth, Gender</li>
                  <li> Date format: YYYY-MM-DD (e.g., 2015-05-15)</li>
                  <li> Gender values: male, female, or other</li>
                  <li> Class format: "Grade 4 A" or just "Grade 4"</li>
                  <li> Maximum 500 records per file</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Section */}
      {currentStep === 'validate' && (
        <div className="space-y-6">
          <ValidationSummary stats={importStats} />
          
          {validationErrors.length > 0 && (
            <ErrorList errors={validationErrors} />
          )}

          {records.length > 0 && (
            <DataPreviewTable data={records} />
          )}

          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              onClick={handleReset}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Start Over
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep('upload')}
              >
                Back to Upload
              </Button>
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={importStats.errors > 0 || importStats.total === 0}
                loading={isImporting}
              >
                <Users className="mr-2 h-4 w-4" />
                Import {importStats.valid} Students
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Importing students...</span>
                <span className="text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      )}

      {/* Import Results Section */}
      {currentStep === 'import' && importResult && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  {importResult.successfulImports > 0 ? (
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  ) : (
                    <AlertCircle className="h-10 w-10 text-red-600" />
                  )}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {importResult.successfulImports > 0 ? 'Import Successful!' : 'Import Completed with Issues'}
                </h3>
                <p className="mt-2 text-gray-500">
                  {importResult.message}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <p className="text-sm font-medium text-green-600">Successful</p>
                  <p className="text-2xl font-bold text-green-700">
                    {importResult.successfulImports}
                  </p>
                </div>
                <div className="rounded-lg bg-red-50 p-4 text-center">
                  <p className="text-sm font-medium text-red-600">Failed</p>
                  <p className="text-2xl font-bold text-red-700">
                    {importResult.failedImports}
                  </p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="mt-6">
                  <h4 className="mb-3 font-medium text-gray-900">Detailed Errors:</h4>
                  <div className="space-y-2">
                    {importResult.errors.slice(0, 10).map((err, idx) => (
                      <div key={idx} className="rounded border border-red-200 bg-red-50 p-3">
                        <p className="text-sm font-medium text-red-700">
                          Row {err.row}: {err.field} - {err.message}
                        </p>
                        {err.value && (
                          <p className="mt-1 text-xs text-red-600">
                            Value: "{err.value}"
                          </p>
                        )}
                      </div>
                    ))}
                    {importResult.errors.length > 10 && (
                      <p className="text-sm text-gray-500">
                        ... and {importResult.errors.length - 10} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => router.push('/students')}
              >
                View Students
              </Button>
              <Button
                variant="primary"
                onClick={handleReset}
              >
                Import More Students
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


