import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Calendar, DollarSign, TrendingUp, TrendingDown, PieChart, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface RekapData {
  totalDebt: number; // Total utang dari debtors (yang belum lunas)
  totalPaid: number; // Total pembayaran dari transactions
  remaining: number; // Sisa utang (debtors totalDebt)
}

interface Debtor {
  id: string;
  name: string;
  totalDebt: number;
}

interface Transaction {
  id: string;
  debtorId: string;
  type: "debt" | "payment";
  amount: number;
  date: string;
  note?: string;
}

export function RekapInline() {
  const { user } = useAuth();
  const [rekapData, setRekapData] = useState<RekapData>({
    totalDebt: 0,
    totalPaid: 0,
    remaining: 0,
  });
  const [totalUnpaidDebt, setTotalUnpaidDebt] = useState(0);
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Subscribe to debtors untuk hitung total utang yang belum lunas
    const debtorsQuery = query(
      collection(db, "debtors"),
      where("userId", "==", user.uid)
    );

    const unsubscribeDebtors = onSnapshot(debtorsQuery, (snapshot) => {
      let unpaidTotal = 0;
      const debtorsList: Debtor[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const totalDebt = data.totalDebt || 0;
        if (totalDebt > 0) {
          unpaidTotal += totalDebt;
          debtorsList.push({
            id: doc.id,
            name: data.name || "Unknown",
            totalDebt: totalDebt,
          });
        }
      });
      setTotalUnpaidDebt(unpaidTotal);
      setDebtors(debtorsList);
      console.log("=== TOTAL UNPAID DEBT FROM DEBTORS ===", unpaidTotal);
    });

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalDebt = 0;
      let totalPaid = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const amount = data.amount || 0;
        const type = data.type;

        if (type === "debt") totalDebt += amount;
        if (type === "payment") totalPaid += amount;
      });

      const remaining = totalDebt - totalPaid;

      console.log("=== REKAP DEBUG ===");
      console.log("Total Debt:", totalDebt, "Paid:", totalPaid, "Remaining:", remaining);

      setRekapData({
        totalDebt: totalDebt,
        totalPaid: totalPaid,
        remaining: remaining,
      });

      setLoading(false);
    });

    return () => {
      unsubscribe();
      unsubscribeDebtors();
    };
  }, [user]);

  const data = rekapData;
  const paymentRate = data.totalDebt > 0 ? (data.totalPaid / data.totalDebt) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 font-medium text-sm">Memuat data...</p>
        </div>
      </div>
    );
  }

  const exportPDF = async () => {
    const doc = new jsPDF();
    
    // Fetch all transactions
    const transactionsQuery = query(
      collection(db, "transactions"),
      where("userId", "==", user!.uid)
    );
    const transactionsSnapshot = await getDocs(transactionsQuery);
    const allTransactions: Transaction[] = [];
    
    transactionsSnapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate();
      allTransactions.push({
        id: doc.id,
        debtorId: data.debtorId,
        type: data.type,
        amount: data.amount || 0,
        date: createdAt 
          ? createdAt.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
        note: data.note,
      });
    });
    
    // Current date
    const today = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    
    // Title with date
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN REKAP KEUANGAN", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Tanggal: ${today}`, 14, 28);
    
    // Summary Table
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan Keuangan", 14, 40);
    autoTable(doc, {
      head: [["Keterangan", "Jumlah"]],
      body: [
        ["Total Utang Belum Lunas", `Rp ${totalUnpaidDebt.toLocaleString("id-ID")}`],
        ["Total Dibayar", `Rp ${data.totalPaid.toLocaleString("id-ID")}`],
      ],
      startY: 45,
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [249, 115, 22], // Orange
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
    });
    
    let currentY = (doc as any).lastAutoTable.finalY + 10;
    
    // Detail per Debtor
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Detail Hutang Per Orang", 14, currentY);
    currentY += 5;
    
    for (let i = 0; i < debtors.length; i++) {
      const debtor = debtors[i];
      
      // Check if need new page
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      // Debtor name header
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. ${debtor.name}`, 14, currentY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Total Utang: Rp ${debtor.totalDebt.toLocaleString("id-ID")}`, 14, currentY + 5);
      currentY += 10;
      
      // Get transactions for this debtor
      const debtorTransactions = allTransactions.filter(t => t.debtorId === debtor.id);
      
      if (debtorTransactions.length > 0) {
        const transactionRows = debtorTransactions.map((t) => [
          t.date,
          t.type === "debt" ? "Utang Baru" : "Pembayaran",
          `Rp ${t.amount.toLocaleString("id-ID")}`,
          t.note || "-",
        ]);
        
        autoTable(doc, {
          head: [["Tanggal", "Tipe", "Jumlah", "Catatan"]],
          body: transactionRows,
          startY: currentY,
          theme: "striped",
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [249, 115, 22],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          margin: { left: 14 },
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 8;
      } else {
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text("Belum ada transaksi", 20, currentY);
        currentY += 8;
      }
    }
    
    doc.save(`Laporan_Keuangan_${new Date().toLocaleDateString("id-ID").replace(/\//g, "-")}.pdf`);
  };

  return (
    <div className="max-h-[600px] overflow-y-auto">
      <div className="flex flex-col gap-3 mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Rekap Keuangan</h2>
        </div>
        <div className="flex items-center gap-2 w-full">
          <button 
            onClick={exportPDF}
            className="w-auto sm:flex-none flex items-center justify-center gap-0 sm:gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all hover:scale-105"
          >
            <FileDown className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">PDF</span>
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 sm:mb-6">
        {/* Total Debt Card - Shows TOTAL UNPAID DEBT from all debtors */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-md p-4 sm:p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur rounded flex items-center justify-center">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-xs bg-white/20 backdrop-blur px-2 py-0.5 rounded-full">
              Total
            </span>
          </div>
          <p className="text-red-100 text-xs font-medium mb-1">Total Utang</p>
          <p className="text-xl sm:text-2xl font-bold mb-1 break-all">
            Rp {totalUnpaidDebt.toLocaleString("id-ID")}
          </p>
          <div className="flex items-center gap-2 text-xs text-red-100">
            <div className="w-1.5 h-1.5 bg-red-200 rounded-full animate-pulse"></div>
            <span>Belum dibayar</span>
          </div>
        </div>

        {/* Total Paid Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-md p-4 sm:p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur rounded flex items-center justify-center">
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-xs bg-white/20 backdrop-blur px-2 py-0.5 rounded-full">
              {paymentRate.toFixed(0)}%
            </span>
          </div>
          <p className="text-green-100 text-xs font-medium mb-1">Total Dibayar</p>
          <p className="text-xl sm:text-2xl font-bold mb-1 break-all">
            Rp {data.totalPaid.toLocaleString("id-ID")}
          </p>
          <div className="flex items-center gap-2 text-xs text-green-100">
            <div className="w-1.5 h-1.5 bg-green-200 rounded-full animate-pulse"></div>
            <span>Pembayaran diterima</span>
          </div>
        </div>
      </div>

      {/* Payment Progress */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-md p-4 sm:p-5 mb-4 sm:mb-6 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900">Tingkat Pembayaran</h3>
            <p className="text-xs text-gray-600">Persentase pembayaran dari total utang</p>
          </div>
          <div className="text-right">
            <p className="text-xl sm:text-2xl font-bold text-orange-600">{paymentRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-600">dari total</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
            style={{ width: `${paymentRate}%` }}
          ></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full flex-shrink-0"></div>
            <span className="text-xs text-gray-600 truncate">
              Dibayar: Rp {data.totalPaid.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-gray-300 rounded-full flex-shrink-0"></div>
            <span className="text-xs text-gray-600 truncate">
              Sisa: Rp {data.remaining.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Income vs Debt */}
        <div className="bg-white rounded-md p-4 sm:p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <PieChart className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">Rasio Keuangan</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-xs">Efisiensi Tagihan</span>
              <span className="font-semibold text-gray-900 text-sm">{paymentRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-xs">Utang Tertunda</span>
              <span className="font-semibold text-red-600 text-sm break-all">
                Rp {data.remaining.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-xs">Rata-rata/hari</span>
              <span className="font-semibold text-green-600 text-sm break-all">
                Rp {Math.round(data.totalPaid / 7).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Period Info */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-md p-4 sm:p-5 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-1 text-sm">Periode Laporan</h4>
              <p className="text-xs text-blue-700 mb-2">
                Data seluruh aktivitas keuangan dari awal.
              </p>
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>Real-time update</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}