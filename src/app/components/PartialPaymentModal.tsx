import { X, CreditCard, AlertCircle } from "lucide-react";
import { useState } from "react";

interface PartialPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  personName: string;
  totalDebt: number;
}

export function PartialPaymentModal({
  isOpen,
  onClose,
  onConfirm,
  personName,
  totalDebt,
}: PartialPaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setAmount(value);
    setError("");
  };

  const handleConfirm = () => {
    const numAmount = parseInt(amount);

    if (!amount || numAmount <= 0) {
      setError("Masukkan jumlah pembayaran!");
      return;
    }

    if (numAmount > totalDebt) {
      setError("Jumlah bayar tidak boleh lebih besar dari total utang!");
      return;
    }

    onConfirm(numAmount);
    setAmount("");
    setError("");
  };

  const handleClose = () => {
    setAmount("");
    setError("");
    onClose();
  };

  const formattedAmount = amount ? parseInt(amount).toLocaleString("id-ID") : "0";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 rounded-t-2xl relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold">Bayar Sebagian</h3>
          </div>
          <p className="text-white/90 text-sm">
            {personName}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Total Utang Info */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-700 mb-1 font-medium">Total Utang Saat Ini</p>
            <p className="text-2xl font-bold text-red-600">
              Rp {totalDebt.toLocaleString("id-ID")}
            </p>
          </div>

          {/* Input Jumlah Bayar */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Jumlah Pembayaran
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                autoFocus
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                Rp
              </div>
            </div>
            
            {/* Preview Formatted */}
            <div className="mt-2 text-right">
              <p className="text-sm text-gray-600">
                = <span className="font-bold text-blue-600">Rp {formattedAmount}</span>
              </p>
            </div>
          </div>

          {/* Sisa Utang Preview */}
          {amount && parseInt(amount) > 0 && parseInt(amount) <= totalDebt && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-green-700 mb-1 font-medium">Sisa Utang Setelah Bayar</p>
              <p className="text-2xl font-bold text-green-600">
                Rp {(totalDebt - parseInt(amount)).toLocaleString("id-ID")}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              Konfirmasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
