import React, { useEffect, useRef, useState } from 'react';
import { X, FileText, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Grade } from '../types';
import { FeeStatement } from './FeeStatement';
import { GradeFeeAccordion } from './GradeFeeAccordion';
import type { AccordionColumn } from './GradeFeeAccordion';
import { formatNumber, schoolConfig } from '../config/schoolConfig';

/** Drawer width from the `sm` breakpoint up. Always full width on phones. */
const WIDTH_CLASSES = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-2xl',
  lg: 'sm:max-w-3xl',
  xl: 'sm:max-w-5xl',
  full: 'sm:max-w-none',
} as const;

interface FeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGradeId?: string;
  /** Defaults to 'md' (a 2xl-wide drawer). */
  size?: keyof typeof WIDTH_CLASSES;
}

/** Grade · Age · Total, sized to fill the 12-column grid. */
const MODAL_COLUMNS: AccordionColumn[] = [
  { label: 'Classroom / Grade', span: 'lg:col-span-6' },
  { label: 'Age', span: 'lg:col-span-2' },
  { label: 'Total / Year', span: 'lg:col-span-3', align: 'right' },
];

const totalOf = (grade: Grade) =>
  grade.feeGroups.reduce(
    (sum, group) => sum + group.items.reduce((s, item) => s + (item.amount || 0), 0),
    0
  );

/**
 * Full-screen fee structure viewer. The panel swings in from the right edge of
 * the viewport and settles in the centre, so it reads like a door opening.
 */
export const FeeModal: React.FC<FeeModalProps> = ({
  isOpen,
  onClose,
  selectedGradeId,
  size = 'md',
}) => {
  const { grades } = useApp();

  // Kept mounted briefly after `isOpen` flips to false so the closing
  // animation has something to play on.
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (closeTimer.current) {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
      setIsMounted(true);
      setIsClosing(false);
    } else if (isMounted) {
      setIsClosing(true);
      closeTimer.current = window.setTimeout(() => {
        setIsMounted(false);
        setIsClosing(false);
        closeTimer.current = null;
      }, 200);
    }
    return () => {
      if (closeTimer.current) {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
    };
  }, [isOpen, isMounted]);

  // Lock scroll + Escape while the panel is on screen
  useEffect(() => {
    if (!isMounted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMounted, onClose]);

  if (!isMounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs ${
        isClosing ? 'animate-overlay-out' : 'animate-overlay-in'
      }`}
      onClick={onClose}
      role="presentation"
    >
      {/* Docked to the right edge, spanning half the screen */}
      <div
        className="absolute inset-y-0 right-0 w-full sm:w-1/2 [perspective:1400px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`bg-white h-full w-full shadow-2xl flex flex-col overflow-hidden ${
            isClosing ? 'animate-door-close' : 'animate-door-open'
          }`}
          style={{ transformOrigin: 'right center', backfaceVisibility: 'hidden' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="fee-modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-[#7c3aed]">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 id="fee-modal-title" className="text-lg font-bold text-slate-900">
                  Fee Structure
                </h2>
                <p className="text-xs text-slate-500">
                  {schoolConfig.name} · Academic Year 2026/2027
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              aria-label="Close fee structure modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content: Scrollable list of Grade Fee Statements */}
          <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto space-y-6">
            <div className="text-xs sm:text-sm text-slate-600 bg-emerald-50 border-l-4 border-[#16a34a] p-3 rounded-r-lg">
              <span className="font-semibold text-emerald-900">Note: </span>
              Fees can be paid in full or across three school terms via M-Pesa, Mixx by Yas,
              Airtel Money, or Bank Deposit. For fee inquiries, contact our bursar at{' '}
              <a
                href={`tel:${schoolConfig.phone.replace(/\s+/g, '')}`}
                className="font-semibold text-emerald-800 underline"
              >
                {schoolConfig.phone}
              </a>
              .
            </div>

            <GradeFeeAccordion
              variant="row"
              framed={false}
              columns={MODAL_COLUMNS}
              grades={grades}
              defaultOpenId={selectedGradeId}
              renderHeaderExtra={(grade) => (
                <>
                  <span className="lg:col-span-2 text-xs text-slate-600">
                    {grade.ageRange || '—'}
                  </span>
                  <span className="lg:col-span-3 text-right font-mono text-xs font-bold text-[#16a34a] tabular-nums">
                    {formatNumber(totalOf(grade))} Tsh
                  </span>
                </>
              )}
              renderPanel={(grade) => <FeeStatement grade={grade} />}
            />
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              Bursar Helpline: {schoolConfig.phone}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};