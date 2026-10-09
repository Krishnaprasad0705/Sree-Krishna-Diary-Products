import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Minus,
  Milk,
  Package,
  History,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';
import { formatVolume } from '../../lib/calculations';

export const StockView: React.FC = () => {
  const { stockItems, stockMovements, adjustStock, products } = useStore();
  const { showToast } = useToast();

  const [isProcureModalOpen, setIsProcureModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('prod-milk');
  const [quantityLiters, setQuantityLiters] = useState<number>(50);
  const [notes, setNotes] = useState<string>('Morning farm procurement');

  const handleProcureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adjustStock(selectedProductId, quantityLiters, 'PROCUREMENT', notes);
    showToast(`Added ${quantityLiters} Litres to stock`);
    setIsProcureModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Procure Modal */}
      <Modal
        isOpen={isProcureModalOpen}
        onClose={() => setIsProcureModalOpen(false)}
        title="Add Farm Milk Procurement"
        subtitle="Log morning fresh milk cans received from dairy farm"
        maxWidth="md"
      >
        <form onSubmit={handleProcureSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Select Product *
            </label>
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Procured Quantity (Litres) *
            </label>
            <input
              type="number"
              required
              min={1}
              value={quantityLiters}
              onChange={e => setQuantityLiters(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-lg font-bold text-brand-forest"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Notes / Source Farm
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Sannathi farm morning milking"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsProcureModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save to Inventory
            </Button>
          </div>
        </form>
      </Modal>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-card border border-stone-200/80">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            Daily Inventory & Farm Supply
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-emerald">
            Stock & Inventory
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Track daily milk received from farm and automatic delivery deductions.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setIsProcureModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5 text-brand-gold" />
          Add Farm Procurement
        </Button>
      </div>

      {/* Current Stock Levels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {stockItems.map(item => (
          <div
            key={item.id}
            className="bg-white rounded-3xl p-6 shadow-card border border-stone-200/80 flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Available Stock</span>
              <h3 className="font-serif text-xl font-bold text-brand-emerald">{item.productName}</h3>
              <p className="font-serif text-3xl font-bold text-brand-forest mt-1">
                {item.currentStockLiters.toFixed(1)} Litres
              </p>
            </div>

            <div className="p-4 bg-brand-forest/10 text-brand-forest rounded-2xl">
              <Milk className="w-8 h-8" />
            </div>
          </div>
        ))}
      </div>

      {/* Stock Movement Log */}
      <div className="bg-white rounded-3xl p-6 shadow-card border border-stone-200/80 space-y-4">
        <h3 className="font-serif text-lg font-bold text-brand-emerald flex items-center gap-2">
          <History className="w-5 h-5 text-brand-forest" />
          Recent Stock Movements
        </h3>

        {stockMovements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {stockMovements.map(m => (
                  <tr key={m.id} className="hover:bg-stone-50">
                    <td className="py-2.5 px-3 font-semibold text-stone-800">{m.date}</td>
                    <td className="py-2.5 px-3 font-bold text-brand-emerald">{m.productName}</td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={
                          m.type === 'PROCUREMENT'
                            ? 'success'
                            : m.type === 'DELIVERY_DEDUCTION'
                            ? 'neutral'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {m.type}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 font-bold">
                      {m.quantityLiters > 0 ? `+${m.quantityLiters} L` : `${m.quantityLiters} L`}
                    </td>
                    <td className="py-2.5 px-3 text-stone-500">{m.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-stone-500 text-center py-4">No recent stock movements recorded.</p>
        )}
      </div>
    </div>
  );
};
