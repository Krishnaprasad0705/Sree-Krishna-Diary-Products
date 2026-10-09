import React, { useState, useEffect } from 'react';
import { Customer, CustomerCategory, PricingModel, DeliverySchedule } from '../../types';
import { useStore } from '../../lib/store';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../common/Toast';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  customerToEdit
}) => {
  const { addCustomer, updateCustomer, addSubscription, getSubscriptionByCustomerId, updateSubscription, settings } = useStore();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [category, setCategory] = useState<CustomerCategory>('REGULAR');
  const [notes, setNotes] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  // Subscription setup
  const [enableSubscription, setEnableSubscription] = useState(true);
  const [pricingModel, setPricingModel] = useState<PricingModel>('ACTUAL_DELIVERY');
  const [expectedDailyQuantityMl, setExpectedDailyQuantityMl] = useState<number>(1000);
  const [fixedMonthlyAmount, setFixedMonthlyAmount] = useState<number>(1800);
  const [schedule, setSchedule] = useState<DeliverySchedule>('EVERYDAY');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name);
      setPhone(customerToEdit.phone);
      setAddress(customerToEdit.address);
      setLocation(customerToEdit.location);
      setDeliveryInstructions(customerToEdit.deliveryInstructions || '');
      setCategory(customerToEdit.category);
      setNotes(customerToEdit.notes || '');
      setOpeningBalance(customerToEdit.openingBalance || 0);

      const sub = getSubscriptionByCustomerId(customerToEdit.id);
      if (sub) {
        setEnableSubscription(true);
        setPricingModel(sub.pricingModel);
        setExpectedDailyQuantityMl(sub.expectedDailyQuantityMl);
        setFixedMonthlyAmount(sub.fixedMonthlyAmount || 1800);
        setSchedule(sub.schedule);
        setStartDate(sub.startDate);
      } else {
        setEnableSubscription(false);
      }
    } else {
      // Reset defaults for new
      setName('');
      setPhone('');
      setAddress('');
      setLocation('Gandhi Road');
      setDeliveryInstructions('');
      setCategory('REGULAR');
      setNotes('');
      setOpeningBalance(0);
      setEnableSubscription(true);
      setPricingModel('ACTUAL_DELIVERY');
      setExpectedDailyQuantityMl(1000);
      setFixedMonthlyAmount(1800);
      setSchedule('EVERYDAY');
      setStartDate(new Date().toISOString().split('T')[0]);
    }
  }, [customerToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      showToast('Please enter Customer Name and Phone Number', 'error');
      return;
    }

    if (customerToEdit) {
      updateCustomer(customerToEdit.id, {
        name,
        phone,
        address,
        location,
        deliveryInstructions,
        category,
        notes,
        openingBalance
      });

      const existingSub = getSubscriptionByCustomerId(customerToEdit.id);
      if (enableSubscription && category === 'REGULAR') {
        if (existingSub) {
          updateSubscription(existingSub.id, {
            pricingModel,
            expectedDailyQuantityMl,
            fixedMonthlyAmount: pricingModel === 'FIXED_RECURRING' ? fixedMonthlyAmount : undefined,
            schedule,
            startDate
          });
        } else {
          addSubscription({
            customerId: customerToEdit.id,
            pricingModel,
            expectedDailyQuantityMl,
            fixedMonthlyAmount: pricingModel === 'FIXED_RECURRING' ? fixedMonthlyAmount : undefined,
            status: 'ACTIVE',
            schedule,
            startDate,
            notes: 'Created during customer update'
          });
        }
      }

      showToast(`Customer "${name}" updated successfully`);
    } else {
      const created = addCustomer({
        name,
        phone,
        address: address || 'Kanchipuram',
        location: location || 'Main Town',
        deliveryInstructions,
        category,
        status: 'ACTIVE',
        notes,
        openingBalance
      });

      if (enableSubscription && category === 'REGULAR') {
        addSubscription({
          customerId: created.id,
          pricingModel,
          expectedDailyQuantityMl,
          fixedMonthlyAmount: pricingModel === 'FIXED_RECURRING' ? fixedMonthlyAmount : undefined,
          status: 'ACTIVE',
          schedule,
          startDate,
          notes: 'Configured during customer creation'
        });
      }

      showToast(`Customer "${name}" created successfully`);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customerToEdit ? 'Edit Customer Profile' : 'Add New Customer'}
      subtitle="Fill in customer contact details and optional monthly subscription plan"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-emerald">
            1. Personal & Contact Information
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 98402 11223"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Street / Door Address
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. No. 12, Sannathi Street"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Village / Location / Area
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Gandhi Road / Temple Sannathi"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Delivery Instructions (Optional)
            </label>
            <input
              type="text"
              value={deliveryInstructions}
              onChange={e => setDeliveryInstructions(e.target.value)}
              placeholder="e.g. Leave in stainless steel can at doorstep before 6:30 AM"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Customer Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as CustomerCategory)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest outline-none"
              >
                <option value="REGULAR">Regular Subscription Customer</option>
                <option value="OCCASIONAL">Occasional / Walk-in Buyer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Opening Balance (₹)
              </label>
              <input
                type="number"
                value={openingBalance}
                onChange={e => setOpeningBalance(parseFloat(e.target.value) || 0)}
                placeholder="0 (Positive = Owes, Negative = Advance Credit)"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest outline-none"
              />
              <span className="text-[10px] text-stone-400">
                Positive = Previous dues. Negative = Advance customer credit.
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Section (if Regular) */}
        {category === 'REGULAR' && (
          <div className="space-y-4 pt-4 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-emerald">
                2. Monthly Milk Subscription Setup
              </h4>
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSubscription}
                  onChange={e => setEnableSubscription(e.target.checked)}
                  className="rounded text-brand-forest focus:ring-brand-forest"
                />
                <span>Enable Subscription</span>
              </label>
            </div>

            {enableSubscription && (
              <div className="p-4 rounded-2xl bg-brand-cream/30 border border-brand-cream space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Pricing Billing Model
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`p-3 rounded-xl border flex flex-col cursor-pointer transition-all ${
                        pricingModel === 'ACTUAL_DELIVERY'
                          ? 'bg-white border-brand-forest shadow-sm ring-1 ring-brand-forest'
                          : 'bg-stone-50 border-stone-200 text-stone-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="pricingModel"
                          value="ACTUAL_DELIVERY"
                          checked={pricingModel === 'ACTUAL_DELIVERY'}
                          onChange={() => setPricingModel('ACTUAL_DELIVERY')}
                          className="text-brand-forest"
                        />
                        <span className="text-xs font-bold text-stone-900">Model A: Actual Delivery</span>
                      </div>
                      <span className="text-[11px] text-stone-500 mt-1 pl-5">
                        Customer is charged per recorded delivery and extra portions at standard rates.
                      </span>
                    </label>

                    <label
                      className={`p-3 rounded-xl border flex flex-col cursor-pointer transition-all ${
                        pricingModel === 'FIXED_RECURRING'
                          ? 'bg-white border-brand-forest shadow-sm ring-1 ring-brand-forest'
                          : 'bg-stone-50 border-stone-200 text-stone-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="pricingModel"
                          value="FIXED_RECURRING"
                          checked={pricingModel === 'FIXED_RECURRING'}
                          onChange={() => setPricingModel('FIXED_RECURRING')}
                          className="text-brand-forest"
                        />
                        <span className="text-xs font-bold text-stone-900">Model B: Fixed Recurring</span>
                      </div>
                      <span className="text-[11px] text-stone-500 mt-1 pl-5">
                        Agreed fixed monthly price. Extra milk & ghee are added separately.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Expected Daily Milk Quantity
                    </label>
                    <select
                      value={expectedDailyQuantityMl}
                      onChange={e => setExpectedDailyQuantityMl(parseInt(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm outline-none"
                    >
                      <option value={250}>250 ml (Quarter Litre)</option>
                      <option value={500}>500 ml (Half Litre)</option>
                      <option value={750}>750 ml (3/4 Litre)</option>
                      <option value={1000}>1.0 Litre (Standard)</option>
                      <option value={1500}>1.5 Litres</option>
                      <option value={2000}>2.0 Litres</option>
                      <option value={5000}>5.0 Litres (Bulk/Temple)</option>
                    </select>
                  </div>

                  {pricingModel === 'FIXED_RECURRING' && (
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Fixed Monthly Rate (₹)
                      </label>
                      <input
                        type="number"
                        value={fixedMonthlyAmount}
                        onChange={e => setFixedMonthlyAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Subscription Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {customerToEdit ? 'Save Changes' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
