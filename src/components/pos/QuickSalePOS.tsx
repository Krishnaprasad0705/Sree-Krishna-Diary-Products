import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Printer,
  CheckCircle2,
  User,
  CreditCard,
  IndianRupee,
  Sparkles,
  Milk,
  Package
} from 'lucide-react';
import { SaleItem, Sale, PaymentMethod } from '../../types';
import { useStore } from '../../lib/store';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Logo } from '../brand/Logo';
import { useToast } from '../common/Toast';
import { formatCurrency, formatVolume } from '../../lib/calculations';

export const QuickSalePOS: React.FC = () => {
  const { products, customers, recordSale, settings } = useStore();
  const { showToast } = useToast();

  const [cart, setCart] = useState<SaleItem[]>([]);
  const [isWalkIn, setIsWalkIn] = useState<boolean>(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('Walk-in Customer');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Receipt Modal State
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Add standard pack to cart
  const handleAddPackage = (productId: string, productName: string, pkgId: string, volumeMl: number, price: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.packageId === pkgId);
      if (existing) {
        return prev.map(item =>
          item.packageId === pkgId
            ? {
                ...item,
                quantityMl: item.quantityMl + volumeMl,
                subtotal: item.subtotal + price
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId,
            productName: `${productName} (${formatVolume(volumeMl)})`,
            packageId: pkgId,
            quantityMl: volumeMl,
            unitPrice: price,
            subtotal: price
          }
        ];
      }
    });
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    setCart(prev => {
      return prev
        .map((item, idx) => {
          if (idx === index) {
            const singleUnitQty = item.packageId ? (item.quantityMl / (item.subtotal / item.unitPrice)) : 250;
            const currentUnits = Math.round(item.subtotal / item.unitPrice);
            const newUnits = currentUnits + delta;
            if (newUnits <= 0) return null;
            return {
              ...item,
              quantityMl: singleUnitQty * newUnits,
              subtotal: item.unitPrice * newUnits
            };
          }
          return item;
        })
        .filter(Boolean) as SaleItem[];
    });
  };

  const handleRemoveItem = (index: number) => {
    setCart(prev => prev.filter((_, idx) => idx !== index));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const finalPayable = Math.max(0, cartTotal - discount);

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      showToast('Cart is empty. Please select products.', 'error');
      return;
    }

    const customerObj = !isWalkIn ? customers.find(c => c.id === selectedCustomerId) : null;
    const custName = customerObj ? customerObj.name : guestName || 'Walk-in Customer';

    const recorded = recordSale({
      date: new Date().toISOString().split('T')[0],
      customerId: customerObj ? customerObj.id : undefined,
      customerName: custName,
      isWalkIn,
      items: cart,
      totalAmount: cartTotal,
      discount,
      finalAmount: finalPayable,
      amountPaid: finalPayable,
      paymentStatus: 'PAID',
      paymentMethod,
      notes
    });

    setLastCompletedSale(recorded);
    setIsReceiptModalOpen(true);
    showToast(`Sale recorded successfully for ${custName}!`);

    // Reset Cart
    setCart([]);
    setDiscount(0);
    setNotes('');
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Receipt Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Sale Receipt"
        subtitle={lastCompletedSale ? `Receipt #${lastCompletedSale.id.slice(0, 8).toUpperCase()}` : ''}
        maxWidth="md"
      >
        {lastCompletedSale && (
          <div className="space-y-5">
            {/* Printable Receipt Area */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200 text-stone-900 print-container" id="printable-receipt">
              <div className="text-center pb-4 border-b border-dashed border-stone-300">
                <Logo size="sm" showText={true} theme="light" className="justify-center mb-2" />
                <p className="text-xs text-stone-600 font-medium">{settings.address}</p>
                <p className="text-xs text-stone-500">Phone: {settings.phone} • UPI: {settings.upiId}</p>
              </div>

              <div className="py-3 text-xs border-b border-dashed border-stone-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">Date:</span>
                  <span className="font-semibold">{lastCompletedSale.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Customer:</span>
                  <span className="font-bold">{lastCompletedSale.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Payment:</span>
                  <span className="font-semibold">{lastCompletedSale.paymentMethod} (PAID)</span>
                </div>
              </div>

              {/* Line Items */}
              <div className="py-3 text-xs border-b border-dashed border-stone-300 space-y-2">
                {lastCompletedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-stone-800">{item.productName}</p>
                      <p className="text-[10px] text-stone-500">Qty: {formatVolume(item.quantityMl)}</p>
                    </div>
                    <span className="font-bold font-serif">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pt-3 text-xs space-y-1 font-semibold">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(lastCompletedSale.totalAmount)}</span>
                </div>
                {lastCompletedSale.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-{formatCurrency(lastCompletedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-brand-emerald pt-2 border-t border-stone-200">
                  <span>Total Paid:</span>
                  <span>{formatCurrency(lastCompletedSale.finalAmount)}</span>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-dashed border-stone-300 text-center text-[10px] text-stone-400">
                <p>Thank you for choosing Sree Krishna Dairy!</p>
                <p>Pure Milk • Pure Ghee • Farm Fresh</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 no-print">
              <Button variant="outline" onClick={() => setIsReceiptModalOpen(false)}>
                Done
              </Button>
              <Button variant="primary" onClick={handlePrintReceipt}>
                <Printer className="w-4 h-4 mr-1.5" />
                Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-card border border-stone-200/80">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            Point of Sale Counter
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-emerald">
            Quick Sale & Occasional Counter
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Fast checkout for counter walk-ins, festival ghee packs, and direct milk sales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="emerald" size="md">
            Cash / UPI POS Terminal
          </Badge>
        </div>
      </div>

      {/* Main POS Interface: Product Catalog (Left) + Cart & Checkout (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Catalog Cards */}
        <div className="lg:col-span-2 space-y-6">
          {products.map(prod => (
            <div
              key={prod.id}
              className="bg-white rounded-3xl p-6 shadow-card border border-stone-200/80 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-brand-forest/10 text-brand-forest rounded-2xl">
                    {prod.type === 'MILK' ? <Milk className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-brand-emerald">{prod.name}</h3>
                    <p className="text-xs text-stone-500">Base rate: ₹{prod.currentPricePerLiter}/L</p>
                  </div>
                </div>
                <Badge variant={prod.type === 'MILK' ? 'emerald' : 'gold'} size="sm">
                  {prod.type}
                </Badge>
              </div>

              {/* Package Preset Click Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {prod.packages.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => handleAddPackage(prod.id, prod.name, pkg.id, pkg.volumeMl, pkg.price)}
                    className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 hover:border-brand-forest hover:bg-brand-cream/30 transition-all text-left group flex flex-col justify-between active:scale-95"
                  >
                    <div>
                      <p className="font-bold text-xs text-stone-800 group-hover:text-brand-forest">
                        {pkg.name}
                      </p>
                      <p className="text-[11px] text-stone-500">{formatVolume(pkg.volumeMl)}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-serif font-bold text-sm text-brand-emerald">
                        {formatCurrency(pkg.price)}
                      </span>
                      <span className="p-1 rounded-lg bg-brand-forest text-white group-hover:bg-brand-emerald">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Live Cart & Checkout Panel */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-stone-200/80 flex flex-col justify-between h-fit sticky top-24">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif text-lg font-bold text-brand-emerald flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-brand-forest" />
                Current Sale Cart
              </h3>
              <span className="text-xs text-stone-400 font-bold">{cart.length} item(s)</span>
            </div>

            {/* Customer Switcher */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-1 bg-stone-100 rounded-xl">
                <button
                  onClick={() => setIsWalkIn(true)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    isWalkIn ? 'bg-white text-brand-forest shadow-sm' : 'text-stone-600'
                  }`}
                >
                  Walk-in Guest
                </button>
                <button
                  onClick={() => setIsWalkIn(false)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    !isWalkIn ? 'bg-white text-brand-forest shadow-sm' : 'text-stone-600'
                  }`}
                >
                  Saved Customer
                </button>
              </div>

              {isWalkIn ? (
                <input
                  type="text"
                  placeholder="Guest / Customer Name (e.g. Senthil)"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:bg-white"
                />
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none"
                >
                  <option value="">Select customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.location})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Cart Items List */}
            <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 divide-y divide-stone-100">
              {cart.length > 0 ? (
                cart.map((item, idx) => (
                  <div key={idx} className="pt-2 flex items-center justify-between">
                    <div className="flex-1 pr-2">
                      <p className="text-xs font-bold text-stone-800 line-clamp-1">{item.productName}</p>
                      <p className="text-[11px] text-stone-500 font-serif font-semibold">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateQuantity(idx, -1)}
                        className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-5 text-center">
                        {Math.round(item.subtotal / item.unitPrice)}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(idx, 1)}
                        className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-stone-400 hover:text-rose-600 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-stone-400">
                  <p className="text-xs">No items added to cart</p>
                  <p className="text-[11px] mt-0.5">Click any milk or ghee package on the left</p>
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5 pt-2 border-t border-stone-100">
              <label className="text-xs font-bold text-stone-600 block">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {(['CASH', 'UPI', 'BANK_TRANSFER'] as PaymentMethod[]).map(pm => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setPaymentMethod(pm)}
                    className={`py-1.5 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                      paymentMethod === pm
                        ? 'bg-brand-forest text-white shadow-sm'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {pm === 'BANK_TRANSFER' ? 'BANK' : pm}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Calculation */}
            <div className="pt-3 border-t border-stone-100 space-y-1.5 text-xs font-medium">
              <div className="flex justify-between text-stone-500">
                <span>Subtotal:</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-stone-500">
                <span>Discount (₹):</span>
                <input
                  type="number"
                  value={discount || ''}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-16 px-2 py-0.5 border border-stone-200 rounded-lg text-right text-xs"
                />
              </div>
              <div className="flex justify-between text-base font-bold text-brand-emerald pt-2 border-t border-stone-200">
                <span>Final Payable:</span>
                <span className="font-serif text-xl">{formatCurrency(finalPayable)}</span>
              </div>
            </div>
          </div>

          <div className="pt-5 mt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handleCompleteSale}
              disabled={cart.length === 0}
              className="w-full font-bold shadow-card"
            >
              <CheckCircle2 className="w-4 h-4 mr-2 text-brand-gold" />
              Complete Sale & Print Receipt
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
