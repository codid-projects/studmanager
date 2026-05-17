'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PlusCircleIcon, SearchIcon } from '@/components/layout/AppIcons';
import { useLocale, useTranslation } from '@/lib/locale-context';
import { TeamMemberModal } from './TeamMemberModal';
import { TeamMembersTable } from './TeamMembersTable';
import { TeamTaskModal } from './TeamTaskModal';
import { emptyMemberForm, emptyTaskForm, initialMembers, initialTasks, type Member, type MemberFormState, type TaskFormState } from './types';
import { ListCheck, UsersRound } from 'lucide-react';
import { TeamTasksPanel } from './TeamTasksPanel';

export function TeamPageContent() {
  const { direction } = useLocale();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [members, setMembers] = useState(initialMembers);
  const [tasks, setTasks] = useState(initialTasks);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'add' | 'edit' | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [form, setForm] = useState<MemberFormState>(emptyMemberForm);
  const [taskForm, setTaskForm] = useState<TaskFormState>(emptyTaskForm);

  const activeView = searchParams.get('view') === 'tasks' ? 'tasks' : 'members';

  const filteredMembers = useMemo(() => {
    if (!query.trim()) return members;
    return members.filter((member) =>
      [member.name, member.role, member.username].some((value) =>
        value.toLowerCase().includes(query.trim().toLowerCase())
      )
    );
  }, [members, query]);

  const openAddModal = () => {
    setForm(emptyMemberForm);
    setEditingMemberId(null);
    setMode('add');
  };

  const openEditModal = (member: Member) => {
    setForm({
      name: member.name,
      role: member.role,
      username: member.username,
      password: member.password,
    });
    setEditingMemberId(member.id);
    setMode('edit');
  };

  const closeModal = () => {
    setMode(null);
    setEditingMemberId(null);
  };

  const openTaskModal = () => {
    setTaskForm(emptyTaskForm);
    setTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setTaskModalOpen(false);
  };

  const saveMember = () => {
    if (!form.name || !form.username || !form.password) return;

    if (mode === 'edit' && editingMemberId) {
      setMembers((current) =>
        current.map((member) => (member.id === editingMemberId ? { ...member, ...form } : member))
      );
      closeModal();
      return;
    }

    setMembers((current) => [{ id: Date.now().toString(), ...form }, ...current]);
    closeModal();
  };

  const saveTask = () => {
    if (!taskForm.title || !taskForm.description || !taskForm.assignee || !taskForm.dueDate) return;

    setTasks((current) => [{ id: Date.now().toString(), ...taskForm }, ...current]);
    closeTaskModal();
    updateTeamView('tasks');
  };

  const updateTeamView = (view: 'members' | 'tasks') => {
    const params = new URLSearchParams(searchParams.toString());

    if (view === 'tasks') {
      params.set('view', 'tasks');
    } else {
      params.delete('view');
    }

    params.delete('task');

    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  return (
    <div className="space-y-7">
      <section className="space-y-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <h1 className="text-[2.1rem] font-bold text-[#27304a]">{t('team.title')}</h1>

            <div className="inline-flex rounded-[18px] border border-[#eadfd9] bg-white p-1 shadow-[0_10px_24px_rgba(91,53,24,0.06)]">
              <button
                type="button"
                onClick={() => updateTeamView('members')}
                className={`inline-flex items-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-bold transition ${
                  activeView === 'members' ? 'bg-[#4b2f1a] text-white' : 'text-[#4b2f1a] hover:bg-[#fbf8f4]'
                }`}
              >
                <UsersRound className="h-4 w-4" />
                <span>{t('team.manageMembers')}</span>
              </button>

              <button
                type="button"
                onClick={() => updateTeamView('tasks')}
                className={`inline-flex items-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-bold transition ${
                  activeView === 'tasks' ? 'bg-[#4b2f1a] text-white' : 'text-[#4b2f1a] hover:bg-[#fbf8f4]'
                }`}
              >
                <ListCheck className="h-4 w-4" />
                <span>{t('team.missions')}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            {activeView === 'members' ? (
              <div className="relative w-full sm:w-[24rem]">
                <SearchIcon
                  className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-[#5a473d] ${
                    direction === 'rtl' ? 'right-4' : 'left-4'
                  }`}
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('common.search')}
                  className={`h-11 w-full rounded-2xl border border-[#ece2da] bg-white text-sm text-[#2c2330] outline-none transition placeholder:text-[#d9cfc5] focus:border-[#5a3b25] focus:ring-2 focus:ring-[#5a3b25]/10 ${
                    direction === 'rtl' ? 'pr-12 text-right' : 'pl-12 text-left'
                  }`}
                />
              </div>
            ) : null}

            <div className="flex flex-col items-stretch gap-3 sm:flex-row">
              <button
                onClick={openAddModal}
                className="flex items-center justify-center gap-2 rounded-[18px] bg-[#4b2f1a] px-6 py-3 text-[1.05rem] font-bold text-white whitespace-nowrap"
              >
                <PlusCircleIcon className="h-5 w-5" />
                <span>{t('team.addUser')}</span>
              </button>

              <button
                onClick={openTaskModal}
                className="flex items-center justify-center gap-2 rounded-[18px] border border-[#d8c7b9] bg-white px-6 py-3 text-[1.05rem] font-bold text-[#4b2f1a] whitespace-nowrap shadow-[0_12px_26px_rgba(91,53,24,0.08)]"
              >
                <ListCheck className="h-5 w-5" />
                <span>{t('team.addMission')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {activeView === 'tasks' ? (
        <TeamTasksPanel tasks={tasks} showBackButton={false} onBackToMembers={() => updateTeamView('members')} />
      ) : (
        <section className="space-y-5 [animation:var(--tab-animation)_0.35s_ease]">

          <TeamMembersTable
            members={filteredMembers}
            onEdit={openEditModal}
            onDelete={(id) => setMembers((current) => current.filter((member) => member.id !== id))}
          />
        </section>
      )}

      {mode && (
        <TeamMemberModal
          title={mode === 'add' ? t('team.addNewMember') : t('team.editMember')}
          submitLabel={t('common.save')}
          iconSrc={mode === 'add' ? '/svgs/manage-members-foucs.svg' : '/svgs/manage-members.svg'}
          form={form}
          onChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))}
          onClose={closeModal}
          onSubmit={saveMember}
        />
      )}

      {taskModalOpen ? (
        <TeamTaskModal
          form={taskForm}
          onChange={(field, value) => setTaskForm((current) => ({ ...current, [field]: value }))}
          onClose={closeTaskModal}
          onSubmit={saveTask}
        />
      ) : null}
    </div>
  );
}
