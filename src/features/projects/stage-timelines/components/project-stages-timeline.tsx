import { useState, useRef } from 'react';
import { isSameDay, isSameMonth, isSameYear } from 'date-fns';
import { CheckCircle2, Clock, PlayCircle, XCircle, Plus, Calendar, Edit, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import type { ProjectStage } from '../../project-stages/project-stages.types';
import type { StageTimeline } from '../stage-timelines.types';
import { Button } from '@/shared/components/ui/button';
import { cn, formatArabicDate } from '@/shared/lib/utils';

type ProjectStagesTimelineProps = {
  stages: ProjectStage[];
  selectedStageId: number | null;
  onSelectStage: (stageId: number) => void;
  onAddTimeline: (stage: ProjectStage) => void;
  onEditTimeline: (timeline: StageTimeline, stage: ProjectStage) => void;
  onDeleteTimeline?: (timeline: StageTimeline) => void;
  onEditStage?: (stage: ProjectStage) => void;
  onDeleteStage?: (stage: ProjectStage) => void;
  canManage?: boolean;
};

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string; line: string }> = {
  pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', line: 'bg-border' },
  in_progress: { icon: PlayCircle, color: 'text-info', bg: 'bg-info/10', line: 'bg-info/30' },
  completed: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', line: 'bg-success/40' },
  canceled: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', line: 'bg-destructive/30' },
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
    return `${formatArabicDate(startDate, true, false)} - ${formatArabicDate(endDate)}`;
  }

  return `${formatArabicDate(startDate)} - ${formatArabicDate(endDate)}`;
}

