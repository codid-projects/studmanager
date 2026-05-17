"use client";

import { useMemo } from "react";
import { useLocale } from "@/lib/locale-context";
import {
    X,
    Calendar,
    ChevronDown,
    Trash2,
    Wallet,
    Upload,
    Edit3,
    PlusCircle,
} from "lucide-react";

type ModalType = "add" | "edit" | "delete" | null;

interface ExpensesModalsProps {
    isOpen: boolean;
    type: ModalType;
    onClose: () => void;
    recordData?: any;
    categoryId?: string;
    categoryTitle?: string;
}

interface FieldConfig {
    key: string;
    type: "text" | "date" | "number" | "select" | "file" | "radio";
    placeholderAr: string;
    placeholderEn: string;
    options?: string[];
    fullWidth?: boolean;
    ltr?: boolean;
}

const CATEGORY_FIELDS: Record<string, FieldConfig[]> = {
    subscription: [
        { key: "facilityName", type: "text", placeholderAr: "اسم المنشأة", placeholderEn: "Facility Name", fullWidth: true },
        { key: "startDate", type: "date", placeholderAr: "تاريخ البداية", placeholderEn: "Start Date", ltr: true },
        { key: "endDate", type: "date", placeholderAr: "تاريخ النهاية", placeholderEn: "End Date", ltr: true },
        { key: "cost", type: "number", placeholderAr: "السعر", placeholderEn: "Price", fullWidth: true, ltr: true },
    ],
    purchase: [
        { key: "ownerName", type: "text", placeholderAr: "اسم المالك", placeholderEn: "Owner Name" },
        { key: "horseName", type: "select", placeholderAr: "اختر الخيل", placeholderEn: "Choose Horse", options: ["مداح مهنا", "اسم الخيل"] },
        { key: "cost", type: "number", placeholderAr: "السعر", placeholderEn: "Price", ltr: true },
        { key: "date", type: "date", placeholderAr: "التاريخ", placeholderEn: "Date", ltr: true },
    ],
    nutrition: [
        { key: "date", type: "date", placeholderAr: "التاريخ", placeholderEn: "Date", ltr: true },
        { key: "foodType", type: "select", placeholderAr: "نوع الغذاء", placeholderEn: "Food Type", options: ["علف", "مكمل شهري", "مكمل مهرجانات"] },
        { key: "cost", type: "number", placeholderAr: "السعر", placeholderEn: "Price", fullWidth: true, ltr: true },
    ],
    clinics: [
        { key: "procedureType", type: "select", placeholderAr: "نوع الإجراء", placeholderEn: "Procedure Type", options: ["نوع الأشعة", "نوع التحليل", "نوع الجرعة"] },
        { key: "procedure", type: "select", placeholderAr: "الإجراء", placeholderEn: "Procedure", options: ["أشعة", "تحليل دم", "جرعة الديدان"] },
        { key: "cost", type: "number", placeholderAr: "السعر", placeholderEn: "Price", ltr: true },
        { key: "date", type: "date", placeholderAr: "التاريخ", placeholderEn: "Date", ltr: true },
    ],
    housing: [
        { key: "ownerName", type: "text", placeholderAr: "اسم المالك", placeholderEn: "Owner Name" },
        { key: "horseName", type: "select", placeholderAr: "اختر الخيل", placeholderEn: "Choose Horse", options: ["مداح مهنا", "اسم الخيل"] },
        { key: "checkOutDate", type: "date", placeholderAr: "تاريخ الخروج", placeholderEn: "Check Out Date", ltr: true },
        { key: "checkInDate", type: "date", placeholderAr: "تاريخ الدخول", placeholderEn: "Check In Date", ltr: true },
        { key: "cost", type: "number", placeholderAr: "السعر", placeholderEn: "Price", fullWidth: true, ltr: true },
    ],
    other: [
        { key: "date", type: "date", placeholderAr: "التاريخ", placeholderEn: "Date", ltr: true },
        { key: "procedure", type: "text", placeholderAr: "الإجراء", placeholderEn: "Procedure" },
        { key: "notes", type: "text", placeholderAr: "ملاحظات", placeholderEn: "Notes" },
        { key: "cost", type: "number", placeholderAr: "السعر", placeholderEn: "Price", ltr: true },
    ],
    labor: [
        { key: "jobTitle", type: "text", placeholderAr: "الوظيفة", placeholderEn: "Job Title" },
        { key: "name", type: "text", placeholderAr: "الاسم", placeholderEn: "Name" },
        { key: "salary", type: "number", placeholderAr: "الراتب", placeholderEn: "Salary", ltr: true },
        { key: "workStartDate", type: "date", placeholderAr: "تاريخ بدأ العمل", placeholderEn: "Work Start Date", ltr: true },
        { key: "insuranceType", type: "radio", placeholderAr: "نوع التأمين", placeholderEn: "Insurance Type", options: ["اجتماعي", "طبي"] },
        { key: "insuranceAmount", type: "number", placeholderAr: "التأمين", placeholderEn: "Insurance", ltr: true },
        { key: "attachment", type: "file", placeholderAr: "اختر ملف", placeholderEn: "Choose File", fullWidth: true },
    ],
    equipment: [
        { key: "date", type: "date", placeholderAr: "التاريخ", placeholderEn: "Date", ltr: true },
        { key: "equipmentName", type: "select", placeholderAr: "المعدة", placeholderEn: "Equipment", options: ["سرج", "لجام", "أدوات تدريب"] },
        { key: "cost", type: "number", placeholderAr: "السعر", placeholderEn: "Price", fullWidth: true, ltr: true },
    ],
    transport: [
        { key: "transportMethod", type: "select", placeholderAr: "وسيلة النقل", placeholderEn: "Transport Method", options: ["شاحنة صغيرة", "تريلا", "مقطورة فردية"] },
        { key: "horseName", type: "select", placeholderAr: "اختر الخيل", placeholderEn: "Choose Horse", options: ["اسم الخيل", "مداح مهنا"] },
        { key: "to", type: "text", placeholderAr: "إلى", placeholderEn: "To" },
        { key: "from", type: "text", placeholderAr: "من", placeholderEn: "From" },
        { key: "cost", type: "number", placeholderAr: "السعر", placeholderEn: "Price", ltr: true },
        { key: "date", type: "date", placeholderAr: "التاريخ", placeholderEn: "Date", ltr: true },
    ],
};



