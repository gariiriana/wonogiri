import { ArrowLeft, User, Plus, Check, Download, TrendingUp, TrendingDown, Trash2, Phone } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Person } from "@/types/person";
import { useState } from "react";
import { ConfirmModal } from "./ConfirmModal";
import { AddTransactionModal } from "./AddTransactionModal";
import { PaymentOptionModal } from "./PaymentOptionModal";
import { PartialPaymentModal } from "./PartialPaymentModal";

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: "debt" | "payment";
  note?: string; // Keterangan transaksi
  createdAtTimestamp?: number; // Optional for sorting
}

interface DetailOrangProps {
  people: Person[];
  transactions: Record<string, Transaction[]>;
  onAddDebt: (personId: string, amount: number) => void;
  onMarkPaid: (personId: string) => void;
  onPartialPayment: (personId: string, amount: number) => void;
  onDeletePerson: (personId: string) => void;
}

export function DetailOrang({
  people,
  transactions,
  onAddDebt,
  onMarkPaid,
  onPartialPayment,
  onDeletePerson,
}: DetailOrangProps) {
  const { id } = useParams<{ id: string }>();
  const person = people.find((p) => p.id === id);
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [showPaymentOptionModal, setShowPaymentOptionModal] = useState(false);
  const [showPartialPaymentModal, setShowPartialPaymentModal] = useState(false);
  const [showFullPaymentModal, setShowFullPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [debtAmount, setDebtAmount] = useState("");
  const [paymentOption, setPaymentOption] = useState<"full" | "partial">("full");
  const [partialPaymentAmount, setPartialPaymentAmount] = useState("");

  if (!person) {
    return (
      <div className="min-h-screen relative">
        {/* Background Image */}
        <div className="fixed inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1539186206244-a7ad7c037028?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRvbmVzaWFuJTIwcmVzdGF1cmFudCUyMGludGVyaW9yJTIwZWxlZ2FudHxlbnwxfHx8fDE3Njg2OTA1OTd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-10 p-6 flex items-center justify-center min-h-screen">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Orang Tidak Ditemukan</h3>
            <p className="text-gray-600 mb-6">Data pelanggan tidak tersedia</p>
            <Link to="/?tab=daftar">
              <button className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                Kembali ke Daftar
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const personTransactions = transactions[person.id] || [];
  
  // Hitung total utang dan pembayaran dari transaksi (source of truth)
  const totalDebtFromTransactions = personTransactions
    .filter((t) => t.type === "debt")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalPaid = personTransactions
    .filter((t) => t.type === "payment")
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Sisa utang yang sebenarnya
  const actualTotalDebt = totalDebtFromTransactions - totalPaid;

  const handleAddDebt = () => {
    setShowAddDebtModal(true);
  };

  const handleConfirmAddDebt = (amount: number) => {
    onAddDebt(person.id, amount);
  };

  const handleMarkPaid = () => {
    setShowPaymentOptionModal(true);
  };

  const handlePartialPaymentClick = () => {
    setShowPaymentOptionModal(false);
    setShowPartialPaymentModal(true);
  };

  const handleFullPaymentClick = () => {
    setShowPaymentOptionModal(false);
    setShowFullPaymentModal(true);
  };

  const handleConfirmFullPayment = () => {
    onMarkPaid(person.id);
    setShowFullPaymentModal(false);
  };

  const handleConfirmPartialPayment = (amount: number) => {
    onPartialPayment(person.id, amount);
    setShowPartialPaymentModal(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    onDeletePerson(person.id);
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image - Same as HomePage */}
      <div className="fixed inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1539186206244-a7ad7c037028?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRvbmVzaWFuJTIwcmVzdGF1cmFudCUyMGludGVyaW9yJTIwZWxlZ2FudHxlbnwxfHx8fDE3Njg2OTA1OTd8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Header - Transparent with backdrop blur */}
      <div className="relative z-10 bg-white/10 backdrop-blur-xl text-white py-6 px-6 shadow-lg border-b border-white/20">
        <div className="max-w-6xl mx-auto">
          <Link to="/?tab=daftar">
            <button className="mb-4 p-2 text-white hover:bg-white/20 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">Detail Pelanggan</h1>
          <p className="text-white/90 drop-shadow">Informasi lengkap dan riwayat transaksi</p>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Person Info Card */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Photo */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
              {person.photo ? (
                <img
                  src={person.photo}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-orange-600" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{person.name}</h2>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mb-3">
                {person.nickname && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {person.nickname}
                  </span>
                )}
                {person.phoneNumber && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    <Phone className="w-4 h-4" />
                    {person.phoneNumber}
                  </span>
                )}
              </div>
              <p className="text-gray-600">Terakhir transaksi: {person.lastTransactionDate}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-md border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Utang</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 break-all">
              Rp {actualTotalDebt.toLocaleString("id-ID")}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-md border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Dibayar</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 break-all">
              Rp {totalPaid.toLocaleString("id-ID")}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-md border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Download className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Transaksi</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{personTransactions.length}</p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Riwayat Transaksi</h3>
            <span className="text-xs sm:text-sm text-gray-500">{personTransactions.length} transaksi</span>
          </div>

          {personTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">Belum ada transaksi</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {personTransactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  className="p-3 sm:p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start gap-2 sm:gap-4">
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        transaction.type === "debt"
                          ? "bg-red-100"
                          : "bg-green-100"
                      }`}
                    >
                      {transaction.type === "debt" ? (
                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Type & Amount - Side by side on mobile */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base text-gray-900">
                            {transaction.type === "debt" ? "Utang Baru" : "Pembayaran"}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                            {transaction.date}
                          </p>
                        </div>
                        <p
                          className={`text-base sm:text-lg font-bold flex-shrink-0 ${
                            transaction.type === "debt" ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {transaction.type === "debt" ? "+" : "-"}Rp{" "}
                          {transaction.amount.toLocaleString("id-ID")}
                        </p>
                      </div>

                      {/* Note */}
                      {transaction.note && (
                        <div className="mt-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
                          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words">
                            {transaction.note}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleAddDebt}
            className="bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl py-4 px-6 shadow-lg hover:shadow-xl transition-all font-semibold flex items-center justify-center gap-3"
          >
            <Plus className="w-6 h-6" />
            Tambah Utang
          </button>

          <button
            onClick={handleMarkPaid}
            disabled={actualTotalDebt === 0}
            className={`rounded-xl py-4 px-6 shadow-lg transition-all font-semibold flex items-center justify-center gap-3 ${
              actualTotalDebt === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-green-600 to-green-500 text-white hover:shadow-xl"
            }`}
          >
            <Check className="w-6 h-6" />
            Bayar / Lunas
          </button>

          <button
            onClick={handleDeleteClick}
            className="bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl py-4 px-6 shadow-lg hover:shadow-xl transition-all font-semibold flex items-center justify-center gap-3"
          >
            <Trash2 className="w-6 h-6" />
            Hapus Pelanggan
          </button>
        </div>
      </div>

      {/* Add Debt Modal */}
      <AddTransactionModal
        isOpen={showAddDebtModal}
        onClose={() => setShowAddDebtModal(false)}
        onSuccess={() => {
          // Data akan auto-refresh karena props dari parent
          // Jangan close modal di sini, biar popup success yang handle!
        }}
        debtorId={person.id}
        debtorName={person.name}
      />

      {/* Payment Option Modal */}
      <PaymentOptionModal
        isOpen={showPaymentOptionModal}
        onClose={() => setShowPaymentOptionModal(false)}
        onPartialPayment={handlePartialPaymentClick}
        onFullPayment={handleFullPaymentClick}
        personName={person.name}
        totalDebt={actualTotalDebt}
      />

      {/* Partial Payment Modal */}
      <PartialPaymentModal
        isOpen={showPartialPaymentModal}
        onClose={() => setShowPartialPaymentModal(false)}
        onConfirm={handleConfirmPartialPayment}
        personName={person.name}
        totalDebt={actualTotalDebt}
      />

      {/* Full Payment Confirmation Modal */}
      <ConfirmModal
        isOpen={showFullPaymentModal}
        onClose={() => setShowFullPaymentModal(false)}
        onConfirm={handleConfirmFullPayment}
        title="Konfirmasi Pelunasan"
        message={`Lunasi semua utang ${person.name} (Rp ${actualTotalDebt.toLocaleString("id-ID")})?`}
        type="success"
        confirmText="Ya, Lunas"
      />

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Penghapusan"
        message={`Hapus pelanggan ${person.name}?`}
        type="danger"
        confirmText="Ya, Hapus"
      />
    </div>
  );
}