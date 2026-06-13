'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Input, Textarea } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { cn, formatDate } from '@/lib/utils';
import { Shield, FileText, CheckCircle, XCircle, Clock, Upload, Eye, Download, Loader2, AlertTriangle } from 'lucide-react';

const verificationTypes: SelectOption[] = [
  { value: 'BUSINESS_REGISTRATION', label: 'Business Registration' },
  { value: 'TAX_ID', label: 'Tax ID Verification' },
  { value: 'PROOF_OF_FUNDS', label: 'Proof of Funds' },
  { value: 'IDENTITY', label: 'Identity Verification' },
  { value: 'DOMAIN_OWNERSHIP', label: 'Domain Ownership' },
  { value: 'FINANCIAL_STATEMENTS', label: 'Financial Statements' },
];

const statusConfig = {
  PENDING: { label: 'Pending', variant: 'warning' as const, icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', variant: 'info' as const, icon: Clock },
  APPROVED: { label: 'Approved', variant: 'success' as const, icon: CheckCircle },
  REJECTED: { label: 'Rejected', variant: 'danger' as const, icon: XCircle },
  EXPIRED: { label: 'Expired', variant: 'default' as const, icon: AlertTriangle },
} as const;

interface VerificationRequest {
  id: string;
  orgId: string;
  orgName: string;
  type: string;
  status: string;
  documents: Array<{ name: string; url: string }>;
  notes?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export default function VerificationPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<VerificationRequest | null>(null);
  const [newRequest, setNewRequest] = useState({ type: '', notes: '' });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      // Mock data for now
      setRequests([
        {
          id: '1',
          orgId: 'org-1',
          orgName: 'Acme Corp',
          type: 'BUSINESS_REGISTRATION',
          status: 'UNDER_REVIEW',
          documents: [
            { name: 'certificate.pdf', url: '/docs/certificate.pdf' },
            { name: 'license.pdf', url: '/docs/license.pdf' },
          ],
          createdAt: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          orgId: 'org-2',
          orgName: 'TechStart Inc',
          type: 'IDENTITY',
          status: 'PENDING',
          documents: [
            { name: 'id-front.jpg', url: '/docs/id-front.jpg' },
            { name: 'id-back.jpg', url: '/docs/id-back.jpg' },
          ],
          notes: 'Founder verification',
          createdAt: '2024-01-20T14:30:00Z',
        },
        {
          id: '3',
          orgId: 'org-3',
          orgName: 'Global Trade LLC',
          type: 'TAX_ID',
          status: 'APPROVED',
          documents: [
            { name: 'tax-cert.pdf', url: '/docs/tax-cert.pdf' },
          ],
          reviewedAt: '2024-01-18T09:00:00Z',
          reviewedBy: 'Admin User',
          createdAt: '2024-01-10T11:00:00Z',
        },
      ]);
    } catch {
      console.error('Failed to fetch verification requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    // In real app, call API
    setRequests(requests.map(r => r.id === id ? { ...r, status, reviewedAt: new Date().toISOString(), reviewedBy: 'Current User' } : r));
  };

  const columns = [
    { key: 'orgName', header: 'Organization' },
    { key: 'type', header: 'Type', render: (row: VerificationRequest) => (
      <Badge variant="primary" dot>{verificationTypes.find(t => t.value === row.type)?.label || row.type}</Badge>
    )},
    { key: 'status', header: 'Status', render: (row: VerificationRequest) => {
      const cfg = statusConfig[row.status as keyof typeof statusConfig] || statusConfig.PENDING;
      const Icon = cfg.icon;
      return (
        <Badge variant={cfg.variant} dot>
          <Icon className="w-3 h-3 mr-1" />
          {cfg.label}
        </Badge>
      );
    }},
    { key: 'documents', header: 'Documents', render: (row: VerificationRequest) => (
      <div className="flex flex-wrap gap-1">
        {row.documents.map((doc, i) => (
          <Badge key={i} variant="default" className="cursor-pointer hover:bg-nexus-100 dark:hover:bg-nexus-800">
            <FileText className="w-3 h-3 mr-1" />
            {doc.name}
          </Badge>
        ))}
      </div>
    )},
    { key: 'createdAt', header: 'Requested', render: (row: VerificationRequest) => formatDate(row.createdAt) },
    { key: 'actions', header: 'Actions', render: (row: VerificationRequest) => {
      if (row.status === 'APPROVED' || row.status === 'REJECTED') {
        return (
          <Badge variant="default" size="sm">
            <Eye className="w-3 h-3 mr-1" />
            View
          </Badge>
        );
      }
      return (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="primary" onClick={() => handleStatusChange(row.id, 'APPROVED')}>
            <CheckCircle className="w-3 h-3 mr-1" /> Approve
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleStatusChange(row.id, 'REJECTED')}>
            <XCircle className="w-3 h-3 mr-1" /> Reject
          </Button>
        </div>
      );
    }},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-nexus-900 dark:text-nexus-100">Verification Center</h1>
          <p className="text-nexus-500 dark:text-nexus-400 mt-1">Review and manage verification requests</p>
        </div>
        <Button onClick={() => { setEditingRequest({ id: '', orgId: '', orgName: '', type: '', status: 'PENDING', documents: [], createdAt: new Date().toISOString() }); setShowModal(true); }}>
          <Upload className="w-4 h-4 mr-2" />
          Submit Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Requests', value: requests.length, icon: Shield },
          { label: 'Pending', value: requests.filter(r => r.status === 'PENDING').length, icon: Clock },
          { label: 'Under Review', value: requests.filter(r => r.status === 'UNDER_REVIEW').length, icon: Shield },
          { label: 'Approved', value: requests.filter(r => r.status === 'APPROVED').length, icon: CheckCircle },
        ].map((stat, i) => (
          <Card key={i} variant="outlined" className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-hydra-100 dark:bg-hydra-900/30 flex items-center justify-center">
              <stat.icon className="w-6 h-6 text-hydra-600 dark:text-hydra-400" />
            </div>
            <div>
              <p className="text-sm text-nexus-500 dark:text-nexus-400">{stat.label}</p>
              <p className="text-2xl font-bold text-nexus-900 dark:text-nexus-100">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Requests Table */}
      <Card variant="outlined" padding="none">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-hydra-600 mx-auto" />
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={requests}
              keyField="id"
              hoverable
              emptyMessage="No verification requests yet"
            />
          </>
        )}
      </Card>

      {/* Submit Request Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRequest?.id ? 'Edit Verification Request' : 'Submit Verification Request'}
        description="Upload documents and provide details for verification"
      >
        <form className="space-y-4">
          <Select
            label="Verification Type"
            options={verificationTypes}
            value={newRequest.type}
            onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value })}
          />
          <Textarea
            label="Notes"
            placeholder="Additional context for reviewers..."
            rows={4}
            value={newRequest.notes}
            onChange={(e) => setNewRequest({ ...newRequest, notes: e.target.value })}
          />
          <div className="border-2 border-dashed border-nexus-300 dark:border-nexus-700 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 mx-auto text-nexus-400 mb-2" />
            <p className="text-sm text-nexus-500 dark:text-nexus-400">Drag & drop documents or click to browse</p>
            <p className="text-xs text-nexus-400 dark:text-nexus-500 mt-1">PDF, JPG, PNG up to 10MB each</p>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={() => { setShowModal(false); }}>
              {editingRequest?.id ? 'Update Request' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}