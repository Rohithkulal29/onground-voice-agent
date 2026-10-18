import React, { useState } from 'react';
import { UserPlus, Sparkles, Store, Phone, Tag, ArrowRight } from 'lucide-react';

const PRESET_BRANCHES = [
  "Rajajinagar Flagship",
  "Indiranagar Store",
  "Koramangala Hub",
  "Whitefield Mall",
  "Jayanagar Boutique"
];

const PRESET_OFFERS = [
  "VIP Fest Preview: 25% Off Ethnic Kurtas & Free Tailoring",
  "Weekend Deal: Buy 1 Get 1 on Activewear + 500 Reward Points",
  "Festive Gold Voucher: Flat ₹1500 Cashback on Min Bill ₹4999",
  "Exclusive Footwear Drop: 20% Off Sneakers for Loyal Members"
];

export default function LeadForm({ onLeadAdded }) {
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+91 ');
  const [storeBranch, setStoreBranch] = useState(PRESET_BRANCHES[0]);
  const [customBranch, setCustomBranch] = useState('');
  const [campaignOffer, setCampaignOffer] = useState(PRESET_OFFERS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePhoneChange = (e) => {
    let val = e.target.value;
    if (!val.startsWith('+91')) {
      val = '+91 ' + val.replace(/^\+?91/, '').trim();
    }
    setPhoneNumber(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!customerName.trim()) {
      setError('Please provide customer name.');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    if (cleanPhone.length < 10) {
      setError('Please provide a valid phone number with country code (e.g., +919876543210).');
      return;
    }

    const finalBranch = storeBranch === 'custom' ? customBranch.trim() : storeBranch;
    if (!finalBranch) {
      setError('Please specify a store branch.');
      return;
    }

    if (!campaignOffer.trim()) {
      setError('Please specify a promotional campaign offer.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onLeadAdded({
        customer_name: customerName.trim(),
        phone_number: cleanPhone,
        store_branch: finalBranch,
        campaign_offer: campaignOffer.trim()
      });

      setSuccess(`Lead for "${customerName}" queued successfully!`);
      setCustomerName('');
      setPhoneNumber('+91 ');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to add lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden mb-8">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Add Campaign Lead</h2>
            <p className="text-xs text-slate-400">Dispatch voice AI agent for personalized in-store retail offers</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Customer Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Vikram Seth"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Phone Number (+91 format)</span>
              <span className="text-[11px] text-slate-400">E.164 standard</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                required
              />
            </div>
          </div>
        </div>

        {/* Store Branch */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span>Target Store Branch</span>
            </label>
            <select
              value={storeBranch}
              onChange={(e) => setStoreBranch(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            >
              {PRESET_BRANCHES.map(b => (
                <option key={b} value={b} className="bg-slate-900 text-white">{b}</option>
              ))}
              <option value="custom" className="bg-slate-900 text-white">+ Custom Branch Name...</option>
            </select>

            {storeBranch === 'custom' && (
              <input
                type="text"
                placeholder="Enter custom branch (e.g. Phoenix Marketcity Store)"
                value={customBranch}
                onChange={(e) => setCustomBranch(e.target.value)}
                className="mt-2 w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            )}
          </div>

          {/* Promotional Offer */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Promotional Campaign Offer</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 25% Off Ethnic Wear VIP Preview"
              value={campaignOffer}
              onChange={(e) => setCampaignOffer(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              required
            />
          </div>
        </div>

        {/* Quick Offer Chips */}
        <div>
          <span className="text-[11px] font-medium text-slate-400 block mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Quick Offer Templates:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_OFFERS.map((offer, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCampaignOffer(offer)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition text-left ${
                  campaignOffer === offer
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {offer.length > 55 ? offer.substring(0, 52) + '...' : offer}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-600/30 transition transform active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Queuing Lead...</span>
              </>
            ) : (
              <>
                <span>Queue Lead for Voice Outreach</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
