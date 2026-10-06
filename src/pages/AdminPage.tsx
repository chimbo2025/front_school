import React, { useEffect, useRef, useState } from 'react';
import { 
  Users, 
  BarChart3, 
  Layers, 
  Plus, 
  Search, 
  RefreshCw, 
  Phone, 
  Eye, 
  Trash2,
  TrendingUp,
  Menu,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTsh, formatNumber } from '../config/schoolConfig';
import { FeeGroup } from '../types';
import { GradeFeeAccordion } from '../components/GradeFeeAccordion';
import { AdminGradePanel } from '../components/AdminGradePanel';
import { AdminSidebar, AdminNavItem, AdminTab } from '../components/AdminSidebar';
import { AdminRegisterForm } from '../components/AdminRegisterForm';
import { TablePagination } from '../components/TablePagination';

import { LogOut, User as UserIcon } from 'lucide-react';
import { User as UserType } from '../services/auth';

interface AdminPageProps {
  onNavigate: (path: string) => void;
  onOpenFeesModal: () => void;
  onLogout: () => void;
  user: UserType | null;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate, onOpenFeesModal, user, onLogout }) => {
  const { 
    grades, 
    students, 
    payments, 
    loading,
    error,
    addGrade, 
    updateStudentStatus,
    deleteStudent,
    getGradeById,
    getStudentTotalFees,
    getStudentPaidAmount,
    getStudentBalance,
    financeSummary,
    monthlyCollections,
    feeTypeBreakdown,
    refetch
  } = useApp();

  const VALID_TABS: AdminTab[] = ['students', 'finance', 'grades', 'register'];

  // Deep link support: /admin?tab=finance (used by the student file sidebar)
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (typeof window === 'undefined') return 'students';
    const requested = new URLSearchParams(window.location.search).get('tab');
    return VALID_TABS.includes(requested as AdminTab) ? (requested as AdminTab) : 'students';
  });
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Grades & Fees: which grade row is unfolded
  const [openGradeId, setOpenGradeId] = useState<string | null>(null);

  // Students Tab State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Students table pagination
  const [studentPage, setStudentPage] = useState(1);
  const [studentPageSize, setStudentPageSize] = useState(10);
  const studentsTableRef = useRef<HTMLDivElement | null>(null);

  // Grades Tab State
  const [isAddGradeModalOpen, setIsAddGradeModalOpen] = useState(false);
  const [newGradeName, setNewGradeName] = useState('');
  const [newGradeAge, setNewGradeAge] = useState('');
  const [newGradeDescription, setNewGradeDescription] = useState('');
  const [newGradeFeeGroups, setNewGradeFeeGroups] = useState<
    { name: string; items: { label: string; amount: number }[] }[]
  >([
    {
      name: 'SCHOOL FEE',
      items: [{ label: 'Tuition Fee', amount: 1200000 }]
    },
    {
      name: 'TRANSPORT FEE',
      items: [{ label: 'School Bus Transport', amount: 600000 }]
    },
    {
      name: 'ADMISSION FEE',
      items: [{ label: 'Registration & Admin', amount: 150000 }]
    }
  ]);

  // Filter students
  const filteredStudents = students.filter((stu) => {
    const matchesSearch = 
      stu.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stu.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stu.applicationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stu.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stu.parentPhone.includes(searchQuery);

    const matchesGrade = filterGrade === 'ALL' || stu.gradeId === filterGrade;
    const matchesStatus = filterStatus === 'ALL' || stu.status === filterStatus;

    return matchesSearch && matchesGrade && matchesStatus;
  });

  // Paginate the filtered result set
  const studentTotalPages = Math.max(1, Math.ceil(filteredStudents.length / studentPageSize));
  const studentCurrentPage = Math.min(Math.max(1, studentPage), studentTotalPages);
  const pagedStudents = filteredStudents.slice(
    (studentCurrentPage - 1) * studentPageSize,
    studentCurrentPage * studentPageSize
  );

  // Jump back to the first page whenever the filters change
  useEffect(() => {
    setStudentPage(1);
  }, [searchQuery, filterGrade, filterStatus, studentPageSize]);

  const goToStudentPage = (page: number) => {
    setStudentPage(page);
    requestAnimationFrame(() => {
      studentsTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // Finance: payments table pagination
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentPageSize, setPaymentPageSize] = useState(10);
  const paymentsTotalPages = Math.max(1, Math.ceil(payments.length / paymentPageSize));
  const paymentCurrentPage = Math.min(Math.max(1, paymentPage), paymentsTotalPages);
  const pagedPayments = payments.slice(
    (paymentCurrentPage - 1) * paymentPageSize,
    paymentCurrentPage * paymentPageSize
  );

  // Calculate student status badge styling
  const getStatusTag = (stu: (typeof students)[0]) => {
    const paid = getStudentPaidAmount(stu.id);
    const balance = getStudentBalance(stu.id);

    if (stu.status === 'Admitted') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-[#16a34a] border border-emerald-200">
          Admitted
        </span>
      );
    }
    if (stu.status === 'Paid') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-[#16a34a] border border-emerald-200">
          Paid
        </span>
      );
    }
    if (paid > 0 && balance > 0) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
          Partial ({formatNumber(paid)})
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
        Pending
      </span>
    );
  };

  // Add Grade Form Handlers
  const handleAddFeeGroup = () => {
    setNewGradeFeeGroups((prev) => [
      ...prev,
      { name: 'OTHER FEE', items: [{ label: 'General Fee Item', amount: 100000 }] }
    ]);
  };

  const handleAddFeeItem = (groupIndex: number) => {
    setNewGradeFeeGroups((prev) => {
      const updated = [...prev];
      updated[groupIndex].items.push({ label: 'New Fee Item', amount: 50000 });
      return updated;
    });
  };

  const handleRemoveFeeItem = (groupIndex: number, itemIndex: number) => {
    setNewGradeFeeGroups((prev) => {
      const updated = [...prev];
      updated[groupIndex].items.splice(itemIndex, 1);
      return updated;
    });
  };

  const handleUpdateItem = (groupIndex: number, itemIndex: number, field: 'label' | 'amount', value: string | number) => {
    setNewGradeFeeGroups((prev) => {
      const updated = [...prev];
      if (field === 'label') {
        updated[groupIndex].items[itemIndex].label = String(value);
      } else {
        updated[groupIndex].items[itemIndex].amount = Number(value) || 0;
      }
      return updated;
    });
  };

  const handleCreateGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGradeName.trim()) return;

    const formattedFeeGroups: FeeGroup[] = newGradeFeeGroups.map((fg, gIdx) => ({
      id: `fg-new-${Date.now()}-${gIdx}`,
      name: fg.name.toUpperCase().trim(),
      items: fg.items.map((it, iIdx) => ({
        id: `item-new-${Date.now()}-${gIdx}-${iIdx}`,
        label: it.label.trim(),
        amount: Number(it.amount) || 0,
      }))
    }));

    addGrade({
      name: newGradeName.trim(),
      ageRange: newGradeAge.trim() || undefined,
      description: newGradeDescription.trim() || undefined,
      feeGroups: formattedFeeGroups,
    });

    setIsAddGradeModalOpen(false);
    setNewGradeName('');
    setNewGradeAge('');
    setNewGradeDescription('');
  };

  // Calculate live total for the new grade form
  const newGradeTotal = newGradeFeeGroups.reduce((accG, g) => {
    return accG + g.items.reduce((accI, i) => accI + (Number(i.amount) || 0), 0);
  }, 0);

  const navItems: AdminNavItem[] = [
    {
      id: 'students',
      label: 'Students',
      hint: 'Applications & files',
      icon: Users,
      badge: String(students.length),
      badgeClassName: 'bg-slate-700 text-slate-200',
    },
    {
      id: 'finance',
      label: 'Finance',
      hint: 'Collections & receipts',
      icon: BarChart3,
      badge: `${financeSummary.collectionRate}%`,
      badgeClassName: 'bg-emerald-500/15 text-emerald-300',
    },
    {
      id: 'grades',
      label: 'Grades & Fees',
      hint: 'Fee structures',
      icon: Layers,
      badge: String(grades.length),
      badgeClassName: 'bg-slate-700 text-slate-200',
      children: [
        { id: 'grades', label: 'All Grades & Fee Structures' },
        { id: 'register', label: 'Register New Student' },
        { id: 'grades', label: 'Preview Fee Statement', action: 'preview-fees' },
      ],
    },
  ];

  const tabMeta: Record<AdminTab, { title: string; crumb: string }> = {
    students: { title: 'Applications & Students', crumb: 'Students' },
    finance: { title: 'Finance & Collections', crumb: 'Finance' },
    grades: { title: 'Grades & Fee Structures', crumb: 'Grades & Fees' },
    register: { title: 'Register New Student', crumb: 'Grades & Fees / Register' },
  };

  const handleResetData = () => {
    if (confirm('Reset application state? This will re-seed data from backend.')) {
      refetch();
    }
  };

  // Mobile drawer: close on Escape and lock background scroll
  useEffect(() => {
    if (!isMobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileNavOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isMobileNavOpen]);

  const sidebarProps = {
    items: navItems,
    activeTab,
    onSelectTab: setActiveTab,
    onPreviewFees: onOpenFeesModal,
    onBackToSite: () => onNavigate('/'),
    user,
    onLogout,
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* ===== FLUSH-LEFT FULL-HEIGHT SIDEBAR (desktop) ===== */}
      <aside className="hidden lg:block w-64 xl:w-72 shrink-0 h-screen sticky top-0 z-30 border-r border-slate-800 shadow-xl">
        <AdminSidebar {...sidebarProps} />
      </aside>

      {/* ===== MOBILE DRAWER (same sidebar) ===== */}
      {isMobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="relative h-full w-72 max-w-[85vw] shadow-2xl">
            <AdminSidebar {...sidebarProps} onClose={() => setIsMobileNavOpen(false)} />
          </div>
        </div>
      )}

      {/* ===== RIGHT COLUMN: header + content ===== */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Slim sticky top bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            {/* Mobile: hamburger + brand */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                <span className="hidden sm:inline">Admin Console</span>
                <span className="hidden sm:inline">/</span>
                <span className="truncate text-slate-600">{tabMeta[activeTab].crumb}</span>
              </div>
              <h1 className="truncate text-base sm:text-lg font-bold tracking-tight text-slate-900">
                {tabMeta[activeTab].title}
              </h1>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('register')}
                className="flex items-center gap-1.5 rounded-xl bg-[#7c3aed] px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#6d28d9]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Register Student</span>
                <span className="sm:hidden">Register</span>
              </button>
              <button
                onClick={handleResetData}
                title="Reset Sample Data"
                aria-label="Reset sample data"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mobile / tablet tab switcher */}
          <div className="lg:hidden flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.id === activeTab;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[#7c3aed] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <div className="mx-auto w-full max-w-[1400px]">
            {loading && (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-slate-600">Loading data from server...</p>
                </div>
              </div>
            )}
            {error && !loading && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2 text-red-700">
                  <span className="text-xl">⚠</span>
                  <span className="font-medium">{error}</span>
                </div>
                <button
                  onClick={refetch}
                  className="mt-2 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            )}
          
          {/* ================= TAB 1: APPLICATIONS & STUDENTS ================= */}
          {activeTab === 'students' && (
            <div className="space-y-5">
              {/* Summary strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Files
                  </div>
                  <div className="text-xl font-extrabold font-mono text-slate-900 mt-0.5">
                    {students.length}
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Pending Review
                  </div>
                  <div className="text-xl font-extrabold font-mono text-amber-600 mt-0.5">
                    {students.filter((s) => s.status === 'Pending').length}
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Admitted
                  </div>
                  <div className="text-xl font-extrabold font-mono text-[#16a34a] mt-0.5">
                    {students.filter((s) => s.status === 'Admitted').length}
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Showing
                  </div>
                  <div className="text-xl font-extrabold font-mono text-[#7c3aed] mt-0.5">
                    {filteredStudents.length}
                    <span className="text-xs font-semibold text-slate-400 ml-1">
                      of {students.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student name, parent, phone, or application #..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Filter by Grade */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <span className="text-xs text-slate-500 shrink-0 font-medium">Grade:</span>
                  <select
                    value={filterGrade}
                    onChange={(e) => setFilterGrade(e.target.value)}
                    className="flex-1 md:flex-initial px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:ring-2 focus:ring-[#7c3aed]"
                  >
                    <option value="ALL">All Grades ({students.length})</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter by Status */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <span className="text-xs text-slate-500 shrink-0 font-medium">Status:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="flex-1 md:flex-initial px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:ring-2 focus:ring-[#7c3aed]"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Admitted">Admitted</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div
                ref={studentsTableRef}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-24"
              >
                {filteredStudents.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 space-y-2">
                    <Users className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">No students match current filter</p>
                    <p className="text-xs text-slate-400">Try changing search query or grade selector.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                          <th className="px-4 sm:px-6 py-3.5">Student / App No</th>
                          <th className="px-4 py-3.5">Grade</th>
                          <th className="px-4 py-3.5">Parent & Phone</th>
                          <th className="px-4 py-3.5">Financials</th>
                          <th className="px-4 py-3.5">Status</th>
                          <th className="px-4 py-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pagedStudents.map((stu) => {
                          const grade = getGradeById(stu.gradeId);
                          const total = getStudentTotalFees(stu.id);
                          const paid = getStudentPaidAmount(stu.id);
                          const balance = getStudentBalance(stu.id);

                          return (
                            <tr
                              key={stu.id}
                              onClick={() => onNavigate(`/admin/students/${stu.id}`)}
                              className="hover:bg-purple-50/40 transition-colors cursor-pointer group"
                            >
                              {/* Student Name & App No */}
                              <td className="px-4 sm:px-6 py-3.5">
                                <div className="font-bold text-slate-900 group-hover:text-[#7c3aed] transition-colors text-sm">
                                  {stu.firstName} {stu.middleName ? `${stu.middleName} ` : ''}{stu.lastName}
                                </div>
                                <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                                  {stu.applicationNo} · {stu.gender}
                                </div>
                              </td>

                              {/* Grade */}
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <span className="inline-block bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                                  {grade?.name || 'Class'}
                                </span>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {stu.academicYear}
                                </div>
                              </td>

                              {/* Parent & Phone */}
                              <td className="px-4 py-3.5">
                                <div className="font-medium text-slate-800">{stu.parentName}</div>
                                <a
                                  href={`tel:${stu.parentPhone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-emerald-700 font-mono text-[11px] hover:underline flex items-center gap-1 mt-0.5"
                                >
                                  <Phone className="w-3 h-3" />
                                  {stu.parentPhone}
                                </a>
                              </td>

                              {/* Financials */}
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="font-mono text-slate-800">
                                  Paid: <strong className="text-emerald-700">{formatNumber(paid)}</strong>
                                </div>
                                <div className="font-mono text-[11px] text-slate-500">
                                  Total: {formatNumber(total)} Tsh
                                </div>
                              </td>

                              {/* Status */}
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                {getStatusTag(stu)}
                              </td>

                              {/* Action */}
                              <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => onNavigate(`/admin/students/${stu.id}`)}
                                    className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-purple-100/60 rounded-lg transition-colors"
                                    title="View Student File"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Remove student ${stu.firstName} from records?`)) {
                                        deleteStudent(stu.id);
                                      }
                                    }}
                                    className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Student"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {filteredStudents.length > 0 && (
                  <TablePagination
                    page={studentCurrentPage}
                    pageSize={studentPageSize}
                    totalItems={filteredStudents.length}
                    onPageChange={goToStudentPage}
                    onPageSizeChange={setStudentPageSize}
                    itemLabel="students"
                  />
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 2: FINANCE ================= */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              {/* Descriptive bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                  Live revenue metrics, fee collection progress, and recent receipts across Zanzibar
                  mobile money & banks.
                </p>
                <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 shrink-0">
                  Currency: Tanzanian Shilling (TZS)
                </div>
              </div>

              {/* 4 Analysis Cards: Expected, Collected, Outstanding, Collection Rate */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Total Expected */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Expected Fees
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 mt-1">
                    {formatTsh(financeSummary.totalExpected)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Across {students.length} enrolled student files
                  </div>
                </div>

                {/* 2. Total Collected */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Collected
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#16a34a] mt-1">
                    {formatTsh(financeSummary.totalCollected)}
                  </div>
                  <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{payments.length} verified transactions</span>
                  </div>
                </div>

                {/* 3. Outstanding */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Outstanding Balance
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-amber-600 mt-1">
                    {formatTsh(financeSummary.outstanding)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Pending termly installments
                  </div>
                </div>

                {/* 4. Collection Rate */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Collection Rate
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#7c3aed] mt-1">
                    {financeSummary.collectionRate}%
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-[#7c3aed] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, financeSummary.collectionRate)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Charts Row: Monthly Collections Bar Chart + Fee-Type Pie Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Monthly Collections Bar Chart */}
                <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Monthly Collections (TZS)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Payment intake trend across recent months
                      </p>
                    </div>
                    <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded">
                      Jan peak admissions
                    </span>
                  </div>

                  {/* SVG / HTML Bar Chart */}
                  <div className="space-y-3 pt-2">
                    {monthlyCollections.map((m, idx) => {
                      const maxVal = 9000000;
                      const percentage = Math.round((m.amount / maxVal) * 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-600 font-mono">{m.month}</span>
                            <span className="text-slate-900 font-mono font-semibold">
                              {formatTsh(m.amount)}
                            </span>
                          </div>
                          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-[#16a34a] rounded-full transition-all duration-700"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Fee-Type Breakdown */}
                <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Fee-Type Distribution
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Share of revenue by educational fee group
                    </p>

                    <div className="space-y-3">
                      {feeTypeBreakdown.map((ft, idx) => (
                        <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-3.5 h-3.5 rounded-full shrink-0"
                              style={{ backgroundColor: ft.color }}
                            />
                            <div>
                              <div className="text-xs font-bold text-slate-900">{ft.name}</div>
                              <div className="text-[10px] text-slate-500">{ft.percentage}% of overall fees</div>
                            </div>
                          </div>
                          <div className="text-xs font-mono font-bold text-slate-800">
                            {formatTsh(ft.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 italic">
                    Calculated from audited student statements for the 2026/2027 cycle.
                  </div>
                </div>
              </div>

              {/* Recent Payments Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Recent Payments
                    </h3>
                    <p className="text-xs text-slate-500">
                      All recorded payments across mobile money and bank channels.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Student</th>
                        <th className="px-5 py-3">Method</th>
                        <th className="px-5 py-3">Reference</th>
                        <th className="px-5 py-3">Note</th>
                        <th className="px-5 py-3 text-right">Amount (TZS)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pagedPayments.map((pay) => {
                        const student = students.find((s) => s.id === pay.studentId);
                        return (
                          <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-5 py-3 font-mono text-slate-700 whitespace-nowrap">
                              {pay.date}
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap">
                              {student ? (
                                <button
                                  onClick={() => onNavigate(`/admin/students/${student.id}`)}
                                  className="font-semibold text-slate-900 hover:text-[#7c3aed] hover:underline"
                                >
                                  {student.firstName} {student.lastName}
                                </button>
                              ) : (
                                <span className="text-slate-400">Unknown Student</span>
                              )}
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800">
                                {pay.method}
                              </span>
                            </td>
                            <td className="px-5 py-3 font-mono text-purple-700 whitespace-nowrap">
                              {pay.reference}
                            </td>
                            <td className="px-5 py-3 text-slate-500">
                              {pay.notes || 'Tuition'}
                            </td>
                            <td className="px-5 py-3 text-right font-mono font-bold text-[#16a34a] whitespace-nowrap">
                              {formatTsh(pay.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {payments.length > 0 && (
                  <TablePagination
                    page={paymentCurrentPage}
                    pageSize={paymentPageSize}
                    totalItems={payments.length}
                    onPageChange={setPaymentPage}
                    onPageSizeChange={setPaymentPageSize}
                    itemLabel="payments"
                  />
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 3: GRADES & FEES ================= */}
          {activeTab === 'grades' && (
            <div className="space-y-6">
              {/* Descriptive bar + actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                  Configure fee groups (School, Transport, Admission) and customize fee items per grade.
                </p>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setIsAddGradeModalOpen(true)}
                    className="flex-1 sm:flex-initial py-2.5 px-4 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Grade</span>
                  </button>
                  <button
                    onClick={onOpenFeesModal}
                    className="py-2.5 px-3 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Preview
                  </button>
                </div>
              </div>

              {/* Grade rows — click a row to unfold its full details */}
              <GradeFeeAccordion
                variant="row"
                grades={grades}
                openId={openGradeId}
                onToggle={setOpenGradeId}
                renderHeaderExtra={(grade) => (
                  <>
                    <span className="lg:col-span-2 text-xs text-slate-600">
                      {grade.ageRange || '—'}
                    </span>
                    <span className="lg:col-span-2 text-xs font-semibold text-slate-700">
                      {students.filter((s) => s.gradeId === grade.id).length}
                    </span>
                    <span className="lg:col-span-2 text-xs text-slate-600">
                      {grade.feeGroups.length}
                    </span>
                    <span className="lg:col-span-1 text-right font-mono text-xs font-bold text-[#16a34a] tabular-nums">
                      {formatNumber(
                        grade.feeGroups.reduce(
                          (sum, g) => sum + g.items.reduce((s, i) => s + (i.amount || 0), 0),
                          0
                        )
                      )}{' '}
                      Tsh
                    </span>
                  </>
                )}
                renderPanel={(grade) => (
                  <AdminGradePanel
                    grade={grade}
                    onRegisterInGrade={() => setActiveTab('register')}
                    onViewStudents={(gradeId) => {
                      setFilterGrade(gradeId);
                      setActiveTab('students');
                    }}
                  />
                )}
              />
            </div>
          )}

          {/* ================= SUB-TAB: REGISTER NEW STUDENT ================= */}
          {activeTab === 'register' && (
            <AdminRegisterForm
              onSaved={() => undefined}
              onViewStudent={(studentId) => onNavigate(`/admin/students/${studentId}`)}
              onCancel={() => setActiveTab('students')}
            />
          )}

        </div>
        </main>
      </div>

      {/* MODAL: Add Grade */}
      {isAddGradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Add New Grade & Fee Structure
                </h3>
                <p className="text-xs text-slate-500">
                  Define classroom name and customize each fee group statement.
                </p>
              </div>
              <button
                onClick={() => setIsAddGradeModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGrade} className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Grade Name (e.g. Grade 4, Grade 5) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGradeName}
                    onChange={(e) => setNewGradeName(e.target.value)}
                    placeholder="e.g. Grade 4"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Age Range (e.g. 9 - 10 years)
                  </label>
                  <input
                    type="text"
                    value={newGradeAge}
                    onChange={(e) => setNewGradeAge(e.target.value)}
                    placeholder="e.g. 9 - 10 years"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7c3aed]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brief Curriculum Description
                </label>
                <textarea
                  rows={2}
                  value={newGradeDescription}
                  onChange={(e) => setNewGradeDescription(e.target.value)}
                  placeholder="Summary of subjects, languages, and competencies..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7c3aed]"
                />
              </div>

              {/* Fee Groups Form */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Fee Groups & Items
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddFeeGroup}
                    className="text-xs font-semibold text-[#7c3aed] hover:underline"
                  >
                    + Add Another Group
                  </button>
                </div>

                {newGradeFeeGroups.map((group, gIdx) => (
                  <div key={gIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={group.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewGradeFeeGroups((prev) => {
                            const updated = [...prev];
                            updated[gIdx].name = val;
                            return updated;
                          });
                        }}
                        className="px-2.5 py-1 text-xs font-bold uppercase bg-white border border-slate-300 rounded text-slate-800 flex-1"
                        placeholder="GROUP TITLE (e.g. TUITION)"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddFeeItem(gIdx)}
                        className="text-[11px] px-2 py-1 bg-white border border-slate-300 rounded text-purple-700 font-semibold"
                      >
                        + Add Item
                      </button>
                    </div>

                    {/* Items inside group */}
                    <div className="space-y-1.5 pl-2">
                      {group.items.map((item, iIdx) => (
                        <div key={iIdx} className="flex items-center gap-2 text-xs">
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => handleUpdateItem(gIdx, iIdx, 'label', e.target.value)}
                            placeholder="Item label"
                            className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-800"
                          />
                          <div className="relative w-36">
                            <input
                              type="number"
                              value={item.amount}
                              onChange={(e) => handleUpdateItem(gIdx, iIdx, 'amount', e.target.value)}
                              placeholder="Amount"
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-mono text-slate-900 pr-9"
                            />
                            <span className="absolute right-2 top-1 text-[10px] text-slate-400 font-bold">
                              Tsh
                            </span>
                          </div>
                          {group.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFeeItem(gIdx, iIdx)}
                              className="text-slate-400 hover:text-red-500 p-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Subtotal Display */}
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex justify-between items-center text-sm font-bold text-emerald-900">
                <span>Calculated Grade Total:</span>
                <span className="font-mono text-base text-[#16a34a]">
                  {formatTsh(newGradeTotal)}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddGradeModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7c3aed] text-white rounded-lg text-xs font-bold hover:bg-[#6d28d9]"
                >
                  Save & Publish Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
