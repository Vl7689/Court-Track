'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthContext } from '@/app/providers';
import PlayerCombobox from '@/components/PlayerCombobox';
import type { Group, GroupDetail, User } from '@/types';

export default function GroupsPage() {
  const { user } = useAuthContext();
  const qc = useQueryClient();
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [openGroupId, setOpenGroupId] = useState<number | null>(null);
  const [addUsername, setAddUsername] = useState('');
  const [addError, setAddError] = useState('');

  const { data: groups, isLoading } = useQuery<Group[]>({ queryKey: ['groups'], queryFn: () => api.get('/groups').then(r => r.data as Group[]) });
  const { data: groupDetail } = useQuery<GroupDetail>({ queryKey: ['group', openGroupId], queryFn: () => api.get(`/groups/${openGroupId}`).then(r => r.data as GroupDetail), enabled: openGroupId !== null });
  const { data: users } = useQuery<User[]>({ queryKey: ['users'], queryFn: () => api.get('/auth/users').then(r => r.data as User[]) });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post('/groups', { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['groups'] }); setCreateName(''); setCreating(false); setCreateError(''); },
    onError: (e: unknown) => { const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error; setCreateError(typeof msg === 'string' ? msg : 'Failed to create group'); },
  });

  const addMutation = useMutation({
    mutationFn: ({ groupId, username }: { groupId: number; username: string }) => api.post(`/groups/${groupId}/members`, { username }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['group', openGroupId] }); setAddUsername(''); setAddError(''); },
    onError: (e: unknown) => { const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error; setAddError(typeof msg === 'string' ? msg : 'Failed to add member'); },
  });

  const removeMutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: number; userId: number }) => api.delete(`/groups/${groupId}/members/${userId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['group', openGroupId] }); qc.invalidateQueries({ queryKey: ['groups'] }); },
  });

  const memberIds = new Set(groupDetail?.members.map(m => m.user.id) ?? []);
  const addablePlayers = (users ?? []).filter(u => !memberIds.has(u.id));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Groups</h2>
          <p className="text-slate-400 text-sm mt-0.5">Create private circles and filter the leaderboard to your crew.</p>
        </div>
        {!creating && (
          <button onClick={() => setCreating(true)} className="bg-green-500 hover:bg-green-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors text-sm">
            + New Group
          </button>
        )}
      </div>

      {creating && (
        <form onSubmit={e => { e.preventDefault(); if (createName.trim()) createMutation.mutate(createName.trim()); }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6 flex gap-3">
          <input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Group name (e.g. Tuesday Crew)"
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-green-500 text-sm"
            autoFocus maxLength={50} />
          <button type="submit" disabled={createMutation.isPending} className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-lg text-sm">Create</button>
          <button type="button" onClick={() => { setCreating(false); setCreateError(''); }} className="text-slate-500 hover:text-white px-3 py-2 text-sm">Cancel</button>
          {createError && <p className="text-red-400 text-xs">{createError}</p>}
        </form>
      )}

      {isLoading && <div className="text-center py-16 text-slate-500">Loading groups...</div>}
      {!isLoading && groups?.length === 0 && (
        <div className="text-center py-16 text-slate-500 border border-dashed border-slate-700 rounded-xl">No groups yet. Create one to get started.</div>
      )}

      <div className="space-y-4">
        {groups?.map(g => {
          const isOpen = openGroupId === g.id;
          const isCreator = g.createdBy.id === user?.id;
          return (
            <div key={g.id} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
              <button onClick={() => { setOpenGroupId(isOpen ? null : g.id); setAddUsername(''); setAddError(''); }}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-700/30 transition-colors text-left">
                <div>
                  <p className="font-semibold text-white">{g.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {g._count.members} {g._count.members === 1 ? 'member' : 'members'} · created by{' '}
                    <span className={g.createdBy.id === user?.id ? 'text-green-400' : 'text-slate-300'}>
                      {g.createdBy.id === user?.id ? 'you' : g.createdBy.username}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href={`/leaderboard?group=${g.id}`} onClick={e => e.stopPropagation()}
                    className="text-xs text-green-400 hover:text-green-300 px-2 py-1 border border-green-500/30 rounded-md transition-colors">
                    Leaderboard
                  </Link>
                  <span className="text-slate-500 text-sm">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {isOpen && groupDetail?.id === g.id && (
                <div className="border-t border-slate-700 px-5 py-4 space-y-4">
                  <div className="space-y-2">
                    {groupDetail.members.map(m => (
                      <div key={m.userId} className="flex items-center justify-between">
                        <Link href={`/profile/${m.user.id}`} className={`text-sm font-medium hover:text-green-400 transition-colors ${m.user.id === user?.id ? 'text-green-400' : 'text-white'}`}>
                          {m.user.username}{m.user.id === user?.id && <span className="ml-1.5 text-xs text-slate-500">(you)</span>}
                        </Link>
                        {(isCreator || m.user.id === user?.id) && m.user.id !== groupDetail.createdBy.id && (
                          <button onClick={() => removeMutation.mutate({ groupId: g.id, userId: m.user.id })} className="text-xs text-slate-600 hover:text-red-400 transition-colors">Remove</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <form onSubmit={e => { e.preventDefault(); if (addUsername.trim() && openGroupId) addMutation.mutate({ groupId: openGroupId, username: addUsername.trim() }); }}
                    className="flex gap-2 pt-2 border-t border-slate-700/60">
                    <div className="flex-1">
                      <PlayerCombobox users={addablePlayers} value={addUsername} onChange={setAddUsername} placeholder="Add player by username..."
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-green-500 text-sm" />
                    </div>
                    <button type="submit" disabled={!addUsername.trim() || addMutation.isPending} className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">Add</button>
                  </form>
                  {addError && <p className="text-red-400 text-xs">{addError}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
