'use client';

import { useMemo, useState, type ComponentType } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  ImageIcon,
  UserRound,
} from 'lucide-react';
import { SearchIcon } from '@/components/layout/AppIcons';
import { useLocale, useTranslation } from '@/lib/locale-context';
import type { TaskStatus, TeamTask } from './types';
import { TeamPagination } from './TeamPagination';

interface TeamTasksPanelProps {
  onBackToMembers: () => void;
  tasks: TeamTask[];
  showBackButton?: boolean;
}

function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const { t } = useTranslation();

  const statusStyles: Record<TaskStatus, string> = {
    inProgress: 'bg-[#2f80ed] text-white',
    completed: 'bg-[#219653] text-white',
    delayed: 'bg-[#eb5757] text-white',
    awaitingApproval: 'bg-[#f2994a] text-white',
  };

  return (
    <span className={`inline-flex min-w-[7.5rem] items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold ${statusStyles[status]}`}>
      {t(`team.taskStatuses.${status}`)}
    </span>
  );
}

interface TaskStatCardProps {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
}

function TaskStatCard({ label, value, icon: Icon }: TaskStatCardProps) {
  return (
    <div className="rounded-[24px] border border-[#eaded4] bg-white p-5 shadow-[0_12px_30px_rgba(91,53,24,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#9f7f6a]">{label}</p>
          <p className="mt-2 text-[1.9rem] font-bold text-[#2a2337]">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff6ee] text-[#5a3625]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function TeamTasksPanel({ onBackToMembers, tasks, showBackButton = true }: TeamTasksPanelProps) {
  const { direction } = useLocale();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');

  const selectedTaskId = searchParams.get('task');
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  const filteredTasks = useMemo(() => {
    if (!query.trim()) return tasks;

    return tasks.filter((task) =>
      [task.title, task.description, task.assignee, task.dueDate].some((value) =>
        value.toLowerCase().includes(query.trim().toLowerCase())
      )
    );
  }, [query, tasks]);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  const openTaskDetails = (taskId: string) => {
    updateParams({ view: 'tasks', task: taskId });
  };

  const returnToTaskList = () => {
    updateParams({ view: 'tasks', task: null });
  };

  const stats = {
    total: tasks.length,
    inProgress: tasks.filter((task) => task.status === 'inProgress').length,
    completed: tasks.filter((task) => task.status === 'completed').length,
  };

  const BackIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  if (selectedTask) {
    return (
      <div className="space-y-6 [animation:var(--tab-animation)_0.35s_ease]">
        <div className="flex items-center justify-between">
          <button
            onClick={returnToTaskList}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dbcabb] bg-white text-[#4b2f1a] shadow-[0_10px_24px_rgba(91,53,24,0.08)]"
            aria-label={t('common.back')}
          >
            <BackIcon className="h-5 w-5" />
          </button>

          {showBackButton ? (
            <button
              onClick={onBackToMembers}
              className="rounded-full border border-[#dbcabb] bg-white px-4 py-2.5 text-sm font-semibold text-[#4b2f1a] shadow-[0_10px_24px_rgba(91,53,24,0.08)]"
            >
              {t('team.backToMembers')}
            </button>
          ) : null}
        </div>

        <section className="rounded-[30px] bg-white p-4 shadow-[0_18px_44px_rgba(91,53,24,0.07)] sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-[1.9rem] font-bold text-[#27304a]">{t('team.taskDetails')}</h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-[#6a5548]">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#fff6ee] px-4 py-2 font-semibold">
                <CalendarDays className="h-4 w-4" />
                {selectedTask.dueDate}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#fff6ee] px-4 py-2 font-semibold">
                <UserRound className="h-4 w-4" />
                {selectedTask.assignee}
              </span>
            </div>
          </div>

          <div className="rounded-[26px] border border-[#e6dbd2] bg-[#fffefd] p-5 sm:p-6">
            <div className="space-y-6">
              <div className={`grid gap-3 ${direction === 'rtl' ? 'md:grid-cols-[minmax(0,1fr)_11rem]' : 'md:grid-cols-[11rem_minmax(0,1fr)]'}`}>
                <div className={`text-lg font-bold text-[#27304a] ${direction === 'rtl' ? 'md:order-2 md:text-right' : 'md:text-left'}`}>
                  {t('team.taskTitle')}
                </div>
                <div className={`text-lg font-semibold text-[#877a71] ${direction === 'rtl' ? 'md:order-1 md:text-right' : 'md:text-left'}`}>
                  {selectedTask.title}
                </div>
              </div>

              <div className={`grid gap-3 ${direction === 'rtl' ? 'md:grid-cols-[minmax(0,1fr)_11rem]' : 'md:grid-cols-[11rem_minmax(0,1fr)]'}`}>
                <div className={`text-lg font-bold text-[#27304a] ${direction === 'rtl' ? 'md:order-2 md:text-right' : 'md:text-left'}`}>
                  {t('team.taskDescription')}
                </div>
                <div className={`text-lg leading-8 text-[#877a71] ${direction === 'rtl' ? 'md:order-1 md:text-right' : 'md:text-left'}`}>
                  {selectedTask.description}
                </div>
              </div>

              <div className={`grid gap-3 ${direction === 'rtl' ? 'md:grid-cols-[minmax(0,1fr)_11rem]' : 'md:grid-cols-[11rem_minmax(0,1fr)]'}`}>
                <div className={`text-lg font-bold text-[#27304a] ${direction === 'rtl' ? 'md:order-2 md:text-right' : 'md:text-left'}`}>
                  {t('team.taskStatus')}
                </div>
                <div className={`${direction === 'rtl' ? 'md:order-1 md:text-right' : 'md:text-left'}`}>
                  <TaskStatusBadge status={selectedTask.status} />
                </div>
              </div>

              <div className={`grid gap-3 ${direction === 'rtl' ? 'md:grid-cols-[minmax(0,1fr)_11rem]' : 'md:grid-cols-[11rem_minmax(0,1fr)]'}`}>
                <div className={`text-lg font-bold text-[#27304a] ${direction === 'rtl' ? 'md:order-2 md:text-right' : 'md:text-left'}`}>
                  {t('team.taskPhotos')}
                </div>
                <div className={`flex ${direction === 'rtl' ? 'md:order-1 md:justify-start' : 'md:justify-start'}`}>
                  <div className="flex h-28 w-28 items-center justify-center rounded-[22px] bg-[#dedede] text-[#8c8c8c]">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 [animation:var(--tab-animation)_0.35s_ease]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#fff4e8] px-4 py-2 text-sm font-semibold text-[#7a4d31]">
            <ClipboardList className="h-4 w-4" />
            <span>{t('team.tasks')}</span>
          </div>
          <div>
            <h1 className="text-[2rem] font-bold text-[#27304a]">{t('team.tasksTitle')}</h1>
            <p className="text-sm text-[#8a7769] sm:text-base">{t('team.tasksSubtitle')}</p>
          </div>
        </div>

        {showBackButton ? (
          <button
            onClick={onBackToMembers}
            className="rounded-[18px] border border-[#ddcdbd] bg-white px-5 py-3 text-sm font-semibold text-[#4b2f1a] shadow-[0_12px_26px_rgba(91,53,24,0.08)]"
          >
            {t('team.backToMembers')}
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <TaskStatCard label={t('team.taskCount')} value={stats.total} icon={ClipboardList} />
        <TaskStatCard label={t('team.taskInProgressCount')} value={stats.inProgress} icon={Clock3} />
        <TaskStatCard label={t('team.taskCompletedCount')} value={stats.completed} icon={CheckCircle2} />
      </div>

      <div className="relative w-full sm:max-w-[25rem]">
        <SearchIcon
          className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-[#5a473d] ${
            direction === 'rtl' ? 'right-4' : 'left-4'
          }`}
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('common.search')}
          className={`h-11 w-full rounded-2xl border border-[#ece2da] bg-white text-sm text-[#2c2330] outline-none transition placeholder:text-[#d9cfc5] focus:border-[#5a3b25] focus:ring-2 focus:ring-[#5a3b25]/10 ${
            direction === 'rtl' ? 'pr-12 text-right' : 'pl-12 text-left'
          }`}
        />
      </div>

      <div className="md:hidden space-y-4">
        {filteredTasks.length ? (
          filteredTasks.map((task) => (
            <article key={task.id} className="rounded-[24px] border border-[#eaded4] bg-white p-4 shadow-[0_12px_30px_rgba(91,53,24,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-[#2d283e]">{task.title}</h2>
                  <p className="text-sm leading-7 text-[#837568]">{task.description}</p>
                </div>

                <button
                  onClick={() => openTaskDetails(task.id)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#4b2f1a] text-white"
                  aria-label={t('team.taskView')}
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <TaskStatusBadge status={task.status} />
                <span className="inline-flex items-center gap-2 rounded-full bg-[#fff6ee] px-3 py-2 text-sm font-semibold text-[#6a5548]">
                  <CalendarDays className="h-4 w-4" />
                  {task.dueDate}
                </span>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[24px] border border-dashed border-[#d8c5b7] bg-white/80 px-5 py-12 text-center text-base font-semibold text-[#8a7769]">
            {t('team.emptyTasks')}
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-[24px] bg-white shadow-[0_12px_26px_rgba(91,53,24,0.08)] md:block">
        <div className="overflow-x-auto">
          <table className={`min-w-[760px] w-full ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
            <thead className="bg-[#4b2f1a] text-white">
              <tr className="text-lg font-semibold">
                <th className="px-6 py-5">{t('team.taskTitle')}</th>
                <th className="px-6 py-5">{t('team.taskDescription')}</th>
                <th className="px-6 py-5">{t('team.taskDueDate')}</th>
                <th className="px-6 py-5">{t('team.taskStatus')}</th>
                <th className={`px-6 py-5 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>{t('team.actions')}</th>
              </tr>
            </thead>
            <tbody className="text-[1.02rem] text-[#2f3346]">
              {filteredTasks.length ? (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="border-b border-[#e9edf5] last:border-b-0">
                    <td className="px-6 py-5 font-medium">{task.title}</td>
                    <td className="px-6 py-5 text-[#6c625a]">{task.description}</td>
                    <td className="px-6 py-5">{task.dueDate}</td>
                    <td className="px-6 py-5">
                      <TaskStatusBadge status={task.status} />
                    </td>
                    <td className="px-6 py-5">
                      <button
                        onClick={() => openTaskDetails(task.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3a2418] text-white transition hover:opacity-90"
                        aria-label={t('team.taskView')}
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-base font-semibold text-[#8a7769]">
                    {t('team.emptyTasks')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TeamPagination />
    </div>
  );
}
