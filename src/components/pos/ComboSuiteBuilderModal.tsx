import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Check,
  Percent,
  ShoppingCart,
  Package,
} from 'lucide-react';
import { PosCartItem, PosProductItem } from '../../types';
import { safeToFixed } from '../../lib/formatting/formatters';

interface ComboSuiteBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSuiteToCart: (items: PosCartItem[]) => void;
  availableProducts: PosProductItem[];
}

export const ComboSuiteBuilderModal: React.FC<ComboSuiteBuilderModalProps> = ({
  isOpen,
  onClose,
  onAddSuiteToCart,
  availableProducts,
}) => {
  const [roomAreaSqFt, setRoomAreaSqFt] = useState<number>(120);
  const [roomLengthFt, setRoomLengthFt] = useState<string>('12');
  const [roomWidthFt, setRoomWidthFt] = useState<string>('10');
  const [dimensionMode, setDimensionMode] = useState<'area' | 'dimensions'>('dimensions');
  const [bundleDiscountPercent, setBundleDiscountPercent] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [customQtys, setCustomQtys] = useState<Record<string, number>>({});

  // Compute effective area
  const effectiveArea = useMemo(() => {
    if (dimensionMode === 'dimensions') {
      const l = parseFloat(roomLengthFt) || 0;
      const w = parseFloat(roomWidthFt) || 0;
      return Math.round(l * w);
    }
    return roomAreaSqFt;
  }, [dimensionMode, roomLengthFt, roomWidthFt, roomAreaSqFt]);

  const inStockProducts = useMemo(() => {
    return availableProducts.filter((p) => p.hasBatches && p.stock > 0);
  }, [availableProducts]);

  const getSuggestedQty = (prod: PosProductItem): number => {
    if (customQtys[prod.id] !== undefined) {
      return customQtys[prod.id];
    }
    const coverage = prod.coveragePerBoxSqFt || 0;
    if (coverage > 0 && effectiveArea > 0) {
      // Include 10% wastage buffer for tile box calculation
      return Math.min(
        prod.stock,
        Math.max(1, Math.ceil((effectiveArea * 1.1) / coverage))
      );
    }
    return 1;
  };

  const evaluatedProducts = useMemo(() => {
    return inStockProducts.map((prod) => {
      const isSelected = Boolean(selectedIds[prod.id]);
      const qty = Math.min(prod.stock, Math.max(1, getSuggestedQty(prod)));
      const unitPrice = prod.price || prod.mrp || 0;
      const gross = qty * unitPrice;
      const discount = (gross * bundleDiscountPercent) / 100;
      const net = gross - discount;
      return {
        product: prod,
        isSelected,
        qty,
        unitPrice,
        gross,
        discount,
        net,
      };
    });
  }, [inStockProducts, selectedIds, customQtys, effectiveArea, bundleDiscountPercent]);

  const summary = useMemo(() => {
    const included = evaluatedProducts.filter((e) => e.isSelected);
    const grossTotal = included.reduce((s, c) => s + c.gross, 0);
    const totalDiscount = included.reduce((s, c) => s + c.discount, 0);
    const netTotal = included.reduce((s, c) => s + c.net, 0);
    const totalItems = included.reduce((s, c) => s + c.qty, 0);
    return { count: included.length, grossTotal, totalDiscount, netTotal, totalItems };
  }, [evaluatedProducts]);

  const toggleProduct = (productId: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const handleApplySuite = () => {
    const included = evaluatedProducts.filter((e) => e.isSelected && e.product.hasBatches);
    if (included.length === 0) return;

    const cartItems: PosCartItem[] = included.map((entry) => {
      const p = entry.product;
      const base = entry.qty * entry.unitPrice;
      const discAmt = (base * bundleDiscountPercent) / 100;
      const taxable = base - discAmt;
      const gstPercent = p.gstPercent ?? p.gst ?? 0;
      const halfGst = gstPercent / 2;
      const cgst = (taxable * halfGst) / 100;
      const sgst = (taxable * halfGst) / 100;
      const total = taxable + cgst + sgst;

      return {
        id: `suite_${p.id}_${Date.now()}`,
        productId: p.id,
        name: p.name,
        brand: p.brand || '',
        composition: p.composition || '',
        sku: p.sku,
        batchId: p.batchId,
        batch: p.batch || '',
        shadeNumber: p.shadeNumber,
        toneCode: p.toneCode,
        caliberCode: p.caliberCode,
        finish: p.finish || p.dosageForm,
        grade: p.grade,
        dimensionsMm: p.dimensionsMm,
        expiry: p.expiry || 'N/A',
        qty: entry.qty,
        availableStock: p.stock,
        unit: p.unit || 'Box',
        mrp: p.mrp || entry.unitPrice,
        price: entry.unitPrice,
        discountPercent: bundleDiscountPercent,
        discountAmount: discAmt,
        taxableAmount: taxable,
        gstPercent,
        cgstAmount: cgst,
        sgstAmount: sgst,
        totalTax: cgst + sgst,
        total,
        dosageForm: p.finish || p.dosageForm,
        hsnCode: p.hsnCode,
        coveragePerBoxSqFt: p.coveragePerBoxSqFt,
        sqFtCalculated: p.coveragePerBoxSqFt ? entry.qty * p.coveragePerBoxSqFt : undefined,
      };
    });

    onAddSuiteToCart(cartItems);
    setSelectedIds({});
    setCustomQtys({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider flex items-center gap-2">
                Room Combo &amp; Suite Package Builder
              </h2>
              <p className="text-xs text-teal-100 mt-0.5">
                Bundle real showroom products from Cloud Firestore inventory with room-area box estimates
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Dimensions & Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
                <span>Room Dimensions &amp; Area</span>
                <span className="text-[10px] text-teal-600 font-mono font-bold">
                  Area: {effectiveArea} Sq. Ft
                </span>
              </h3>

              <div className="grid grid-cols-2 gap-1 bg-slate-200 dark:bg-slate-700/60 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDimensionMode('dimensions')}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    dimensionMode === 'dimensions'
                      ? 'bg-white dark:bg-slate-800 text-teal-600 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Room L × W (Ft)
                </button>
                <button
                  type="button"
                  onClick={() => setDimensionMode('area')}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    dimensionMode === 'area'
                      ? 'bg-white dark:bg-slate-800 text-teal-600 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Total Sq. Ft
                </button>
              </div>

              {dimensionMode === 'dimensions' ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Length (Feet)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={roomLengthFt}
                      onChange={(e) => setRoomLengthFt(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Width (Feet)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={roomWidthFt}
                      onChange={(e) => setRoomWidthFt(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="pt-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Total Net Area (Sq. Ft)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={roomAreaSqFt}
                    onChange={(e) => setRoomAreaSqFt(Number(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Bundle Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={bundleDiscountPercent}
                  onChange={(e) => setBundleDiscountPercent(Math.min(50, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed">
                For products with box coverage set in Firestore, suggested quantities automatically add a 10% wastage buffer.
              </p>
            </div>

            {/* Package Summary Card */}
            <div className="p-4 bg-teal-50 dark:bg-teal-950/30 rounded-2xl border border-teal-200 dark:border-teal-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Selected Line Items
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                  {summary.count} SKUs ({summary.totalItems} units)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Catalog Subtotal:</span>
                <span className="font-mono">₹{safeToFixed(summary.grossTotal)}</span>
              </div>
              {bundleDiscountPercent > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5" />
                    Bundle Discount ({bundleDiscountPercent}%):
                  </span>
                  <span className="font-mono">-₹{safeToFixed(summary.totalDiscount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-teal-200 dark:border-teal-800 flex items-center justify-between">
                <span className="text-sm font-black text-slate-900 dark:text-white uppercase">
                  Net Suite Price:
                </span>
                <span className="text-lg font-black text-teal-700 dark:text-teal-400 font-mono">
                  ₹{safeToFixed(summary.netTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Firestore Inventory Selection (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Available Showroom Stock ({summary.count}/{inStockProducts.length} Selected)
              </h3>
              <span className="text-[11px] text-slate-500">Select items from your live Firestore catalog</span>
            </div>

            {inStockProducts.length === 0 ? (
              <div className="p-10 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <Package className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No in-stock products available in Cloud Firestore
                </p>
                <p className="text-xs text-slate-500">
                  Add products and inward stock batches in Inventory before building room combo packages.
                </p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
                {evaluatedProducts.map((entry) => {
                  const p = entry.product;
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProduct(p.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        entry.isSelected
                          ? 'border-teal-400 dark:border-teal-700 bg-white dark:bg-slate-800/70 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                            entry.isSelected
                              ? 'bg-teal-600 border-teal-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {entry.isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                              {p.brand || 'Catalog'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              SKU: {p.sku} · Stock: {p.stock}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                            {p.name}
                          </h4>
                          <p className="text-[10px] text-slate-500">
                            ₹{safeToFixed(entry.unitPrice)} / {p.unit || 'Unit'}
                            {p.coveragePerBoxSqFt ? ` · ${p.coveragePerBoxSqFt} Sq.Ft/Box` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          min={1}
                          max={p.stock}
                          value={entry.qty}
                          onChange={(e) =>
                            setCustomQtys((prev) => ({
                              ...prev,
                              [p.id]: Math.min(p.stock, Math.max(1, parseInt(e.target.value) || 1)),
                            }))
                          }
                          className="w-16 px-2 py-1 text-center text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                        />
                        <div className="text-right w-24">
                          <div className="text-xs font-black font-mono text-slate-900 dark:text-white">
                            ₹{safeToFixed(entry.net)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={summary.count === 0}
            onClick={handleApplySuite}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add {summary.count} Item{summary.count === 1 ? '' : 's'} to POS Bill</span>
          </button>
        </div>
      </div>
    </div>
  );
};
