import { Users, Plus, BarChart3, Wallet, TrendingUp, LogOut, Home, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { DaftarUtangInline } from "./DaftarUtangInline";
import { RekapInline } from "./RekapInline";
import { AddDebtModal } from "./AddDebtModal";
import { ConfirmModal } from "./ConfirmModal";
import { useSearchParams } from "react-router-dom";

interface HomePageProps {
  todayTotal: number;
  todayCount: number;
}

type TabType = "dashboard" | "catat" | "daftar" | "rekap";

export function HomePage({ todayTotal, todayCount }: HomePageProps) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabType) || "dashboard";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalUtang, setTotalUtang] = useState(0);
  const [monthlyTransactions, setMonthlyTransactions] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (!user) return;

    // Listen to all debtors
    const debtorsQuery = query(
      collection(db, "debtors"),
      where("userId", "==", user.uid)
    );

    const unsubscribeDebtors = onSnapshot(debtorsQuery, (snapshot) => {
      let total = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        total += data.totalDebt || 0;
      });
      setTotalCustomers(snapshot.size);
      setTotalUtang(total);
    });

    // Listen to monthly transactions
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const transactionsQuery = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid)
    );

    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      let count = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate();
        if (createdAt && createdAt >= monthAgo) {
          count++;
        }
      });
      setMonthlyTransactions(count);
    });

    return () => {
      unsubscribeDebtors();
      unsubscribeTransactions();
    };
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const navItems = [
    { id: "dashboard" as TabType, label: "Dashboard", icon: Home },
    { id: "catat" as TabType, label: "Catat Utang", icon: Plus },
    { id: "daftar" as TabType, label: "Daftar Utang", icon: FileText },
    { id: "rekap" as TabType, label: "Rekap Keuangan", icon: BarChart3 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-4 sm:space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Today's Total Card */}
              <div className="bg-white/90 backdrop-blur-xl rounded-lg p-5 sm:p-8 shadow-xl border border-white/60 hover:shadow-2xl transition-all">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1 sm:mb-2">
                      Total Utang Belum Dibayar
                    </p>
                    <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 break-all">
                      Rp {todayTotal.toLocaleString("id-ID")}
                    </h2>
                  </div>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0 ml-2">
                    <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm mt-3 sm:mt-4">
                  <span className="inline-flex items-center px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                    Belum Lunas
                  </span>
                  <span className="text-gray-600 font-medium text-xs sm:text-sm">Sisa utang</span>
                </div>
              </div>

              {/* Today's Count Card */}
              <div className="bg-white/90 backdrop-blur-xl rounded-lg p-5 sm:p-8 shadow-xl border border-white/60 hover:shadow-2xl transition-all">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1 sm:mb-2">
                      Pelanggan Belum Lunas
                    </p>
                    <h2 className="text-3xl sm:text-5xl font-bold text-gray-900">
                      {todayCount} Orang
                    </h2>
                  </div>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0 ml-2">
                    <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm mt-3 sm:mt-4">
                  <span className="inline-flex items-center px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                    Aktif
                  </span>
                  <span className="text-gray-600 font-medium text-xs sm:text-sm">Masih punya utang</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white/90 backdrop-blur-xl rounded-lg p-4 sm:p-8 shadow-xl border border-white/60">
              <div className="grid grid-cols-2 gap-4 sm:gap-8">
                <div className="text-center">
                  <p className="text-gray-500 text-[10px] sm:text-sm font-semibold uppercase tracking-wide mb-1 sm:mb-2 leading-tight">Total<br className="sm:hidden" />Pelanggan</p>
                  <p className="text-2xl sm:text-5xl font-bold text-orange-600">{totalCustomers}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-[10px] sm:text-sm font-semibold uppercase tracking-wide mb-1 sm:mb-2 leading-tight">Transaksi<br className="sm:hidden" />Bulan Ini</p>
                  <p className="text-2xl sm:text-5xl font-bold text-orange-600">{monthlyTransactions}</p>
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <div className="bg-blue-500/20 backdrop-blur-xl border border-white/40 rounded-lg p-4 sm:p-6 shadow-xl">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm sm:text-base font-bold text-white mb-1 drop-shadow">Tips Profesional</h4>
                  <p className="text-xs sm:text-sm text-white/90 font-medium drop-shadow">
                    Selalu catat transaksi setiap hari dan lakukan rekonsiliasi mingguan untuk menjaga akurasi data keuangan Anda.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case "catat":
        return (
          <div className="bg-white/90 backdrop-blur-xl rounded-lg p-6 sm:p-8 shadow-xl border border-white/60">
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                <Plus className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Catat Utang Baru</h2>
              <p className="text-gray-600 mb-6 sm:mb-8 font-medium text-sm sm:text-base">
                Tambahkan transaksi utang baru untuk pelanggan Anda
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all"
              >
                Buka Form Catat Utang
              </button>
            </div>
          </div>
        );
      
      case "daftar":
        return (
          <div className="bg-white/95 backdrop-blur-xl rounded p-3 md:p-6 lg:p-8 shadow-xl border border-white/60">
            <DaftarUtangInline />
          </div>
        );
      
      case "rekap":
        return (
          <div className="bg-white/95 backdrop-blur-xl rounded p-3 md:p-6 lg:p-8 shadow-xl border border-white/60">
            <RekapInline />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image - No Blur, No Overlay */}
      <div className="fixed inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1539186206244-a7ad7c037028?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRvbmVzaWFuJTIwcmVzdGF1cmFudCUyMGludGVyaW9yJTIwZWxlZ2FudHxlbnwxfHx8fDE3Njg2OTA1OTd8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Transparent Blur Navbar */}
      <nav className="sticky top-0 z-50 bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-4 lg:px-6 py-3 md:py-3 lg:py-4">
          <div className="flex items-center justify-between gap-3 mb-3 md:mb-3 lg:mb-4">
            <div className="flex items-center gap-2.5 md:gap-2.5 lg:gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-white/20 backdrop-blur rounded-md flex items-center justify-center flex-shrink-0">
                <Wallet className="w-4 h-4 md:w-5 md:h-5 lg:w-7 lg:h-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm md:text-lg lg:text-2xl font-bold text-white drop-shadow-lg truncate">Catatan Utang Warung</h1>
                <p className="text-[10px] md:text-xs lg:text-sm text-white/90 drop-shadow hidden lg:block">Kelola keuangan dengan mudah & profesional</p>
              </div>
            </div>
            <button
              onClick={() => setIsConfirmModalOpen(true)}
              className="flex items-center gap-1 md:gap-1.5 lg:gap-2 px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur rounded-md text-white text-xs md:text-sm lg:text-base font-medium transition-all shadow-lg flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" />
              <span className="hidden lg:inline">Keluar</span>
            </button>
          </div>

          {/* Navigation Tabs - Grid on mobile, flex on desktop */}
          <div className="grid grid-cols-4 gap-1 md:gap-1.5 lg:flex lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              // Short labels for mobile
              const mobileLabel = {
                dashboard: "Home",
                catat: "Catat",
                daftar: "Daftar",
                rekap: "Rekap"
              }[item.id];
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex flex-col lg:flex-row items-center justify-center gap-0.5 md:gap-1 lg:gap-2 px-1.5 md:px-2 lg:px-6 py-1.5 md:py-2 lg:py-3 rounded-md font-bold text-[9px] md:text-[10px] lg:text-base transition-all ${
                    isActive
                      ? "bg-white text-orange-600 shadow-lg"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                  <span className="lg:hidden">{mobileLabel}</span>
                  <span className="hidden lg:inline whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {renderContent()}
      </div>

      {/* Add Debt Modal */}
      <AddDebtModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          setIsSuccessModalOpen(true);
        }}
      />

      {/* Confirm Logout Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleLogout}
        title="Konfirmasi Keluar"
        message="Yakin ingin keluar?"
      />

      {/* Success Modal */}
      <ConfirmModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        onConfirm={() => {
          setIsSuccessModalOpen(false);
          setActiveTab("daftar");
        }}
        title="Berhasil!"
        message="Data utang telah ditambahkan ke daftar utang"
        type="success"
        confirmText="Lihat Daftar Utang"
        cancelText="Tutup"
      />
    </div>
  );
}