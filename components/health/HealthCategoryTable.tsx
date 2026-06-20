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
import { BloodTestModals } from "./BloodTestModals"; // Assuming generic usage for now

interface HealthCategoryTableProps {
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
  "blood-tests": {
    titleAr: "تحليل الدم",
    titleEn: "Blood Tests",
    columns: [
      { key: "horseName", label: "اسم الخيل" },
      { key: "reason", label: "سبب سحب العينة" },
      { key: "labName", label: "اسم المختبر" },
      { key: "followUpNumber", label: "رقم المتابعة" },
      { key: "date", label: "تاريخ سحب العينة" },
      { key: "cost", label: "التكلفة" },
      { key: "fileName", label: "ملف مرفق" },
    ],
  },
  medications: {
    titleAr: "الأدوية",
    titleEn: "Medications",
    columns: [
      { key: "horseName", label: "اسم الخيل" },
      { key: "treatingName", label: "اسم المعالج" },
      { key: "treatingNumber", label: "رقم المعالج" },
      { key: "reason", label: "سبب العلاج" },
      { key: "treatmentType", label: "نوع العلاج" },
      { key: "date", label: "تاريخ العلاج" },
      { key: "cost", label: "التكلفة" },
    ],
  },
  "worm-doses": {
    titleAr: "جرعة الديدان",
    titleEn: "Worming Doses",
    columns: [
      { key: "horseName", label: "اسم الخيل" },
      { key: "treatingName", label: "مقدم الرعاية" },
      { key: "reason", label: "نوع الجرعة" },
      { key: "date", label: "التاريخ" },
      { key: "cost", label: "التكلفة" },
    ],
  },
  "hoof-care": {
    titleAr: "العناية بالحافر والساق",
    titleEn: "Hoof & Leg Care",
    columns: [
      { key: "horseName", label: "اسم الخيل" },
      { key: "reason", label: "الإجراء" },
      { key: "treatingName", label: "المعالج" },
      { key: "date", label: "التاريخ" },
      { key: "cost", label: "التكلفة" },
    ],
  },
  injuries: {
    titleAr: "الإصابات",
    titleEn: "Injuries",
    columns: [
      { key: "horseName", label: "اسم الخيل" },
      { key: "reason", label: "نوع الإصابة" },
      { key: "treatmentType", label: "خطة العلاج" },
      { key: "date", label: "تاريخ الإصابة" },
      { key: "cost", label: "التكلفة" },
    ],
  },
  "vet-care": {
    titleAr: "الرعاية البيطرية",
    titleEn: "Veterinary Care",
    columns: [
      { key: "horseName", label: "اسم الخيل" },
      { key: "treatingName", label: "الطبيب البيطري" },
      { key: "treatmentType", label: "التشخيص" },
      { key: "date", label: "التاريخ" },
      { key: "cost", label: "التكلفة" },
    ],
  },
  "weight-height": {
    titleAr: "الوزن والطول",
    titleEn: "Weight & Height",
    columns: [
      { key: "horseName", label: "اسم الخيل" },
      { key: "weight", label: "الوزن" },
      { key: "height", label: "الطول" },
      { key: "date", label: "تاريخ القياس" },
    ],
  },
  "x-rays": {
    titleAr: "الأشعة",
    titleEn: "X-Rays",
    columns: [
      { key: "horseName", label: "اسم الخيل" },
      { key: "labName", label: "اسم المركز" },
      { key: "reason", label: "سبب الأشعة" },
      { key: "date", label: "التاريخ" },
      { key: "cost", label: "التكلفة" },
      { key: "fileName", label: "صورة الأشعة" },
    ],
  },
  vaccinations: {
    titleAr: "التطعيمات",
    titleEn: "Vaccinations",
    columns: [
      { key: "horseName", label: "اسم الخيل" },
      { key: "treatmentType", label: "نوع التطعيم" },
      { key: "treatingName", label: "المعالج" },
      { key: "date", label: "التاريخ" },
      { key: "cost", label: "التكلفة" },
    ],
  },
};