const getDefaultValues = (categoryId?: string) => {
    const commonDate = "18 مارس 2025";

    const values: Record<string, any> = {
        subscription: {
            facilityName: "اسم المنشأة",
            startDate: commonDate,
            endDate: commonDate,
            cost: "",
        },
        purchase: {
            ownerName: "محمد",
            horseName: "مداح مهنا",
            date: commonDate,
            cost: "",
        },
        nutrition: {
            foodType: "نوع الغذاء",
            date: "",
            cost: "",
        },
        clinics: {
            procedure: "أشعة",
            procedureType: "نوع الأشعة",
            date: "",
            cost: "",
        },
        housing: {
            ownerName: "محمد",
            horseName: "مداح مهنا",
            checkInDate: "",
            checkOutDate: "",
            cost: "",
        },
        other: {
            procedure: "",
            date: "",
            notes: "",
            cost: "",
        },
        labor: {
            name: "",
            jobTitle: "",
            salary: "",
            workStartDate: "",
            insuranceType: "اجتماعي",
            insuranceAmount: "",
            attachment: "اسم الملف.pdf",
        },
        equipment: {
            equipmentName: "سرج",
            date: "",
            cost: "",
        },
        transport: {
            horseName: "اختر الخيل",
            transportMethod: "وسيلة النقل",
            from: "",
            to: "",
            date: "",
            cost: "",
        },
    };

    return values[categoryId || ""] || {};
};

