"use client";

import { useLocale } from "@/lib/locale-context";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  Edit,
} from "lucide-react";
import { useState } from "react";
import { PerformanceModals } from "./PerformanceModals";

interface PerformanceCategoryTableProps {
  categoryId: string;
}

interface ColumnConfig {
  key: string;
  label: string;
}

const CATEGORY_CONFIG: Record<
  string,
  { titleAr: string; titleEn: string; columns: ColumnConfig[] }
> = {
  trainings: {
    titleAr: "التدريبات",
    titleEn: "Trainings",
    columns: [
      { key: "horseName", label: "اسم الخيل" },
      { key: "trainerName", label: "اسم المدرب" },
      { key: "trainerNumber", label: "رقم المدرب" },
      { key: "trainingType", label: "نوع التدريب" },
      { key: "duration", label: "مدة التدريب" },
      { key: "date", label: "تاريخ التدريب" },
      { key: "cost", label: "التكلفة" },
    ],
  },
  competitions: {
    titleAr: "المسابقات",
    titleEn: "Competitions",
    columns: [
      { key: "horseName", label: "اسم الخيل" },
      { key: "competitionName", label: "اسم المسابقة" },
      { key: "location", label: "المكان" },
      { key: "rank", label: "المركز" },
      { key: "date", label: "التاريخ" },
      { key: "cost", label: "التكلفة" },
    ],
  },
  haircut: {
    titleAr: "قص الشعر",
    titleEn: "Haircut",
    columns: [
      { key: "horseName", label: "اسم الخيل" },
      { key: "barberName", label: "اسم الحلاق" },
      { key: "type", label: "نوع القص" },
      { key: "date", label: "التاريخ" },
      { key: "cost", label: "التكلفة" },
    ],
  },
};

const DEFAULT_CONFIG = {
  titleAr: "سجل الأداء",
  titleEn: "Performance Record",
  columns: [
    { key: "horseName", label: "اسم الخيل" },
    { key: "date", label: "التاريخ" },
    { key: "cost", label: "التكلفة" },
  ],
};

const getMockData = (columns: ColumnConfig[]) => {
  return Array.from({ length: 8 }).map((_, i) => {
    const row: any = { id: i + 1 };
    columns.forEach((col) => {
      switch (col.key) {
        case "horseName":
          row[col.key] = "اسم الخيل";
          break;
        case "trainerName":
          row[col.key] = "اسم المدرب";
          break;
        case "trainerNumber":
          row[col.key] = "01010101010";
          break;
        case "trainingType":
          row[col.key] = "نوع التدريب";
          break;
        case "duration":
          row[col.key] = `${150 - i * 10} دقيقة`;
          break;
        case "date":
          row[col.key] = "18/9/2025";
          break;
        case "cost":
          row[col.key] = "200$";
          break;
        case "competitionName":
          row[col.key] = "بطولة الإستعراض";
          break;
        case "location":
          row[col.key] = "الرياض";
          break;
        case "rank":
          row[col.key] = `${i + 1}`;
          break;
        case "barberName":
          row[col.key] = "أحمد";
          break;
        case "type":
          row[col.key] = "قص كامل";
          break;
        default:
          row[col.key] = "بيانات";
      }
    });
    return row;
  });
};

export const PerformanceCategoryTable = ({
  categoryId,
}: PerformanceCategoryTableProps) => {
  const { direction } = useLocale();
  const isRTL = direction === "rtl";
  const [currentPage, setCurrentPage] = useState(1);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "add" | "edit" | "delete" | null;
    record: any;
  }>({
    isOpen: false,
    type: null,
    record: null,
  });

  const config = CATEGORY_CONFIG[categoryId] || DEFAULT_CONFIG;
  const columns = config.columns;
  const mockData = getMockData(columns);

  const openModal = (type: "add" | "edit" | "delete", record: any = null) => {
    setModalState({ isOpen: true, type, record });
  };
  const closeModal = () => {
    setModalState({ isOpen: false, type: null, record: null });
  };

  return (
    <div
      className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm font-cairo"
      dir={direction}
    >
      <div className="flex flex-col gap-3 mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-[#3b2b20]">
          {isRTL ? config.titleAr : config.titleEn}
        </h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-[150px]">
            <input
              type="text"
              placeholder={isRTL ? "البحث" : "Search"}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#4b2f1a] transition-colors pr-10"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <button
            onClick={() => openModal("add")}
            className="bg-[#3b2b20] text-white px-3 sm:px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1 sm:gap-2 hover:bg-[#2e2119] transition-colors whitespace-nowrap"
          >
            <span className="text-lg leading-none">+</span>
            <span className="hidden sm:inline">
              {isRTL ? "إضافة سجل جديد" : "Add New Record"}
            </span>
            <span className="sm:hidden">{isRTL ? "إضافة" : "Add"}</span>
          </button>
          <button className="p-2 sm:p-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
          <button className="p-2 sm:p-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
            <Download className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-[#4b2f1a] text-white text-sm">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="py-4 px-4 font-semibold text-right"
                >
                  {col.label}
                </th>
              ))}
              <th className="py-4 px-4 font-semibold text-center rounded-l-xl">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((row, index) => (
              <tr
                key={row.id}
                className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-[#fdfbf7]"}`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`py-4 px-4 text-right ${col.key === "horseName" ? "text-[#3b2b20] font-medium" : "text-gray-600"}`}
                  >
                    {row[col.key]}
                  </td>
                ))}
                <td className="py-4 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => openModal("edit", row)}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openModal("delete", row)}
                      className="p-1.5 text-[#e53e3e] hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center mt-8 gap-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {isRTL ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
        {[1, 2, 3, 4, 5].map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`w-8 h-8 rounded-full text-sm transition-colors ${currentPage === page ? "bg-[#3b2b20] text-white" : "text-gray-600 hover:bg-gray-50 bg-white border border-gray-200"}`}
          >
            {page}
          </button>
        ))}
        <span className="text-gray-400 tracking-widest px-1">...</span>
        <button
          onClick={() => setCurrentPage(32)}
          className={`w-8 h-8 rounded-full text-sm transition-colors ${currentPage === 32 ? "bg-[#3b2b20] text-white" : "text-gray-600 hover:bg-gray-50 bg-white border border-gray-200"}`}
        >
          32
        </button>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(32, prev + 1))}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {isRTL ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      <PerformanceModals
        isOpen={modalState.isOpen}
        type={modalState.type}
        onClose={closeModal}
        recordData={modalState.record}
        categoryTitle={isRTL ? config.titleAr : config.titleEn}
      />
    </div>
  );
};