const DEFAULT_CONFIG = {
  titleAr: "السجل الطبي",
  titleEn: "Medical Record",
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
        case "reason":
          row[col.key] =
            col.label.includes("سبب") || col.label.includes("نوع")
              ? col.label.includes("علاج") || col.label.includes("إصابة")
                ? "إلتواء"
                : "سبب سحب العينة"
              : "نص تجريبي";
          break;
        case "labName":
          row[col.key] = "اسم المختبر";
          break;
        case "followUpNumber":
          row[col.key] = "01010101010";
          break;
        case "date":
          row[col.key] = "18/9/2025";
          break;
        case "cost":
          row[col.key] = "200$";
          break;
        case "fileName":
          row[col.key] = "اسم الملف .pdf";
          break;
        case "treatingName":
          row[col.key] = "اسم المعالج";
          break;
        case "treatingNumber":
          row[col.key] = "01010101010";
          break;
        case "treatmentType":
          row[col.key] = "نوع العلاج";
          break;
        case "weight":
          row[col.key] = "500 كجم";
          break;
        case "height":
          row[col.key] = "165 سم";
          break;
        default:
          row[col.key] = "بيانات";
      }
    });

    return row;
  });
};

export const HealthCategoryTable = ({
  categoryId,
}: HealthCategoryTableProps) => {
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
      className="bg-white rounded-[2rem] p-4 sm:p-8 shadow-sm font-cairo border border-[#f3ece7]"
      dir={direction}
    >
      {/* Header Area */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
        <h2 className="text-2xl font-bold text-[#3b2b20] whitespace-nowrap">
          {isRTL ? config.titleAr : config.titleEn}
        </h2>

        <div className="flex flex-col sm:flex-row w-full xl:w-auto items-stretch sm:items-center gap-4">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-80">
            <input
              type="text"
              placeholder={isRTL ? "البحث" : "Search"}
              className="w-full bg-[#fdfbf9] border border-[#ece2da] rounded-2xl px-5 py-3 text-sm outline-none focus:border-[#4b2f1a] transition-all shadow-sm pr-12"
            />
            <Search
              className={`absolute ${isRTL ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a7a6d]`}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Add Record Button */}
            <button
              onClick={() => openModal("add")}
              className="flex-1 sm:flex-initial bg-[#3b2b20] text-white px-6 py-3 rounded-2xl font-bold text-[1.05rem] flex items-center justify-center gap-2 hover:bg-[#2e2119] transition-all whitespace-nowrap shadow-md active:scale-95"
            >
              <span className="text-xl leading-none">+</span>
              {isRTL ? "إضافة سجل جديد" : "Add New Record"}
            </button>

            {/* Action Icons */}
            <button className="p-3 bg-white border border-[#ece2da] rounded-2xl hover:bg-gray-50 transition-all shadow-sm text-[#8a7a6d]">
              <Trash2 className="w-5 h-5" />
            </button>
            <button className="p-3 bg-white border border-[#ece2da] rounded-2xl hover:bg-gray-50 transition-all shadow-sm text-[#8a7a6d]">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Area */}
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
                className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? "bg-white" : "bg-[#fdfbf7]"
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`py-4 px-4 text-right ${col.key === "horseName" ? "text-[#3b2b20] font-medium" : "text-gray-600"}`}
                  >
                    {col.key === "fileName" ? (
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        {row[col.key]}
                      </div>
                    ) : (
                      row[col.key]
                    )}
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

      {/* Pagination */}
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
            className={`w-8 h-8 rounded-full text-sm transition-colors ${
              currentPage === page
                ? "bg-[#3b2b20] text-white"
                : "text-gray-600 hover:bg-gray-50 bg-white border border-gray-200"
            }`}
          >
            {page}
          </button>
        ))}

        <span className="text-gray-400 tracking-widest px-1">...</span>

        <button
          onClick={() => setCurrentPage(32)}
          className={`w-8 h-8 rounded-full text-sm transition-colors ${
            currentPage === 32
              ? "bg-[#3b2b20] text-white"
              : "text-gray-600 hover:bg-gray-50 bg-white border border-gray-200"
          }`}
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

      <BloodTestModals
        isOpen={modalState.isOpen}
        type={modalState.type}
        onClose={closeModal}
        recordData={modalState.record}
        categoryTitle={isRTL ? config.titleAr : config.titleEn}
      />
    </div>
  );
};
