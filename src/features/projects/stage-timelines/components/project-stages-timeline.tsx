import { useState, useEffect, useRef } from 'react';
import { isSameDay, isSameMonth, isSameYear } from 'date-fns';
import { CheckCircle2, Clock, PlayCircle, XCircle, Plus, Calendar, Edit, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import type { ProjectStage } from '../../project-stages/project-stages.types';
import type { StageTimeline } from '../stage-timelines.types';
import { Button } from '@/shared/components/ui/button';
import { cn, formatArabicDate } from '@/shared/lib/utils';

type ProjectStagesTimelineProps = {
  stages: ProjectStage[];
  onAddTimeline: (stage: ProjectStage) => void;
  onEditTimeline: (timeline: StageTimeline, stage: ProjectStage) => void;
  onDeleteTimeline?: (timeline: StageTimeline) => void;
  onEditStage?: (stage: ProjectStage) => void;
  onDeleteStage?: (stage: ProjectStage) => void;
};

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string; line: string }> = {
  pending: { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100', line: 'bg-slate-200' },
  in_progress: { icon: PlayCircle, color: 'text-blue-500', bg: 'bg-blue-100', line: 'bg-blue-200' },
  completed: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100', line: 'bg-green-400' },
  cancelled: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100', line: 'bg-red-200' },
};

function formatDateRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isSameDay(startDate, endDate)) {
    return formatArabicDate(startDate) + ' (نفس اليوم)';
  }

  if (isSameMonth(startDate, endDate) && isSameYear(startDate, endDate)) {
    const startDay = startDate.getDate().toString().padStart(2, '0');
    return `${startDay} - ${formatArabicDate(endDate)}`;
  }

  if (isSameYear(startDate, endDate)) {
    return `${formatArabicDate(startDate, 'ar-SY', true, false)} - ${formatArabicDate(endDate)}`;
  }

  return `${formatArabicDate(startDate)} - ${formatArabicDate(endDate)}`;
}

