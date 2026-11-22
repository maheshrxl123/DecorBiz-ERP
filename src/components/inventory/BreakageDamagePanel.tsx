import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import { Button } from '../ui/Button';
import { SearchInput, Select, FormField, TextInput, CurrencyInput } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../context/ToastContext';
import { safeToFixed, parseFirestoreTimestamp } from '../../lib/formatting/formatters';

interface BreakageLogEntry {
  id: string;
  productName: string;
  sku: string;
  shadeLotCode: string;
  damagedBoxes: number;
  damagedPieces: number;
  reason: 'transit_shatter' | 'loading_drop' | 'corner_chipped' | 'factory_defect' | 'handling_crack';
  estimatedLossValue: number;
  claimStatus: 'pending' | 'approved' | 'claimed' | 'rejected';
  godownBay: string;
  reportedBy: string;
  reportedAt: string;
  notes: string;
}

const EMPTY_FORM = {
  productName: '',
  sku: '',
  shadeLotCode: '',
  damagedBoxes: 1,
  damagedPieces: 0,
  reason: 'corner_chipped' as BreakageLogEntry['reason'],
  estimatedLossValue: 0,
  claimStatus: 'pending' as BreakageLogEntry['claimStatus'],
  godownBay: '',
  notes: '',
};

export const BreakageDamagePanel: React.FC = () => {
  const { organization } = useWorkspace();
  const { user } = useAuth();
  const { success, warning, error: toastError } = useToast();

  const [logs, setLogs] = useState<BreakageLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReason, setSelectedReason] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLog, setNewLog] = useState(EMPTY_FORM);

  const loadBreakageLogs = useCallback(async () => {
    if (!organization?.id) {
      setLogs([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const colRef = collection(db, 'organizations', organization.id, 'breakageLogs');
      let snap;
      try {
        snap = await getDocs(query(colRef, orderBy('createdAt', 'desc')));
      } catch {
        snap = await getDocs(colRef);
      }

      const loaded: BreakageLogEntry[] = snap.docs.map((d) => {
        const data = d.data() as Record<string, any>;
        const dt = parseFirestoreTimestamp(data.createdAt);
        return {
          id: d.id,
          productName: data.productName || '',
          sku: data.sku || '',
          shadeLotCode: data.shadeLotCode || '',
          damagedBoxes: Number(data.damagedBoxes) || 0,
          damagedPieces: Number(data.damagedPieces) || 0,
          reason: data.reason || 'transit_shatter',
          estimatedLossValue: Number(data.estimatedLossValue) || 0,
          claimStatus: data.claimStatus || 'pending',
          godownBay: data.godownBay || '',
          reportedBy: data.reportedBy || '',
          reportedAt: data.reportedAt || (dt ? dt.toISOString() : new Date().toISOString()),
          notes: data.notes || '',
        };
      });
      setLogs(loaded);
    } catch (err: any) {
      console.error('Failed to load breakage logs from Firestore:', err);
      toastError(err?.message || 'Failed to load breakage logs from Cloud Firestore.');
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id, toastError]);

  useEffect(() => {
    loadBreakageLogs();
  }, [loadBreakageLogs]);

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id) {
      warning('Active organization is required to save breakage logs.', 'Workspace Required');
      return;
    }
    if (!newLog.productName.trim()) {
      warning('Please enter tile product name / SKU.', 'Validation Error');
      return;
    }

    setIsSaving(true);
    try {
      const docId = `DMG-${Date.now().toString().slice(-6)}`;
      const entry: BreakageLogEntry = {
        id: docId,
        productName: newLog.productName.trim(),
        sku: newLog.sku.trim(),
        shadeLotCode: newLog.shadeLotCode.trim(),
        damagedBoxes: Number(newLog.damagedBoxes) || 0,
        damagedPieces: Number(newLog.damagedPieces) || 0,
        reason: newLog.reason,
        estimatedLossValue: Number(newLog.estimatedLossValue) || 0,
        claimStatus: newLog.claimStatus,
        godownBay: newLog.godownBay.trim(),
        reportedBy: user?.displayName || user?.email || 'Staff',
        reportedAt: new Date().toISOString(),
        notes: newLog.notes.trim(),
      };

      await setDoc(doc(db, 'organizations', organization.id, 'breakageLogs', docId), {
        ...entry,
        organizationId: organization.id,
        reportedByUid: user?.uid || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setLogs((prev) => [entry, ...prev]);
      success(`Logged breakage report #${entry.id} for ${entry.damagedBoxes} box(es).`, 'Damage Recorded');
      setIsModalOpen(false);
      setNewLog(EMPTY_FORM);
    } catch (err: any) {
      console.error('Failed to save breakage log:', err);
      toastError(err?.message || 'Failed to record breakage report in Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      log.productName.toLowerCase().includes(q) ||
      log.sku.toLowerCase().includes(q) ||
      log.shadeLotCode.toLowerCase().includes(q);
    const matchesReason = selectedReason === 'all' || log.reason === selectedReason;
    const matchesStatus = selectedStatus === 'all' || log.claimStatus === selectedStatus;
    return matchesSearch && matchesReason && matchesStatus;
  });

  const totalDamagedBoxes = logs.reduce((sum, l) => sum + l.damagedBoxes, 0);
  const totalLossValue = logs.reduce((sum, l) => sum + l.estimatedLossValue, 0);
  const pendingClaimsCount = logs.filter((l) => l.claimStatus === 'pending').length;

  const getReasonLabel = (reason: BreakageLogEntry['reason']) => {
    switch (reason) {
      case 'transit_shatter': return 'Transit Truck Shatter';
      case 'loading_drop': return 'Yard Unloading Drop';
      case 'corner_chipped': return 'Corner Chipping';
      case 'factory_defect': return 'Factory Box Defect';
      case 'handling_crack': return 'Handling Hairline Crack';
      default: return 'Transit Damage';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Log Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs">
        <div>
          <h3 className="text-sm font-extrabold text-[#0B1F33] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Breakage, Transit &amp; Yard Wastage Register
          </h3>
          <p className="text-xs text-[#64748B]">
            Track chipped corners, transit shatter, and supplier insurance claim write-offs in Cloud Firestore
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={loadBreakageLogs}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsModalOpen(true)}
          >
            Log Yard Damage / Breakage
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0]">
          <span className="text-[11px] text-[#64748B] block font-medium">TOTAL DAMAGED BOXES</span>
          <span className="text-lg font-extrabold text-red-600 font-mono-num mt-0.5 block">
            {totalDamagedBoxes} Boxes
          </span>
          <span className="text-[10px] text-[#64748B]">Yard &amp; transit wastage</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0]">
          <span className="text-[11px] text-[#64748B] block font-medium">ESTIMATED LOSS VALUE</span>
          <span className="text-lg font-extrabold text-[#0B1F33] font-mono-num mt-0.5 block">
            ₹ {safeToFixed(totalLossValue)}
          </span>
          <span className="text-[10px] text-[#64748B]">Landed valuation</span>
        </div>
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
          <span className="text-[11px] text-amber-900 block font-bold">PENDING INSURANCE CLAIMS</span>
          <span className="text-lg font-extrabold text-amber-700 font-mono-num mt-0.5 block">
            {pendingClaimsCount} Claims Open
          </span>
          <span className="text-[10px] text-amber-800">Transporter reimbursement</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:max-w-xs">
          <SearchInput
            placeholder="Search SKU, tile name or shade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="text-xs"
          >
            <option value="all">All Damage Reasons</option>
            <option value="transit_shatter">Transit Shatter</option>
            <option value="loading_drop">Loading Drop</option>
            <option value="corner_chipped">Corner Chipped</option>
            <option value="factory_defect">Factory Defect</option>
            <option value="handling_crack">Handling Crack</option>
          </Select>

          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs"
          >
            <option value="all">All Claim Statuses</option>
            <option value="pending">Pending Claim</option>
            <option value="claimed">Claimed / Reimbursed</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                <th className="py-3 px-3">Log Ref &amp; Date</th>
                <th className="py-3 px-3">Tile Item &amp; Shade</th>
                <th className="py-3 px-3 text-center">Damaged Qty</th>
                <th className="py-3 px-3">Reason</th>
                <th className="py-3 px-3 text-right">Loss Value (₹)</th>
                <th className="py-3 px-3">Yard Location</th>
                <th className="py-3 px-3">Claim Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#64748B]">
                    Loading breakage records from Cloud Firestore...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#64748B]">
                    {logs.length === 0
                      ? 'No breakage records logged yet. Click "Log Yard Damage / Breakage" to record one.'
                      : 'No breakage records match your filter criteria.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-[#0B1F33] block">{log.id}</span>
                      <span className="text-[10px] text-[#64748B]">
                        {new Date(log.reportedAt).toLocaleDateString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-extrabold text-[#0B1F33] block">{log.productName}</span>
                      <span className="text-[10px] font-mono text-[#0D5C63] font-bold">
                        {[log.sku, log.shadeLotCode].filter(Boolean).join(' • ') || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-red-600 font-mono-num px-2 py-0.5 rounded bg-red-50 border border-red-200">
                        {log.damagedBoxes} Boxes ({log.damagedPieces} pcs)
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-[#0B1F33]">{getReasonLabel(log.reason)}</span>
                      {log.notes && <p className="text-[10px] text-[#64748B] truncate max-w-[180px]">{log.notes}</p>}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num font-bold text-[#0B1F33]">
                      ₹{safeToFixed(log.estimatedLossValue)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-[#F1F5F9] rounded text-[#475569]">
                        {log.godownBay || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        log.claimStatus === 'claimed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.claimStatus === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {log.claimStatus.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Damage Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Yard Breakage or Transit Damage"
        subtitle="Record damaged tile boxes for stock write-off and transporter insurance claim"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleAddLog}>
              Submit Damage Report
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddLog} className="space-y-4 text-xs">
          <FormField label="Tile Product / Model" required>
            <TextInput
              placeholder="Enter product name or model"
              value={newLog.productName}
              onChange={(e) => setNewLog({ ...newLog, productName: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="SKU Code">
              <TextInput
                placeholder="Enter SKU code"
                value={newLog.sku}
                onChange={(e) => setNewLog({ ...newLog, sku: e.target.value })}
              />
            </FormField>
            <FormField label="Shade & Lot Code">
              <TextInput
                placeholder="Enter shade / lot code"
                value={newLog.shadeLotCode}
                onChange={(e) => setNewLog({ ...newLog, shadeLotCode: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Damaged Boxes" required>
              <TextInput
                type="number"
                min="0"
                value={newLog.damagedBoxes}
                onChange={(e) => setNewLog({ ...newLog, damagedBoxes: parseInt(e.target.value) || 0 })}
              />
            </FormField>
            <FormField label="Loose Pcs">
              <TextInput
                type="number"
                min="0"
                value={newLog.damagedPieces}
                onChange={(e) => setNewLog({ ...newLog, damagedPieces: parseInt(e.target.value) || 0 })}
              />
            </FormField>
            <FormField label="Estimated Loss (₹)">
              <CurrencyInput
                value={newLog.estimatedLossValue}
                onChange={(e) => setNewLog({ ...newLog, estimatedLossValue: parseFloat(e.target.value) || 0 })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Damage Reason">
              <Select
                value={newLog.reason}
                onChange={(e) => setNewLog({ ...newLog, reason: e.target.value as any })}
              >
                <option value="transit_shatter">Transit Truck Shatter</option>
                <option value="loading_drop">Yard Unloading Drop</option>
                <option value="corner_chipped">Corner Chipped</option>
                <option value="factory_defect">Factory Box Defect</option>
                <option value="handling_crack">Handling Hairline Crack</option>
              </Select>
            </FormField>

            <FormField label="Yard / Godown Bay">
              <TextInput
                placeholder="Enter yard / godown location"
                value={newLog.godownBay}
                onChange={(e) => setNewLog({ ...newLog, godownBay: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Remarks & Inspection Notes">
            <TextInput
              placeholder="Driver notes, container number, or breakage description..."
              value={newLog.notes}
              onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
};
