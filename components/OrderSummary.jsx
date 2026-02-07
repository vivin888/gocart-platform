'use client'
import { PlusIcon, SquarePenIcon, XIcon } from 'lucide-react';
import React, { useState } from 'react'
import AddressModal from './AddressModal';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Protect, useUser, useAuth } from '@clerk/nextjs';
import axios from 'axios';
import { clearCart } from '@/lib/features/cart/cartSlice';
import { uploadCart } from '@/lib/features/cart/cartSlice';

const OrderSummary = ({ totalPrice = 0, items = [] }) => {

  const { user } = useUser();
  const { getToken } = useAuth();
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';
  const router = useRouter();
  const dispatch = useDispatch();

  const addressList = useSelector(state => state.address?.list || []);

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [coupon, setCoupon] = useState(null);

  const handleCouponCode = async (event) => {
    event.preventDefault();
    try {
      if (!user) return toast('Please login to proceed');

      const token = await getToken();
      const { data } = await axios.post(
        '/api/coupon',
        { code: couponCodeInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCoupon(data.coupon);
      toast.success('Coupon applied successfully');
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    try {
      if (!user) return toast('Please login to place an order');
      if (!selectedAddress) return toast('Please select an address');

      const token = await getToken();

      const orderData = {
        addressId: selectedAddress.id,
        items,
        paymentMethod,
        coupon,
      };

      const { data } = await axios.post(
        '/api/orders',
        orderData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (paymentMethod === 'STRIPE') {
        if (!data?.url) {
          throw new Error('Stripe URL not received');
        }
        window.location.href = data.url;
      } 
      
      else {
        toast.success('Order placed successfully');

        
        dispatch(clearCart());

       
        dispatch(uploadCart({ getToken }));

        router.push('/orders');
      }

    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    }
  };

  return (
    <div className='w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-7'>
      <h2 className='text-xl font-medium text-slate-600'>Payment Summary</h2>

      {/* PAYMENT METHOD */}
      <p className='text-slate-400 text-xs my-4'>Payment Method</p>
      <div className='flex gap-2 items-center'>
        <input type="radio" id="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
        <label htmlFor="COD">COD</label>
      </div>
      <div className='flex gap-2 items-center mt-1'>
        <input type="radio" id="STRIPE" checked={paymentMethod === 'STRIPE'} onChange={() => setPaymentMethod('STRIPE')} />
        <label htmlFor="STRIPE">Stripe Payment</label>
      </div>

      {/* ADDRESS */}
      <div className='my-4 py-4 border-y border-slate-200'>
        <p>Address</p>
        {selectedAddress ? (
          <div className='flex gap-2 items-center'>
            <p>{selectedAddress.name}, {selectedAddress.city}</p>
            <SquarePenIcon size={18} onClick={() => setSelectedAddress(null)} />
          </div>
        ) : (
          <>
            {addressList.length > 0 && (
              <select
                className='border p-2 w-full my-3'
                onChange={(e) => setSelectedAddress(addressList[e.target.value])}
              >
                <option value="">Select Address</option>
                {addressList.map((addr, i) => (
                  <option key={i} value={i}>{addr.name}, {addr.city}</option>
                ))}
              </select>
            )}
            <button onClick={() => setShowAddressModal(true)} className='flex gap-1'>
              Add Address <PlusIcon size={18} />
            </button>
          </>
        )}
      </div>

      {/* COUPON */}
      <div className='pb-4 border-b border-slate-200'>
        {!coupon ? (
          <form onSubmit={handleCouponCode} className='flex gap-2'>
            <input
              value={couponCodeInput}
              onChange={(e) => setCouponCodeInput(e.target.value)}
              placeholder='Coupon Code'
              className='border p-2 w-full'
            />
            <button className='bg-slate-700 text-white px-3 rounded'>Apply</button>
          </form>
        ) : (
          <div className='flex justify-between items-center text-xs mt-2'>
            <p>{coupon.code}</p>
            <XIcon size={16} onClick={() => setCoupon(null)} />
          </div>
        )}
      </div>

      {/* TOTAL */}
      <div className='flex justify-between py-4'>
        <p>Total:</p>
        <p className='font-medium'>
          {currency}
          {coupon
            ? (totalPrice + 5 - (coupon.discount / 100) * totalPrice).toFixed(2)
            : (totalPrice + 5).toFixed(2)}
        </p>
      </div>

      <button
        onClick={handlePlaceOrder}
        className='w-full bg-slate-700 text-white py-2.5 rounded'
      >
        Place Order
      </button>

      {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} />}
    </div>
  );
};

export default OrderSummary;