export function ProjectStagesTimeline({ stages, onAddTimeline, onEditTimeline, onEditStage, onDeleteStage }: ProjectStagesTimelineProps) {
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'right' | 'left') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (stages.length > 0 && !selectedStageId) {
      setSelectedStageId(stages[0].id);
    }
  }, [stages, selectedStageId]);

  if (!stages.length) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Clock className="size-12 mx-auto mb-4 opacity-20" />
        <p>لا يوجد مراحل لعرضها في الخط الزمني</p>
      </div>
    );
  }

  const selectedStage = stages.find((s) => s.id === selectedStageId) || stages[0];

  return (
    <div className="flex flex-col space-y-6 p-6">
      {/* Horizontal Timeline */}
      <div className="relative group px-4">
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-8 z-20 size-8 bg-white border border-slate-200 shadow-md rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100 translate-x-1/2"
        >
          <ChevronRight className="size-5" />
        </button>

        <div
          ref={scrollContainerRef}
          className="relative w-full overflow-x-auto mx-auto scrollbar-none"
        >
          <div className="flex items-center justify-center min-w-max p-4  relative">
            {stages.map((stage, index) => {
              const config = statusConfig[stage.status as string] || statusConfig.pending;
              const Icon = config.icon;
              const isSelected = selectedStageId === stage.id;
              const isLast = index === stages.length - 1;

              return (
                <div key={stage.id} className="relative flex-shrink-0" style={{ width: '130px' }}>
                  {/* Connecting Line to next item (RTL direction -> right to left) */}
                  {!isLast && (
                    <div className={cn("absolute top-[22px] right-[50%] w-full h-1 z-0 transition-colors duration-500", config.line)} />
                  )}

                  {/* Node */}
                  <div
                    className={cn(
                      "relative z-10 flex flex-col items-center cursor-pointer group/node p-2 mx-1 rounded-xl transition-all duration-300",
                      isSelected
                        ? "bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] ring-1 ring-blue-200"
                        : "hover:bg-white/50"
                    )}
                    onClick={() => setSelectedStageId(stage.id)}
                  >
                    <div className={cn(
                      'size-8 rounded-full border-[3px] flex items-center justify-center transition-all duration-300 ring-2',
                      isSelected ? 'border-blue-500 ring-blue-100 scale-110' : 'border-white ring-slate-100 group-hover/node:scale-105',
                      config.bg, config.color
                    )}>
                      <Icon className="size-4" />
                    </div>
                    <div className="mt-3 text-center px-1 w-full">
                      <p className={cn("text-xs font-bold truncate transition-colors", isSelected ? "text-blue-700" : "text-slate-700 group-hover/node:text-slate-900")}>
                        {stage.name}
                      </p>
                      <p className={cn("text-[10px] mt-1 transition-colors", isSelected ? "text-blue-600/80 font-semibold" : "text-slate-500")}>
                        {formatArabicDate(stage.start_date)}
                      </p>
                      <div className="mt-1.5 flex justify-center">
                        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wide', config.bg, config.color)}>
                          {stage.status === 'pending' ? 'قيد الانتظار' : stage.status === 'in_progress' ? 'قيد التنفيذ' : stage.status === 'completed' ? 'مكتمل' : 'ملغى'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-8 z-20 size-8 bg-white border border-slate-200 shadow-md rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100 -translate-x-1/2"
        >
          <ChevronLeft className="size-5" />
        </button>
      </div>

      {/* Selected Stage Details */}
      {selectedStage && (() => {
        const config = statusConfig[selectedStage.status as string] || statusConfig.pending;
        const timelines = selectedStage.timelines ?? [];

        return (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn('size-10 rounded-full flex items-center justify-center shadow-sm', config.bg, config.color)}>
                    <config.icon className="size-5" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <h3 className="text-2xl font-bold text-slate-900">{selectedStage.name}</h3>
                  <div className="flex items-center gap-1">
                    {onEditStage && (
                      <Button variant="ghost" size="icon" onClick={() => onEditStage(selectedStage)} className="size-8 text-slate-400 hover:text-blue-600" title="تعديل المرحلة">
                        <Edit className="size-4" />
                      </Button>
                    )}
                    {onDeleteStage && (
                      <Button variant="ghost" size="icon" onClick={() => onDeleteStage(selectedStage)} className="size-8 text-slate-400 hover:text-red-600" title="حذف المرحلة">
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mt-5">
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 shadow-sm">
                    <Calendar className="size-4 text-slate-400" />
                    <span>البدء: <strong className="text-slate-800">{formatArabicDate(selectedStage.start_date)}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 shadow-sm">
                    <Clock className="size-4 text-slate-400" />
                    <span>المتوقع: <strong className="text-slate-800">{formatArabicDate(selectedStage.expected_end_date)}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-5 min-w-[220px] bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                <div>
                  <span className="block text-sm font-semibold text-slate-600 mb-1">نسبة الإنجاز</span>
                  <span className="block text-xs text-slate-500">للمرحلة الحالية</span>
                </div>
                <div className="relative flex items-center justify-center size-[72px]">
                  <svg className="transform -rotate-90 size-[72px]" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" className="text-slate-200" strokeWidth="6" stroke="currentColor" fill="transparent" />
                    <circle
                      cx="40" cy="40" r="32"
                      className="text-blue-600 transition-all duration-1000 ease-out"
                      strokeWidth="6"
                      strokeDasharray={2 * Math.PI * 32}
                      strokeDashoffset={2 * Math.PI * 32 - (selectedStage.stage_progress / 100) * (2 * Math.PI * 32)}
                      strokeLinecap="round" stroke="currentColor" fill="transparent"
                    />
                  </svg>
                  <span className="absolute text-base font-bold text-slate-900">{selectedStage.stage_progress}%</span>
                </div>
              </div>
            </div>

            {/* Sub Timelines */}
            <div className="pt-8 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">التحديثات الزمنية</h4>
                  <p className="text-sm text-slate-500 mt-1">سجل التحديثات والمهام الفرعية لهذه المرحلة</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-50 border border-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => setFilterStatus('all')}
                      className={cn("px-3 py-1.5 rounded-md text-xs font-semibold transition-colors", filterStatus === 'all' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                      الكل
                    </button>
                    {Object.entries(statusConfig).map(([key, conf]) => (
                      <button
                        key={key}
                        onClick={() => setFilterStatus(key)}
                        className={cn("px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5", filterStatus === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                      >
                        <conf.icon className="size-3" />
                        {key === 'pending' ? 'بالانتظار' : key === 'in_progress' ? 'قيد التنفيذ' : key === 'completed' ? 'مكتمل' : 'ملغى'}
                      </button>
                    ))}
                  </div>
                  <Button onClick={() => onAddTimeline(selectedStage)} className="gap-2 bg-slate-950 text-white hover:bg-slate-800 rounded-lg shadow-sm">
                    <Plus className="size-4" />
                    إضافة تحديث
                  </Button>
                </div>
              </div>

              {(() => {
                const filteredTimelines = timelines.filter(tl => filterStatus === 'all' || tl.status === filterStatus);

                if (filteredTimelines.length === 0) {
                  return (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                      <div className="size-12 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="size-6 text-slate-300" />
                      </div>
                      <p className="text-base font-semibold text-slate-700">لا يوجد تحديثات {filterStatus !== 'all' ? 'بهذه الحالة' : 'مسجلة حتى الآن'}</p>
                      <p className="text-sm text-slate-500 mt-1">{filterStatus !== 'all' ? 'جرب اختيار حالة أخرى' : 'انقر على إضافة تحديث لتسجيل مهمة فرعية جديدة'}</p>
                    </div>
                  );
                }

                return (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredTimelines.map(tl => {
                      const tlConfig = statusConfig[tl.status as string] || statusConfig.pending;
                      return (
                        <div
                          key={tl.id}
                          onClick={() => onEditTimeline(tl, selectedStage)}
                          className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all relative overflow-hidden cursor-pointer flex items-center justify-between gap-4"
                        >
                          {/* Status color indicator bar */}
                          <div className={cn("absolute top-0 right-0 w-1 h-full opacity-70", tlConfig.bg.replace('100', '400').replace('50', '400'))} />

                          <div className="flex items-center gap-4 pr-2">
                            {/* Progress Circle */}
                            <div className="relative flex items-center justify-center size-12 shrink-0">
                              <svg className="transform -rotate-90 size-12" viewBox="0 0 48 48">
                                <circle cx="24" cy="24" r="20" className="text-slate-100" strokeWidth="4" stroke="currentColor" fill="transparent" />
                                <circle
                                  cx="24" cy="24" r="20"
                                  className={cn("transition-all duration-1000 ease-out", tlConfig.color.replace('text-', 'text-').replace('500', '600'))}
                                  strokeWidth="4"
                                  strokeDasharray={2 * Math.PI * 20}
                                  strokeDashoffset={2 * Math.PI * 20 - (tl.stage_progress / 100) * (2 * Math.PI * 20)}
                                  strokeLinecap="round" stroke="currentColor" fill="transparent"
                                />
                              </svg>
                              <span className="absolute text-xs font-bold text-slate-700">{tl.stage_progress}%</span>
                            </div>

                            {/* Details */}
                            <div className="flex flex-col gap-1.5">
                              <span className="font-semibold text-slate-800 line-clamp-1">{tl.stage_name}</span>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Calendar className="size-3.5 opacity-70" />
                                <span className="font-medium text-slate-600">{formatDateRange(tl.start_date, tl.expected_end_date)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="shrink-0 pl-1">
                            <span className={cn('px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap', tlConfig.bg, tlConfig.color)}>
                              {tl.status === 'pending' ? 'بالانتظار' : tl.status === 'in_progress' ? 'قيد التنفيذ' : tl.status === 'completed' ? 'مكتمل' : 'ملغى'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}
    </div>
  )
}
