import React, { useState } from 'react';
import {
  Package,
  Milk,
  Edit2,
  TrendingUp,
  History,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../lib/store';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';
import { formatCurrency, formatVolume } from '../../lib/calculations';

export const ProductsView: React.FC = () => {
  const { products, priceHistory, updateProductPrice, settings } = useStore();
  const { showToast } = useToast();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newRate, setNewRate] = useState<number>(60);
  const [reason, setReason] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setNewRate(product.currentPricePerLiter);
    setReason('');
    setIsEditModalOpen(true);
  };

  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || newRate <= 0) return;

    updateProductPrice(selectedProduct.id, newRate, reason || 'Manual price update');
    showToast(`Updated price for ${selectedProduct.name} to ₹${newRate}/L. Price history updated.`);
    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Edit Rate Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Product Rate"
        subtitle={selectedProduct ? `Product: ${selectedProduct.name}` : ''}
        maxWidth="md"
      >
        <form onSubmit={handleSaveRate} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <strong>Historical Integrity Guarantee:</strong> Updating current prices will NOT alter past recorded delivery transactions or historical invoices.
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              New Price per Litre / Unit (₹) *
            </label>
            <input
              type="number"
              required
              min={1}
              value={newRate}
              onChange={e => setNewRate(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-lg font-serif font-bold text-brand-forest outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Reason for Price Adjustment (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Fodder cost increase / Market revision"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none"
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Apply New Rate
            </Button>
          </div>
        </form>
      </Modal>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-card border border-stone-200/80">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            Catalog & Tariff Rules
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-emerald">
            Products & Pricing
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage fresh milk and ghee rates. Package sizes scale proportionally.
          </p>
        </div>
      </div>

      {/* Product Catalog Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map(product => (
          <div
            key={product.id}
            className="bg-white rounded-3xl p-6 shadow-card border border-stone-200/80 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3.5 rounded-2xl bg-brand-forest/10 text-brand-forest">
                    {product.type === 'MILK' ? <Milk className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-brand-emerald">{product.name}</h3>
                    <p className="text-xs text-stone-500">{product.code} • {product.description}</p>
                  </div>
                </div>
                <Badge variant={product.type === 'MILK' ? 'emerald' : 'gold'} size="sm">
                  {product.type}
                </Badge>
              </div>

              {/* Base Price Pill */}
              <div className="p-4 rounded-2xl bg-brand-ivory border border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-500">Current Base Rate</span>
                  <p className="font-serif text-2xl font-bold text-brand-forest mt-0.5">
                    {formatCurrency(product.currentPricePerLiter)} <span className="text-xs font-sans font-normal text-stone-500">/ Litre</span>
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(product)}>
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  Change Rate
                </Button>
              </div>

              {/* Available Packages */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Standard Packages</span>
                <div className="grid grid-cols-2 gap-2">
                  {product.packages.map(pkg => (
                    <div
                      key={pkg.id}
                      className="p-3 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-stone-700">{pkg.name}</span>
                      <span className="font-serif font-bold text-stone-900">{formatCurrency(pkg.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Price Revision History */}
      <div className="bg-white rounded-3xl p-6 shadow-card border border-stone-200/80 space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-brand-forest" />
          <h3 className="font-serif text-lg font-bold text-brand-emerald">Historical Price Revision Audit</h3>
        </div>

        {priceHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase">
                  <th className="py-2.5 px-3">Effective Date</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Previous Price</th>
                  <th className="py-2.5 px-3">New Price</th>
                  <th className="py-2.5 px-3">Reason for Revision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {priceHistory.map(ph => (
                  <tr key={ph.id} className="hover:bg-stone-50">
                    <td className="py-2.5 px-3 font-semibold text-stone-800">{ph.effectiveDate}</td>
                    <td className="py-2.5 px-3 font-bold text-brand-emerald">{ph.productName}</td>
                    <td className="py-2.5 px-3 text-stone-500 line-through">₹{ph.oldPrice}/L</td>
                    <td className="py-2.5 px-3 font-bold text-brand-forest font-serif">₹{ph.newPrice}/L</td>
                    <td className="py-2.5 px-3 text-stone-600">{ph.reason || 'General adjustment'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-stone-500 text-center py-4">No price revisions logged yet.</p>
        )}
      </div>
    </div>
  );
};
