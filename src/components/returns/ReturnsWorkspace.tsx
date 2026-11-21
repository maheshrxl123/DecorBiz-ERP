import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../auth/AuthProvider';
import {
  SalesReturn,
  CreditNote,
  SupplierReturn,
} from '../../types/firestore';
import { returnsService } from '../../services/returnsService';
import { supplierReturnService } from '../../services/supplierReturnService';
import { safeToFixed, formatDate } from '../../lib/formatting/formatters';
import { KpiCard } from '../ui/KpiCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SalesReturnModal } from './SalesReturnModal';
import { CreditNotePrintModal } from './CreditNotePrintModal';
import { SupplierReturnModal } from './SupplierReturnModal';
import {
  RotateCcw,
  Receipt,
  Truck,
  Plus,
  Printer,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import { t } from '../../i18n';

export function ReturnsWorkspace() {
  const { organization: currentOrganization, currentStore } = useWorkspace();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'sales_returns' | 'credit_notes' | 'supplier_returns'>('sales_returns');

  // State data
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [supplierReturns, setSupplierReturns] = useState<SupplierReturn[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isSalesReturnModalOpen, setIsSalesReturnModalOpen] = useState(false);
  const [isSupplierReturnModalOpen, setIsSupplierReturnModalOpen] = useState(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState<CreditNote | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  const refreshData = async () => {
    if (!currentOrganization?.id || !currentStore?.id) return;
    setIsLoading(true);
    try {
      const [rets, cns, sRets] = await Promise.all([
        returnsService.getSalesReturns(currentOrganization.id, { storeId: currentStore.id }),
        returnsService.getCreditNotes(currentOrganization.id, { storeId: currentStore.id }),
        supplierReturnService.getSupplierReturns(currentOrganization.id, { storeId: currentStore.id }),
      ]);

      setSalesReturns(rets);
      setCreditNotes(cns);
      setSupplierReturns(sRets);
    } catch (err) {
      console.error('Error fetching returns & credit notes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentOrganization?.id, currentStore?.id]);

  const handleApproveReturn = async (returnId: string) => {
    if (!currentOrganization?.id || !user) return;
    try {
      await returnsService.approveSalesReturn(
        currentOrganization.id,
        { uid: user.uid, email: user.email, displayName: user.displayName || 'Authorized Manager' },
        returnId
      );
      refreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve sales return');
    }
  };

  // KPI aggregates
  const totalReturnAmount = salesReturns.reduce((acc, curr) => acc + (curr.grandTotalRefund || 0), 0);
  const totalCreditNotesActive = creditNotes
    .filter((cn) => cn.status === 'issued')
    .reduce((acc, curr) => acc + (curr.balanceRemaining || 0), 0);
  const totalSupplierReturnsAmount = supplierReturns.reduce((acc, curr) => acc + (curr.grandTotal || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-[#1F4D3A]" />
            Sales Returns & Credit Notes
          </h1>
          <p className="text-sm text-slate-500">
            PRD Section 12.5: 3-day damage claim, seal verification, credit note issuance, and supplier debit notes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsSupplierReturnModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Truck className="w-4 h-4 text-purple-600" />
            Supplier Debit Note
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsSalesReturnModalOpen(true)}
            className="flex items-center gap-2 bg-[#1F4D3A] hover:bg-[#143528]"
          >
            <Plus className="w-4 h-4" />
            New Customer Return
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Total Returns Value"
          prefix="₹"
          value={totalReturnAmount}
          subValue={`${salesReturns.length} Customer return cases`}
        />
        <KpiCard
          title="Active Credit Notes Balance"
          prefix="₹"
          value={totalCreditNotesActive}
          statusVariant="warning"
          subValue={`${creditNotes.filter((c) => c.status === 'issued').length} Outstanding credit notes`}
        />
        <KpiCard
          title="Supplier Debit Notes"
          prefix="₹"
          value={totalSupplierReturnsAmount}
          subValue={`${supplierReturns.length} Supplier returns`}
        />
      </div>

      {/* Main Card View with Tabs */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/50 px-4 pt-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('sales_returns')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'sales_returns'
                ? 'border-[#1F4D3A] text-[#1F4D3A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Customer Returns ({salesReturns.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('credit_notes')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'credit_notes'
                ? 'border-[#1F4D3A] text-[#1F4D3A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Credit Notes ({creditNotes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('supplier_returns')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'supplier_returns'
                ? 'border-[#1F4D3A] text-[#1F4D3A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            Supplier Returns ({supplierReturns.length})
          </button>
        </div>

        {/* Tab 1: Customer Returns */}
        {activeTab === 'sales_returns' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Return #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Original Invoice</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3 text-center">Items</th>
                  <th className="p-3 text-right">Refund Amount</th>
                  <th className="p-3">Refund Mode</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesReturns.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No customer returns logged.
                    </td>
                  </tr>
                ) : (
                  salesReturns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{ret.returnNumber}</td>
                      <td className="p-3 text-slate-500">{formatDate(ret.createdAt)}</td>
                      <td className="p-3 font-mono text-slate-600">{ret.originalInvoiceNumber}</td>
                      <td className="p-3 font-medium text-slate-900">{ret.customerName || 'Walk-in Customer'}</td>
                      <td className="p-3 text-center font-bold">{ret.totalQuantityReturned}</td>
                      <td className="p-3 text-right font-bold text-red-600">₹{safeToFixed(ret.grandTotalRefund)}</td>
                      <td className="p-3 capitalize">{ret.refundMode.replace('_', ' ')}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            ret.status === 'approved'
                              ? 'success'
                              : ret.status === 'pending_approval'
                              ? 'warning'
                              : 'critical'
                          }
                          className="uppercase font-bold"
                        >
                          {ret.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        {ret.status === 'pending_approval' ? (
                          <Button
                            size="xs"
                            variant="primary"
                            className="bg-[#1F4D3A] hover:bg-[#143528]"
                            onClick={() => handleApproveReturn(ret.id)}
                          >
                            Approve
                          </Button>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Credit Notes */}
        {activeTab === 'credit_notes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Credit Note #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Return Ref</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3 text-right">Initial Amount</th>
                  <th className="p-3 text-right">Remaining Balance</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {creditNotes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No credit notes issued.
                    </td>
                  </tr>
                ) : (
                  creditNotes.map((cn) => (
                    <tr key={cn.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{cn.creditNoteNumber}</td>
                      <td className="p-3 text-slate-500">{formatDate(cn.createdAt)}</td>
                      <td className="p-3 font-mono text-slate-600">{cn.salesReturnNumber}</td>
                      <td className="p-3 font-medium text-slate-900">{cn.customerName}</td>
                      <td className="p-3 text-right">₹{safeToFixed(cn.amount)}</td>
                      <td className="p-3 text-right font-bold text-amber-700">₹{safeToFixed(cn.balanceRemaining)}</td>
                      <td className="p-3">
                        <Badge
                          variant={cn.status === 'issued' ? 'warning' : 'neutral'}
                          className="uppercase font-bold"
                        >
                          {cn.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setSelectedCreditNote(cn)}
                          className="flex items-center gap-1 mx-auto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Supplier Returns */}
        {activeTab === 'supplier_returns' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Debit Note #</th>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3">Invoice Ref</th>
                  <th className="p-3 text-center">Total Qty</th>
                  <th className="p-3 text-right">Subtotal</th>
                  <th className="p-3 text-right">GST</th>
                  <th className="p-3 text-right">Debit Total</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplierReturns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No supplier debit notes recorded yet.
                    </td>
                  </tr>
                ) : (
                  supplierReturns.map((sr) => (
                    <tr key={sr.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{sr.supplierReturnNumber}</td>
                      <td className="p-3 font-bold text-slate-900">{sr.supplierName}</td>
                      <td className="p-3 font-mono text-slate-500">{sr.supplierInvoiceNumber || 'N/A'}</td>
                      <td className="p-3 text-center font-bold">{sr.totalQuantity}</td>
                      <td className="p-3 text-right">₹{safeToFixed(sr.subtotal)}</td>
                      <td className="p-3 text-right">₹{safeToFixed(sr.totalTax)}</td>
                      <td className="p-3 text-right font-bold text-purple-700">₹{safeToFixed(sr.grandTotal)}</td>
                      <td className="p-3">
                        <Badge variant="success" className="uppercase font-bold">
                          {sr.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <SalesReturnModal
        isOpen={isSalesReturnModalOpen}
        onClose={() => setIsSalesReturnModalOpen(false)}
        onSuccess={() => {
          setIsSalesReturnModalOpen(false);
          refreshData();
        }}
      />

      <SupplierReturnModal
        isOpen={isSupplierReturnModalOpen}
        onClose={() => setIsSupplierReturnModalOpen(false)}
        onSuccess={() => {
          setIsSupplierReturnModalOpen(false);
          refreshData();
        }}
      />

      {selectedCreditNote && (
        <CreditNotePrintModal
          isOpen={!!selectedCreditNote}
          onClose={() => setSelectedCreditNote(null)}
          creditNote={selectedCreditNote}
        />
      )}
    </div>
  );
}