export const ExpensesModals = ({
    isOpen,
    type,
    onClose,
    recordData,
    categoryId,
    
}: ExpensesModalsProps) => {
    const { direction, locale } = useLocale();
    const isRTL = direction === "rtl";

    const fields = useMemo(() => {
        const originalFields = CATEGORY_FIELDS[categoryId || ""] || [];

        if (direction === "rtl") {
            const reordered: typeof originalFields = [];

            for (let i = 0; i < originalFields.length; i += 2) {
                if (originalFields[i + 1]) {
                    reordered.push(originalFields[i + 1], originalFields[i]);
                } else {
                    reordered.push(originalFields[i]);
                }
            }

            return reordered;
        }

        return originalFields;
    }, [categoryId, direction]);
    const defaultValues = useMemo(() => getDefaultValues(categoryId), [categoryId]);

    if (!isOpen || !type) return null;

    if (type === "delete") {
        return (
            <div
                className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
                dir={direction}
                onMouseDown={(event) => {
                    if (event.target === event.currentTarget) onClose();
                }}
            >
                <div className="bg-white rounded-[32px] w-full max-w-sm p-10 flex flex-col items-center shadow-xl font-cairo">
                    <div className="w-24 h-24 mb-6 text-[#c53b3b]">
                        <Trash2 className="w-full h-full stroke-1" />
                    </div>
                    <h2 className="text-[#2b2a3f] text-3xl font-bold mb-3">
                        {isRTL ? "حذف السجل؟" : "Delete record?"}
                    </h2>
                    <p className="text-gray-500 text-sm mb-10 font-medium">
                        {isRTL ? "لن تتمكن من استعادة هذا السجل" : "You will not be able to restore this record"}
                    </p>

                    <div className="flex gap-4 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                        >
                            {isRTL ? "إلغاء" : "Cancel"}
                        </button>
                        <button className="flex-1 py-3.5 rounded-xl bg-[#b62424] text-white font-bold hover:bg-[#9a1a1a] transition-colors">
                            {isRTL ? "حذف" : "Delete"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const modalTitle =
        type === "add"
            ? isRTL
                ? `اضافة سجل جديد`
                : `Add New Record`
            : isRTL
                ? `تعديل السجل`
                : `Edit Record`;

    const currentData = recordData || defaultValues;

    const renderFieldIcon = (field: FieldConfig) => {
        if (field.type === "date") return <Calendar className="w-5 h-5 text-gray-500" />;
        if (field.type === "number") return <Wallet className="w-5 h-5 text-gray-500" />;
        return null;
    };

    const renderField = (field: FieldConfig) => {
        const placeholder = locale === "ar" ? field.placeholderAr : field.placeholderEn;
        const value = currentData?.[field.key] ?? "";
        const commonClass = `w-full bg-white border border-gray-300 rounded-xl py-4 text-gray-700 outline-none focus:border-[#4b2f1a] ${isRTL ? "text-right" : "text-left"
            } ${field.ltr ? "font-inter" : "font-cairo"}`;

        if (field.type === "select") {
            return (
                <div className={`relative ${field.fullWidth ? "md:col-span-2" : ""}`}>
                    <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none ${isRTL ? "left-4" : "right-4"}`}>
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    </div>
                    <select
                        defaultValue={type === "edit" ? value : ""}
                        className={`${commonClass} appearance-none ${isRTL ? "pr-4 pl-12" : "pl-4 pr-12"}`}
                        dir={direction}
                    >
                        <option value="" disabled>
                            {type === "edit" && value ? value : placeholder}
                        </option>
                        {(field.options || []).map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        if (field.type === "radio") {
            return (
                <div className={`flex items-center gap-5 ${field.fullWidth ? "md:col-span-2" : ""}`}>
                    <span className="text-[#3b2b20] text-sm font-medium whitespace-nowrap">
                        {placeholder}
                    </span>
                    <label className="flex items-center gap-2 text-sm text-[#3b2b20]">
                        <input type="radio" name="insuranceType" defaultChecked className="w-4 h-4" />
                        اجتماعي
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#3b2b20]">
                        <input type="radio" name="insuranceType" className="w-4 h-4" />
                        طبي
                    </label>
                </div>
            );
        }

        if (field.type === "file") {
            return (
                <div className={`${field.fullWidth ? "md:col-span-2" : ""} space-y-3`}>
                    <p className="text-xs text-[#3b2b20]">
                        {isRTL
                            ? "يرجى تحميل نسخة من بطاقة الرقم القومي (وجه وقفا) مدمجة في ملف PDF"
                            : "Please upload a copy of the ID card merged in one PDF file"}
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-12 rounded-xl bg-[#f8f7ee] border border-[#ede7d9] flex items-center px-4 text-sm text-gray-500">
                            {type === "edit" ? "اسم الملف.pdf" : "لم يتم اختيار ملف"}
                        </div>
                        <button
                            type="button"
                            className="h-12 px-5 rounded-xl border border-[#8b7a66] text-[#3b2b20] font-semibold hover:bg-[#f8f6f2] transition-colors"
                        >
                            {isRTL ? "اختر ملف" : "Choose File"}
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className={`relative ${field.fullWidth ? "md:col-span-2" : ""}`}>
                <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none ${isRTL ? "left-4" : "right-4"}`}>
                    {renderFieldIcon(field)}
                </div>
                <input
                    type="text"
                    placeholder={type === "edit" && value ? value : placeholder}
                    defaultValue={type === "edit" && value ? value : ""}
                    className={`${commonClass} ${isRTL ? "pr-4 pl-12" : "pl-4 pr-12"}`}
                    dir={field.ltr ? "ltr" : direction}
                />
            </div>
        );
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto"
            dir={direction}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-[28px] w-full max-w-5xl p-6 md:p-8 relative shadow-xl my-8 font-cairo">
                <div
                    className={`flex items-center mb-8 ${isRTL ? "flex-row-reverse justify-between" : "justify-between flex-row-reverse"
                        }`}
                >
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-2 text-[#2b2a3f]">
                        {type === "add" ? (
                            <PlusCircle className="w-5 h-5 fill-[#3b2b20] text-white stroke-[2.5]" />
                        ) : (
                            <Edit3 className="w-5 h-5" />
                        )}
                        <h2 className="text-2xl font-bold">{modalTitle}</h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mb-10"
                >
                    {fields.map((field) => (
                        <div key={field.key}>{renderField(field)}</div>
                    ))}
                </div>

                <div
                    className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : "flex-row-reverse"
                        }`}
                >
                    <button
                        onClick={type === "add" ? () => { } : onClose}
                        className="px-10 py-3.5 bg-[#3b2b20] text-white rounded-xl font-bold hover:bg-[#2e2119] transition-colors flex items-center gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        {isRTL ? "حفظ" : "Save"}
                    </button>

                    <button
                        onClick={onClose}
                        className="px-10 py-3.5 border border-gray-400 text-[#3b2b20] rounded-xl font-bold hover:bg-gray-50 transition-colors"
                    >
                        {isRTL ? "إلغاء" : "Cancel"}
                    </button>
                </div>
            </div>
        </div>
    );
};
