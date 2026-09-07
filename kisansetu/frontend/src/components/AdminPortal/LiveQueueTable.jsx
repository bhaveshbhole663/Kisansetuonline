import React, { useState } from 'react';
import { 
  Ticket, 
  Search, 
  Filter, 
  ArrowRight, 
  SlidersHorizontal,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck
} from 'lucide-react';

export default function LiveQueueTable({ queue = [], onSelectFarmer }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filtered = queue.filter((item) => {
    const matchSearch = 
      item.token_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.farmer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.crop.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.farmer_mobile.includes(searchTerm);

    const matchChannel = filterChannel === 'ALL' || item.booking_channel === filterChannel;
    const matchStatus = filterStatus === 'ALL' || item.procurement_status === filterStatus;

    return matchSearch && matchChannel && matchStatus;
  });

  const getChannelBadge = (ch) => {
    switch (ch) {
      case 'WEB':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'SMS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IVR':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'WALK_IN':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'SLOT_BOOKED':
        return 'bg-slate-100 text-slate-700';
      case 'ARRIVED':
        return 'bg-amber-100 text-amber-800 font-bold';
      case 'QUALITY_CHECK':
        return 'bg-purple-100 text-purple-800 font-bold';
      case 'WEIGHED':
        return 'bg-blue-100 text-blue-800 font-bold';
      case 'ACCEPTED':
      case 'PAYMENT_PROCESSING':
        return 'bg-indigo-100 text-indigo-800 font-bold';
      case 'PAID':
        return 'bg-emerald-100 text-emerald-800 font-extrabold';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 font-bold';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      
      {/* Header & Controls */}
      <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">Live APMC Queue</h3>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              {filtered.length} Active Records
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time feed showing bookings from Web, SMS, IVR, and Walk-ins
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search token, name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Channel Filter */}
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="p-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden font-medium"
          >
            <option value="ALL">All Channels</option>
            <option value="WEB">Web App</option>
            <option value="SMS">SMS Keypad</option>
            <option value="IVR">IVR Voice</option>
            <option value="WALK_IN">Walk-in Gate</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden font-medium"
          >
            <option value="ALL">All Stages</option>
            <option value="SLOT_BOOKED">Booked</option>
            <option value="ARRIVED">Arrived</option>
            <option value="QUALITY_CHECK">Quality Check</option>
            <option value="WEIGHED">Weighed</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <th className="p-3.5">Token</th>
              <th className="p-3.5">Farmer & Village</th>
              <th className="p-3.5">Produce & Qty</th>
              <th className="p-3.5">Channel</th>
              <th className="p-3.5">Stage / Status</th>
              <th className="p-3.5">Slot Window</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length > 0 ? (
              filtered.map((item) => (
                <tr 
                  key={item.booking_id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  {/* Token */}
                  <td className="p-3.5">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {item.token_number}
                    </span>
                  </td>

                  {/* Farmer */}
                  <td className="p-3.5">
                    <p className="font-bold text-slate-900">{item.farmer_name}</p>
                    <p className="text-[11px] text-slate-500">{item.farmer_mobile} ({item.village})</p>
                  </td>

                  {/* Crop & Quantity */}
                  <td className="p-3.5">
                    <p className="font-semibold text-slate-800">{item.crop}</p>
                    <p className="text-[11px] text-slate-500">{item.quantity} Quintals</p>
                  </td>

                  {/* Channel Badge */}
                  <td className="p-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${getChannelBadge(item.booking_channel)}`}>
                      {item.booking_channel}
                    </span>
                  </td>

                  {/* Procurement Status Badge */}
                  <td className="p-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] ${getStatusBadge(item.procurement_status)}`}>
                      {item.procurement_status.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Slot Window */}
                  <td className="p-3.5 text-slate-600">
                    <div className="flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{item.start_time} - {item.end_time}</span>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => onSelectFarmer(item)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors inline-flex items-center gap-1 shadow-2xs"
                    >
                      <span>Manage</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                  No records matching search or filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
