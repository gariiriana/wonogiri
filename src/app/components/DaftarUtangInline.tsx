import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Search, User, Calendar, AlertCircle, Phone, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AddTransactionModal } from "./AddTransactionModal";

interface Person {
  id: string;
  name: string;
  nickname?: string;
  phoneNumber?: string;
  photo?: string;
  totalDebt: number;
  lastTransactionDate: string;
  updatedAtTimestamp?: number;
}

export function DaftarUtangInline() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unpaid" | "paid">("all");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "debtors"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const debtorsData: Person[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const updatedAt = data.updatedAt?.toDate();
        const createdAt = data.createdAt?.toDate();
        
        debtorsData.push({
          id: doc.id,
          name: data.name,
          nickname: data.nickname || undefined,
          phoneNumber: data.phoneNumber || undefined,
          photo: data.photoBase64 || undefined,
          totalDebt: data.totalDebt || 0,
          lastTransactionDate: createdAt
            ? createdAt.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "N/A",
          updatedAtTimestamp: updatedAt?.getTime() || 0,
        });
      });

      debtorsData.sort((a, b) => b.updatedAtTimestamp - a.updatedAtTimestamp);
      setPeople(debtorsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredPeople = people.filter((person) => {
    const searchLower = searchTerm.toLowerCase().trim();
    
    // If no search term, apply only status filter
    if (!searchLower) {
      if (filter === "unpaid") {
        return person.totalDebt > 0;
      } else if (filter === "paid") {
        return person.totalDebt === 0;
      }
      return true;
    }
    
    // Check if name matches search (NOT nickname)
    const nameLower = person.name.toLowerCase();
    
    const matchesSearch = nameLower.includes(searchLower);
    
    // Apply status filter
    if (filter === "unpaid") {
      return matchesSearch && person.totalDebt > 0;
    } else if (filter === "paid") {
      return matchesSearch && person.totalDebt === 0;
    }
    
    return matchesSearch;
  });

  const totalDebt = people.reduce((sum, person) => sum + person.totalDebt, 0);
  const unpaidCount = people.filter(p => p.totalDebt > 0).length;
  const paidCount = people.filter(p => p.totalDebt === 0).length;

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

  return (
    <div className="px-1">
      <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-3 md:mb-4 lg:mb-6">Daftar Utang</h2>
      
      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-md p-3 md:p-4 lg:p-5 mb-3 md:mb-4 lg:mb-6 border border-orange-200">
        <div className="flex items-center justify-between gap-3 md:gap-4">
          <div className="flex-1">
            <p className="text-[10px] md:text-xs lg:text-sm text-orange-800 mb-0.5 md:mb-1 font-medium">Total Utang</p>
            <p className="text-lg md:text-2xl lg:text-3xl font-bold text-orange-900 break-all">
              Rp {totalDebt.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] md:text-xs lg:text-sm text-orange-800 mb-0.5 md:mb-1 font-medium">Pelanggan</p>
            <p className="text-lg md:text-2xl lg:text-3xl font-bold text-orange-900">{people.length}</p>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="mb-3 md:mb-4 lg:mb-6">
        <div className="bg-gray-100 rounded-md p-1 flex gap-1 w-full">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 px-2 md:px-3 lg:px-5 py-1.5 md:py-2 lg:py-2.5 rounded text-[10px] md:text-xs lg:text-sm font-semibold transition-all whitespace-nowrap ${
              filter === "all"
                ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span className="hidden md:inline">Semua ({people.length})</span>
            <span className="md:hidden">Semua</span>
          </button>
          <button
            onClick={() => setFilter("unpaid")}
            className={`flex-1 px-2 md:px-3 lg:px-5 py-1.5 md:py-2 lg:py-2.5 rounded text-[10px] md:text-xs lg:text-sm font-semibold transition-all whitespace-nowrap ${
              filter === "unpaid"
                ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span className="hidden md:inline">Belum Lunas ({unpaidCount})</span>
            <span className="md:hidden">Belum ({unpaidCount})</span>
          </button>
          <button
            onClick={() => setFilter("paid")}
            className={`flex-1 px-2 md:px-3 lg:px-5 py-1.5 md:py-2 lg:py-2.5 rounded text-[10px] md:text-xs lg:text-sm font-semibold transition-all whitespace-nowrap ${
              filter === "paid"
                ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span className="hidden md:inline">Sudah Lunas ({paidCount})</span>
            <span className="md:hidden">Lunas ({paidCount})</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-3 md:mb-4 lg:mb-6">
        <div className="relative">
          <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-2 md:py-2.5 lg:py-3 text-xs md:text-sm lg:text-base rounded-md border-2 border-gray-200 focus:border-orange-500 focus:outline-none bg-white shadow-sm transition-colors"
          />
        </div>
      </div>

      {/* People List */}
      <div className="space-y-2 md:space-y-3 lg:space-y-4 max-h-[450px] md:max-h-[500px] overflow-y-auto">
        {filteredPeople.length === 0 ? (
          <div className="bg-gray-50 rounded-md p-6 md:p-8 lg:p-12 text-center">
            <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3 lg:mb-4">
              <AlertCircle className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-gray-400" />
            </div>
            <h3 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900 mb-1 md:mb-2">
              {searchTerm ? "Tidak ada hasil" : "Belum ada data utang"}
            </h3>
            <p className="text-gray-600 text-xs md:text-sm lg:text-base">
              {searchTerm
                ? "Coba kata kunci pencarian yang berbeda"
                : "Mulai catat transaksi utang pelanggan Anda"}
            </p>
          </div>
        ) : (
          filteredPeople.map((person) => (
            <div
              key={person.id}
              className="bg-white rounded-md p-3 md:p-4 lg:p-5 shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-300 transition-all"
            >
              <div
                onClick={() => navigate(`/detail/${person.id}`)}
                className="flex items-center gap-2 md:gap-3 lg:gap-4 cursor-pointer group"
              >
                {/* Photo */}
                <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-md bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                  {person.photo ? (
                    <img
                      src={person.photo}
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-orange-600" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 truncate">
                    {person.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {person.nickname && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                        {person.nickname}
                      </span>
                    )}
                    {person.phoneNumber && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                        <Phone className="w-3 h-3" />
                        {person.phoneNumber}
                      </span>
                    )}
                    {person.totalDebt === 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-800">
                        ✓ Lunas
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{person.lastTransactionDate}</span>
                    </div>
                  </div>
                </div>

                {/* Debt Amount */}
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Total Utang</p>
                  <p className={`text-base sm:text-xl font-bold break-all ${
                    person.totalDebt === 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    Rp {person.totalDebt.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
              
              {/* Add Transaction Button */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPerson(person);
                    setShowAddTransactionModal(true);
                  }}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold px-3 md:px-4 py-2 rounded-md shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Utang
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddTransactionModal && selectedPerson && (
        <AddTransactionModal
          isOpen={showAddTransactionModal}
          onClose={() => {
            setShowAddTransactionModal(false);
            setSelectedPerson(null);
          }}
          onSuccess={() => {
            // Data akan auto-refresh karena Firestore realtime listener
            // Jangan close modal di sini, biar popup success yang handle!
          }}
          debtorId={selectedPerson.id}
          debtorName={selectedPerson.name}
        />
      )}
    </div>
  );
}