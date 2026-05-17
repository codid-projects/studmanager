export interface Member {
  id: string;
  name: string;
  role: string;
  username: string;
  password: string;
}

export type TaskStatus = 'inProgress' | 'completed' | 'delayed' | 'awaitingApproval';

export interface TeamTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  assignee: string;
}

export const roleOptions = ['مدير المزرعة', 'مساعد مدير المزرعة', 'طبيب بيطري', 'مدرب', 'عامل'];

export const emptyMemberForm = {
  name: '',
  role: roleOptions[0],
  username: '',
  password: '',
};

export type MemberFormState = typeof emptyMemberForm;

export const emptyTaskForm = {
  title: '',
  description: '',
  dueDate: '',
  status: 'inProgress' as TaskStatus,
  assignee: '',
};

export type TaskFormState = typeof emptyTaskForm;

export const initialMembers: Member[] = [
  { id: '1', name: 'محمد', role: 'مدير المزرعة', username: 'mohammed 123', password: '123456' },
  { id: '2', name: 'محمد', role: 'مساعد مدير المزرعة', username: 'mohammed 123', password: '123456' },
  { id: '3', name: 'محمد', role: 'طبيب بيطري', username: 'mohammed 123', password: '123456' },
  { id: '4', name: 'محمد', role: 'مدرب', username: 'mohammed 123', password: '123456' },
  { id: '5', name: 'محمد', role: 'عامل', username: 'mohammed 123', password: '123456' },
  { id: '6', name: 'محمد', role: 'عامل', username: 'mohammed 123', password: '123456' },
  { id: '7', name: 'محمد', role: 'عامل', username: 'mohammed 123', password: '123456' },
  { id: '8', name: 'محمد', role: 'عامل', username: 'mohammed 123', password: '123456' },
  { id: '9', name: 'محمد', role: 'عامل', username: 'mohammed 123', password: '123456' },
  { id: '10', name: 'محمد', role: 'عامل', username: 'mohammed 123', password: '123456' },
];

export const initialTasks: TeamTask[] = [
  {
    id: '1',
    title: 'مراجعة جدول العلف',
    description: 'مراجعة الكمية اليومية ومطابقة السجل مع خطة التغذية لهذا الأسبوع.',
    dueDate: '18/9/2025',
    status: 'inProgress',
    assignee: 'محمد صالح',
  },
  {
    id: '2',
    title: 'مراجعة المخزن',
    description: 'حصر العناصر الناقصة وتأكيد الجاهزية قبل التوريد القادم.',
    dueDate: '18/9/2025',
    status: 'completed',
    assignee: 'سعد علي',
  },
  {
    id: '3',
    title: 'تطعيم الخيل',
    description: 'الانتهاء من جرعات التطعيم ومراجعة الملاحظات الطبية بعد التنفيذ.',
    dueDate: '18/9/2025',
    status: 'delayed',
    assignee: 'عبدالله حسن',
  },
  {
    id: '4',
    title: 'تحديث السجلات',
    description: 'إضافة البيانات الناقصة للمتابعة الصحية وربطها بملفات الفريق.',
    dueDate: '18/9/2025',
    status: 'delayed',
    assignee: 'إبراهيم خالد',
  },
  {
    id: '5',
    title: 'مراجعة المعدات',
    description: 'فحص أدوات العناية اليومية والتأكد من جاهزيتها قبل الجولة الصباحية.',
    dueDate: '18/9/2025',
    status: 'completed',
    assignee: 'محمد صالح',
  },
  {
    id: '6',
    title: 'تجهيز التقرير الأسبوعي',
    description: 'تلخيص المهام المنفذة ونسبة الإنجاز ورفع التقرير للإدارة.',
    dueDate: '18/9/2025',
    status: 'completed',
    assignee: 'يوسف طارق',
  },
  {
    id: '7',
    title: 'متابعة تنظيف الإسطبل',
    description: 'التأكد من تنفيذ خطة التنظيف المسائية وتسجيل أي ملاحظات.',
    dueDate: '18/9/2025',
    status: 'completed',
    assignee: 'رامي سعد',
  },
  {
    id: '8',
    title: 'مراجعة خطة التدريب',
    description: 'مقارنة الجلسات المجدولة مع حالة الخيل وتعديل الملاحظات عند الحاجة.',
    dueDate: '18/9/2025',
    status: 'completed',
    assignee: 'محمد صالح',
  },
  {
    id: '9',
    title: 'فحص نقاط المياه',
    description: 'مراجعة المضخات ومستوى التزويد داخل الحظائر الرئيسية.',
    dueDate: '18/9/2025',
    status: 'completed',
    assignee: 'أحمد طارق',
  },
  {
    id: '10',
    title: 'اعتماد طلب المستلزمات',
    description: 'مراجعة الطلب النهائي وإرساله لاعتماد الإدارة قبل الشراء.',
    dueDate: '18/9/2025',
    status: 'awaitingApproval',
    assignee: 'محمد صالح',
  },
];
