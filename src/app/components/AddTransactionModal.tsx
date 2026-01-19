import { useState } from "react";
import { X, Plus, CheckCircle } from "lucide-react";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtorId: string;
  debtorName: string;
  onSuccess: () => void;
}

export function AddTransactionModal({ isOpen, onClose, debtorId, debtorName, onSuccess }: AddTransactionModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Jumlah utang tidak valid");
      return;
    }

    if (!note.trim()) {
      setError("Keterangan harus diisi");
      return;
    }

    if (!user) {
      setError("User tidak terautentikasi");
      return;
    }

    setLoading(true);

    try {
      // Add new transaction
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        debtorId: debtorId,
        debtorName: debtorName,
        amount: Number(amount),
        type: "debt",
        note: note.trim(),
        createdAt: serverTimestamp(),
      });

      // Update debtor's total debt
      const debtorRef = doc(db, "debtors", debtorId);
      await updateDoc(debtorRef, {
        totalDebt: increment(Number(amount)),
        updatedAt: serverTimestamp(),
      });

      // Reset form
      setAmount("");
      setNote("");
      setLoading(false);
      
      // Trigger success callback to refresh data
      onSuccess();
      
      // Show success popup (TIDAK AUTO CLOSE!)
      setShowSuccess(true);
    } catch (err) {
      console.error("Error adding transaction:", err);
      setError("Gagal menambahkan utang. Silakan coba lagi.");
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setNote("");
    setError("");
    onClose();
  };

  return (
    <>
      {/* Modal Tambah Utang - Hanya render kalau isOpen */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white p-5 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Tambah Utang</h2>
                <p className="text-orange-100 text-sm mt-0.5">{debtorName}</p>
              </div>
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Jumlah Utang
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lg font-semibold text-gray-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-14 pr-4 py-3 text-xl font-semibold rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Keterangan
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Contoh: Beli beras 5kg, minyak goreng 2L, telur 1kg"
                  rows={4}
                  className="w-full p-3 text-base rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none resize-none transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1.5">Jelaskan barang/item yang diutang</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 px-6 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl py-3 px-6 shadow-lg hover:shadow-xl transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Tambah
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUCCESS POPUP - Muncul di atas modal form */}
      {showSuccess && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            {/* Icon Success */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            {/* Text */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Berhasil!
            </h3>
            <p className="text-gray-600 mb-6">
              Utang tambahan telah ditambahkan
            </p>
            
            {/* Button OKE */}
            <button
              onClick={() => {
                setShowSuccess(false);
                onClose();
              }}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
            >
              OKE
            </button>
          </div>
        </div>
      )}
    </>
  );
}