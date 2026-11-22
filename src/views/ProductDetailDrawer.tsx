import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Edit,
  Archive,
  Trash2,
} from 'lucide-react';
import { Drawer } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProductImage } from '../components/ui/ProductImage';
import { Tabs } from '../components/ui/Tabs';
import { Product } from '../types/product';
import { InventoryItem } from '../types';
import { TileLotBatch } from '../types/batch';
import { setProductStatus, deleteProduct } from '../services/productService';
import { batchService } from '../services/batchService';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../context/ToastContext';
import { useConfirmation } from '../context/ConfirmationContext';
import { safeToFixed, formatDate } from '../lib/formatting/formatters';

interface ProductDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: (Product | InventoryItem) | null;
  onEdit?: (product: any) => void;
  onStatusChanged?: () => void;
}

export const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({
  isOpen,
  onClose,
  product,
  onEdit,
  onStatusChanged,
}) => {
  const { organization } = useWorkspace();
  const { user } = useAuth();
  const { success, error } = useToast();
  const { confirm } = useConfirmation();

  const [activeTab, setActiveTab] = useState<'overview' | 'batches' | 'pricing' | 'history'>('overview');
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [batches, setBatches] = useState<TileLotBatch[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);

  const productId = (product as any)?.id as string | undefined;

  useEffect(() => {
    let active = true;
    if (!isOpen || !organization?.id || !productId) {
      setBatches([]);
      return;
    }

    const fetchProductBatches = async () => {
      setIsLoadingBatches(true);
      try {
        const res = await batchService.getBatches(organization.id, { productId });
        if (active) {
          setBatches(res.batches || []);
        }
      } catch (err) {
        console.warn('Failed to fetch batches for product:', err);
        if (active) setBatches([]);
      } finally {
        if (active) setIsLoadingBatches(false);
      }
    };

    fetchProductBatches();
    return () => {
      active = false;
    };
  }, [isOpen, organization?.id, productId]);

  if (!product) return null;

  // Normalize fields strictly from Firestore document (no fabricated defaults)
  const p = product as any;
  const productName = p.productName || p.name || 'Unnamed Product';
  const brand = p.brand || '—';
  const sku = p.sku || '—';
  const categoryType = p.categoryType || 'other';
  const category = p.categoryName || p.category || '—';
  const hsnCode = p.hsnCode || '—';
  const gstRate = typeof p.gstRate === 'number' ? p.gstRate : 0;
  const mrp = p.defaultMrp ?? p.mrp ?? 0;
  const purchaseCost = p.defaultPurchaseCost ?? p.purchaseCost ?? 0;
  const salePrice = p.defaultSalePrice ?? p.salePrice ?? 0;
  const rackLocation = p.rackLocation || '—';
  const mediaUrl = p.mediaUrl || p.imageUrl || '';
  const packUnit = p.packaging?.packUnit || 'Unit';
  const marginPercent =
    salePrice > 0 && purchaseCost > 0
      ? (((salePrice - purchaseCost) / salePrice) * 100).toFixed(1)
      : '—';

  const handleArchive = async () => {
    if (!organization || !user || !p.id) return;
    try {
      setIsArchiving(true);
      await setProductStatus(
        organization.id,
        p.id,
        { uid: user.uid, email: user.email, displayName: user.displayName },
        p.status === 'archived' ? 'active' : 'archived'
      );
      success(`Product ${productName} status updated to ${p.status === 'archived' ? 'Active' : 'Archived'}.`, 'Status Updated');
      onStatusChanged?.();
      onClose();
    } catch (err: any) {
      error(err?.message || 'Failed to update status.', 'Archive Failed');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (!organization || !user || !p.id) {
      error('Missing organization, user, or product ID.', 'Deletion Failed');
      return;
    }
    const confirmed = await confirm({
      title: 'Delete Product',
      description: `Are you sure you want to permanently delete "${productName}"? This action cannot be undone.`,
      confirmLabel: 'Delete Permanently',
      variant: 'danger',
    });
    if (!confirmed) {
      return;
    }
    try {
      setIsDeleting(true);
      await deleteProduct(organization.id, p.id, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      });
      success(`Product ${productName} permanently deleted.`, 'Product Deleted');
      onStatusChanged?.();
      onClose();
    } catch (err: any) {
      console.error('Delete product error:', err);
      error(err?.message || 'Failed to delete product.', 'Deletion Failed');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={productName}
      subtitle={`SKU: ${sku} • Brand: ${brand} • Line: ${String(categoryType).toUpperCase()}`}
      width="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Archive}
              isLoading={isArchiving}
              onClick={handleArchive}
            >
              {p.status === 'archived' ? 'Restore' : 'Archive'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Trash2}
              isLoading={isDeleting}
              className="text-red-600 border-red-200 hover:bg-red-50 z-50 pointer-events-auto"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={Edit}
              onClick={() => onEdit?.(product)}
            >
              Edit Product
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Hero Section */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <ProductImage
            src={mediaUrl}
            size="lg"
            dosageForm={p.surfaceFinish || p.colorFinish || categoryType}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-[#0B1F33]">{productName}</h3>
              <Badge status={p.status || 'active'} size="sm" />
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569]">
                {sku}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E6F4F1] text-[#0D5C63] uppercase border border-[#0D5C63]/20">
                {categoryType}
              </span>
            </div>
            <p className="text-xs text-[#475569] mt-1">
              Brand: <strong className="font-semibold text-[#0B1F33]">{brand}</strong> • Category: <strong className="font-semibold text-[#0D5C63]">{category}</strong>
            </p>
            <div className="flex items-center gap-4 mt-2.5 text-xs text-[#64748B]">
              <span>Yard Rack: <strong className="text-[#0B1F33]">{rackLocation}</strong></span>
              <span>Primary Unit: <strong className="text-[#0D5C63] font-bold">{packUnit}</strong></span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview & Technical Specs' },
            { id: 'batches', label: `Yard Storage & Batches (${batches.length})` },
            { id: 'pricing', label: 'Commercial & GST Slabs' },
            { id: 'history', label: 'Audit Trail & Movements' },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as any)}
        />

        {/* Tab Contents */}
        {activeTab === 'overview' && (
          <div className="space-y-4 text-xs">
            {/* Category Specific Technical Grid — real Firestore fields only */}
            {categoryType === 'tiles' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Tile Size &amp; Dimensions</span>
                  <span className="font-bold text-[#0B1F33] text-sm mt-0.5 block">{p.tileDimensions || '—'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Surface Finish</span>
                  <span className="font-bold text-[#0D5C63] text-sm mt-0.5 block">{p.surfaceFinish || '—'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Body Type</span>
                  <span className="font-bold text-[#0B1F33] text-sm mt-0.5 block">{p.tileBodyType || '—'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Box Coverage Ratio</span>
                  <span className="font-bold text-[#0B1F33] text-sm mt-0.5 block">
                    {p.coveragePerBoxSqFt ? `${p.coveragePerBoxSqFt} Sq. Ft / Box` : '—'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Pieces &amp; Weight</span>
                  <span className="font-bold text-[#0B1F33] text-sm mt-0.5 block">
                    {p.piecesPerBox || p.weightPerBoxKg
                      ? `${p.piecesPerBox ? `${p.piecesPerBox} Pcs` : ''}${p.piecesPerBox && p.weightPerBoxKg ? ' ' : ''}${p.weightPerBoxKg ? `(${p.weightPerBoxKg} Kg)` : ''}`
                      : '—'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Quality Grade</span>
                  <span className="font-bold text-emerald-700 text-sm mt-0.5 block">{p.tileGrade || '—'}</span>
                </div>
              </div>
            )}

            {categoryType === 'sanitaryware' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Sanitary Item Type</span>
                  <span className="font-bold text-[#0B1F33] text-sm mt-0.5 block">{p.sanitaryType || '—'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Mounting Style</span>
                  <span className="font-bold text-[#0D5C63] text-sm mt-0.5 block">{p.mountingType || '—'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Trap / Outlet Size</span>
                  <span className="font-bold text-[#0B1F33] text-sm mt-0.5 block">{p.trapType || '—'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Color &amp; Finish</span>
                  <span className="font-bold text-[#0B1F33] text-sm mt-0.5 block">{p.colorFinish || '—'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Flushing Mechanism</span>
                  <span className="font-bold text-[#0B1F33] text-sm mt-0.5 block">{p.flushingType || '—'}</span>
                </div>
              </div>
            )}

            {categoryType === 'faucets' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Fitting Type</span>
                  <span className="font-bold text-[#0B1F33] text-sm mt-0.5 block">{p.fittingType || '—'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Material &amp; Finish</span>
                  <span className="font-bold text-[#0D5C63] text-sm mt-0.5 block">{p.materialFinish || '—'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Warranty Period</span>
                  <span className="font-bold text-emerald-700 text-sm mt-0.5 block">
                    {p.warrantyYears ? `${p.warrantyYears} Years` : '—'}
                  </span>
                </div>
              </div>
            )}

            {categoryType === 'adhesives' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Chemical Grade</span>
                  <span className="font-bold text-[#0B1F33] text-sm mt-0.5 block">{p.chemicalType || '—'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Pack Bag Size</span>
                  <span className="font-bold text-[#0D5C63] text-sm mt-0.5 block">
                    {p.packSizeKg ? `${p.packSizeKg} Kg Bag` : '—'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Coverage Per Bag</span>
                  <span className="font-bold text-[#0B1F33] text-sm mt-0.5 block">
                    {p.coverageSqFtPerBag ? `${p.coverageSqFtPerBag} Sq. Ft` : '—'}
                  </span>
                </div>
              </div>
            )}

            {categoryType === 'pipes' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Pipe / Fitting Type</span>
                  <span className="font-bold text-[#0B1F33] text-sm mt-0.5 block">{p.pipeType || '—'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Outer Diameter / Size</span>
                  <span className="font-bold text-[#0D5C63] text-sm mt-0.5 block">{p.outerDiameter || '—'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Pressure Rating / Class</span>
                  <span className="font-bold text-[#0B1F33] text-sm mt-0.5 block">{p.pressureRating || '—'}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[11px]">HSN Tax Code</span>
                <span className="font-bold text-[#0B1F33] font-mono text-sm mt-0.5 block">{hsnCode}</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[11px]">GST Rate Slab</span>
                <span className="font-bold text-[#0B1F33] text-sm mt-0.5 block">
                  {gstRate}% ({gstRate / 2}% CGST + {gstRate / 2}% SGST)
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#E6F4F1] border border-[#0D5C63]/20">
              <h5 className="font-bold text-[#0D5C63] mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0D5C63]" /> Statutory Tax &amp; Yard Dispatch Guidelines
              </h5>
              <p className="text-[#0B1F33] leading-relaxed">
                HSN {hsnCode}. Priced per {packUnit}. Verify shade/lot match on dispatch.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'batches' && (
          <div className="space-y-3 text-xs">
            {isLoadingBatches ? (
              <div className="p-6 text-center text-[#64748B] bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                Loading real-time batches from Cloud Firestore...
              </div>
            ) : batches.length === 0 ? (
              <div className="p-6 text-center text-[#64748B] bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                No stock batches recorded for this product in Cloud Firestore yet. Inward stock via GRN or Batch Ledger.
              </div>
            ) : (
              batches.map((b) => (
                <div key={b.id} className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#0D5C63] bg-[#E6F4F1] px-2 py-0.5 rounded uppercase">
                        {b.status}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#0B1F33]">
                        Lot/Shade: {b.shadeNumber || b.batchNumber || '—'}
                      </span>
                    </div>
                    <Badge status={b.availableQuantity > 0 ? 'in_stock' : 'out_of_stock'} size="sm" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div>
                      <span className="text-[#64748B] block text-[10px]">TONE / CALIBER</span>
                      <span className="font-bold text-[#0B1F33]">
                        {[b.toneCode, b.caliberCode].filter(Boolean).join(' / ') || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px]">AVAILABLE STOCK</span>
                      <span className="font-bold text-[#0D5C63] font-mono-num">
                        {b.availableQuantity} {packUnit}{b.availableQuantity === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px]">GODOWN BAY</span>
                      <span className="font-bold text-[#0B1F33] font-mono-num">
                        {b.storageLocation || rackLocation}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[11px]">Maximum Retail Price (MRP)</span>
                <span className="text-xl font-extrabold text-[#0B1F33] font-mono-num mt-1 block">
                  ₹ {safeToFixed(mrp)} / {packUnit}
                </span>
                <span className="text-[10px] text-[#64748B]">Inclusive of GST</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[11px]">Landed Purchase Cost</span>
                <span className="text-xl font-extrabold text-[#0B1F33] font-mono-num mt-1 block">
                  ₹ {safeToFixed(purchaseCost)} / {packUnit}
                </span>
                <span className="text-[10px] text-[#64748B]">Supplier net cost</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[11px]">Showroom Sale Price</span>
                <span className="text-xl font-extrabold text-[#0D5C63] font-mono-num mt-1 block">
                  ₹ {safeToFixed(salePrice)} / {packUnit}
                </span>
                <span className="text-[10px] text-[#15803D] font-bold">Standard Counter Price</span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <span className="text-emerald-800 block text-[11px] font-bold">Calculated Gross Margin %</span>
                <span className="text-xl font-extrabold text-emerald-700 font-mono-num mt-1 block">
                  {marginPercent === '—' ? '—' : `${marginPercent}%`}
                </span>
                <span className="text-[10px] text-emerald-700 font-medium">
                  Net profit per {packUnit}: ₹{safeToFixed((salePrice || 0) - (purchaseCost || 0))}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3 text-xs">
            <span className="font-bold text-[#0B1F33]">Firestore Product Lifecycle History</span>
            <div className="p-3 bg-[#F8FAFC] border rounded-xl text-[#64748B]">
              <p>Product record created by {p.createdByUid || '—'} on {formatDate(p.createdAt) || '—'}</p>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};