export function ProjectStagesTimeline({
  stages,
  selectedStageId,
  onSelectStage,
  onAddTimeline,
  onEditTimeline,
  onEditStage,
  onDeleteStage,
  canManage = true,
}: ProjectStagesTimelineProps) {
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

  const currentIndex = stages.findIndex((s) => s.id === selectedStageId);

  const handleArrowClick = (direction: 'right' | 'left') => {
    scroll(direction);
    if (currentIndex === -1) return;

    if (direction === 'left') {
      if (currentIndex < stages.length - 1) {
        onSelectStage(stages[currentIndex + 1].id);
      }
    } else {
      if (currentIndex > 0) {
        onSelectStage(stages[currentIndex - 1].id);
      }
    }
  };

  if (!stages.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Clock className="size-12 mx-auto mb-4 opacity-20" />
        <p>لا يوجد مراحل لعرضها في الخط الزمني</p>
      </div>
    );
  }

  const selectedStage = stages.find((s) => s.id === selectedStageId);

  return (
    <div className="flex min-w-0 flex-col space-y-4 p-0 sm:space-y-6 sm:p-4 lg:p-6">
      {/* Horizontal Timeline */}
      <div className="group relative min-w-0 sm:px-4">
        <button
          onClick={() => handleArrowClick('right')}
          disabled={currentIndex <= 0}
          className="absolute right-0 top-8 z-20 hidden size-8 translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition-all hover:bg-muted/50 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none sm:flex"
        >
          <ChevronRight className="size-5" />
        </button>

        <div
          ref={scrollContainerRef}
          className="scrollbar-none relative mx-auto w-full touch-pan-x overflow-x-auto"
        >
          <div className="relative flex min-w-max items-center justify-start p-2 sm:justify-center sm:p-4">
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
                        ? "bg-card shadow-[0_4px_12px_rgba(0,0,0,0.08)] ring-1 ring-blue-200"
                        : "hover:bg-card/50"
                    )}
                    onClick={() => onSelectStage(stage.id)}
                  >
                    <div className={cn(
                      'size-8 rounded-full border-[3px] flex items-center justify-center transition-all duration-300 ring-2',
                      isSelected ? 'border-blue-500 ring-blue-100 scale-110' : 'border-white ring-slate-100 group-hover/node:scale-105',
                      config.bg, config.color
                    )}>
                      <Icon className="size-4" />
                    </div>
                    <div className="mt-3 text-center px-1 w-full">
                      <p className={cn("text-xs font-bold truncate transition-colors", isSelected ? "text-primary" : "text-foreground group-hover/node:text-foreground")}>
                        {stage.name}
                      </p>
                      <p className={cn("text-[10px] mt-1 transition-colors", isSelected ? "text-primary/80 font-semibold" : "text-muted-foreground")}>
                        {formatArabicDate(stage.start_date)}
                      </p>
                      <div className="mt-1.5 flex justify-center">
                        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wide', config.bg, config.color)}>
                          {stage.status === 'pending' ? 'مقترح' : stage.status === 'in_progress' ? 'قيد التنفيذ' : stage.status === 'completed' ? 'منتهي' : 'متوقف'}
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
          onClick={() => handleArrowClick('left')}
          disabled={currentIndex >= stages.length - 1}
          className="absolute left-0 top-8 z-20 hidden size-8 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition-all hover:bg-muted/50 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none sm:flex"
        >
          <ChevronLeft className="size-5" />
        </button>
      </div>

      {/* Selected Stage Details */}
      {selectedStage && (() => {
        const config = statusConfig[selectedStage.status as string] || statusConfig.pending;
        const timelines = selectedStage.timelines ?? [];

        return (
          <div className="min-w-0 animate-in rounded-xl border border-border bg-card p-3 shadow-sm fade-in slide-in-from-bottom-4 duration-500 sm:p-5 lg:p-6">
            <div className="mb-5 flex min-w-0 flex-col justify-between gap-4 md:flex-row md:items-start lg:mb-8 lg:gap-6">
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn('size-10 rounded-full flex items-center justify-center shadow-sm', config.bg, config.color)}>
                    <config.icon className="size-5" />
                  </div>
                </div>
                <div className="flex min-w-0 items-start justify-between gap-2 sm:justify-start sm:gap-4">
                  <h3 className="min-w-0 break-words text-xl font-bold text-foreground sm:text-2xl">{selectedStage.name}</h3>
                  <div className="flex items-center gap-1">
                    {onEditStage && (
                      <Button variant="ghost" size="icon" onClick={() => onEditStage(selectedStage)} className="size-8 text-muted-foreground hover:text-primary" title="تعديل المرحلة">
                        <Edit className="size-4" />
                      </Button>
                    )}
                    {onDeleteStage && (
                      <Button variant="ghost" size="icon" onClick={() => onDeleteStage(selectedStage)} className="size-8 text-muted-foreground hover:text-destructive" title="حذف المرحلة">
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:flex sm:flex-wrap sm:items-center sm:gap-4 lg:mt-5">
                  <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 shadow-sm">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span>البدء: <strong className="text-foreground">{formatArabicDate(selectedStage.start_date)}</strong></span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 shadow-sm">
                    <Clock className="size-4 text-muted-foreground" />
                    <span>المتوقع: <strong className="text-foreground">{formatArabicDate(selectedStage.expected_end_date)}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 p-3 shadow-sm md:w-auto md:min-w-[220px] md:gap-5 md:p-4">
                <div>
                  <span className="block text-sm font-semibold text-muted-foreground mb-1">نسبة الإنجاز</span>
                  <span className="block text-xs text-muted-foreground">للمرحلة الحالية</span>
                </div>
                <div className="relative flex items-center justify-center size-[72px]">
                  <svg className="transform -rotate-90 size-[72px]" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" className="text-border" strokeWidth="6" stroke="currentColor" fill="transparent" />
                    <circle
                      cx="40" cy="40" r="32"
                      className="text-primary transition-all duration-1000 ease-out"
                      strokeWidth="6"
                      strokeDasharray={2 * Math.PI * 32}
                      strokeDashoffset={2 * Math.PI * 32 - (selectedStage.stage_progress / 100) * (2 * Math.PI * 32)}
                      strokeLinecap="round" stroke="currentColor" fill="transparent"
                    />
                  </svg>
                  <span className="absolute text-base font-bold text-foreground">{selectedStage.stage_progress}%</span>
                </div>
              </div>
            </div>

            {/* Sub Timelines */}
            <div className="border-t border-border pt-5 lg:pt-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h4 className="text-lg font-bold text-foreground">التحديثات الزمنية</h4>
                  <p className="text-sm text-muted-foreground mt-1">سجل التحديثات والمهام الفرعية لهذه المرحلة</p>
                </div>

                <div className="flex min-w-0 flex-col gap-2 sm:items-stretch lg:flex-row lg:items-center lg:gap-3">
                  <div className="max-w-full overflow-x-auto pb-1">
                    <div className="flex w-max items-center rounded-lg border border-border bg-muted/50 p-1">
                      <button
                        onClick={() => setFilterStatus('all')}
                        className={cn("px-3 py-1.5 rounded-md text-xs font-semibold transition-colors", filterStatus === 'all' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                      >
                        الكل
                      </button>
                      {Object.entries(statusConfig).map(([key, conf]) => (
                        <button
                          key={key}
                          onClick={() => setFilterStatus(key)}
                          className={cn("px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5", filterStatus === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                        >
                          <conf.icon className="size-3" />
                          {key === 'pending' ? 'بالانتظار' : key === 'in_progress' ? 'قيد التنفيذ' : key === 'completed' ? 'مكتمل' : 'منتهي'}
                        </button>
                      ))}
                    </div></div>
                  {canManage && (
                    <Button onClick={() => onAddTimeline(selectedStage)} className="w-full gap-2 rounded-lg bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 lg:w-auto">
                      <Plus className="size-4" />
                      إضافة تحديث
                    </Button>
                  )}
                </div>
              </div>

              {(() => {
                const filteredTimelines = timelines.filter(tl => filterStatus === 'all' || tl.status === filterStatus);

                if (filteredTimelines.length === 0) {
                  return (
                    <div className="text-center py-12 bg-muted/50 rounded-xl border-2 border-dashed border-border">
                      <div className="size-12 bg-card shadow-sm rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="size-6 text-muted-foreground" />
                      </div>
                      <p className="text-base font-semibold text-foreground">لا يوجد تحديثات {filterStatus !== 'all' ? 'بهذه الحالة' : 'مسجلة حتى الآن'}</p>
                      <p className="text-sm text-muted-foreground mt-1">{filterStatus !== 'all' ? 'جرب اختيار حالة أخرى' : canManage ? 'انقر على إضافة تحديث لتسجيل مهمة فرعية جديدة' : ''}</p>
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
                          onClick={() => canManage && onEditTimeline(tl, selectedStage)}
                          className={cn(
                            "relative flex min-w-0 flex-col items-stretch justify-between gap-3 overflow-hidden rounded-xl border border-border bg-card p-3 shadow-sm transition-all sm:flex-row sm:items-center sm:gap-4 sm:p-4",
                            canManage ? "hover:shadow-md hover:border-primary/30 cursor-pointer" : "cursor-default"
                          )}
                        >
                          {/* Status color indicator bar */}
                          <div className={cn("absolute top-0 right-0 w-1 h-full opacity-70", tlConfig.bg.replace('100', '400').replace('50', '400'))} />

                          <div className="flex min-w-0 items-center gap-3 pr-2 sm:gap-4">
                            {/* Progress Circle */}
                            <div className="relative flex items-center justify-center size-12 shrink-0">
                              <svg className="transform -rotate-90 size-12" viewBox="0 0 48 48">
                                <circle cx="24" cy="24" r="20" className="text-border" strokeWidth="4" stroke="currentColor" fill="transparent" />
                                <circle
                                  cx="24" cy="24" r="20"
                                  className={cn("transition-all duration-1000 ease-out", tlConfig.color.replace('text-', 'text-').replace('500', '600'))}
                                  strokeWidth="4"
                                  strokeDasharray={2 * Math.PI * 20}
                                  strokeDashoffset={2 * Math.PI * 20 - (tl.stage_progress / 100) * (2 * Math.PI * 20)}
                                  strokeLinecap="round" stroke="currentColor" fill="transparent"
                                />
                              </svg>
                              <span className="absolute text-xs font-bold text-foreground">{tl.stage_progress}%</span>
                            </div>

                            {/* Details */}
                            <div className="min-w-0 flex flex-col gap-1.5">
                              <span className="font-semibold text-foreground line-clamp-1">{tl.stage_name}</span>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="size-3.5 opacity-70" />
                                <span className="font-medium text-muted-foreground">{formatDateRange(tl.start_date, tl.expected_end_date)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="shrink-0 self-end pl-1 sm:self-auto">
                            <span className={cn('px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap', tlConfig.bg, tlConfig.color)}>
                              {tl.status === 'pending' ? 'بالانتظار' : tl.status === 'in_progress' ? 'قيد التنفيذ' : tl.status === 'completed' ? 'مكتمل' : 'منتهي'}
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
