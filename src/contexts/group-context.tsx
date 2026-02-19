'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';
import type { Group, GroupMember, MemberFunction } from '@/lib/types';
import { DEMO_GROUPS, DEMO_GROUP_MEMBERS } from '@/lib/demo-data';

// ── helpers ──────────────────────────────────────────────────
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin I/1/O/0 para evitar confusión
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function randomGroupColor(): string {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ── context types ────────────────────────────────────────────
interface GroupContextType {
  groups: Group[];
  currentGroupId: string | null;
  currentGroup: Group | null;
  members: GroupMember[];
  myMemberships: { groupId: string; groupName: string; memberFunction: MemberFunction }[];
  loadingGroups: boolean;

  // Admin actions
  createGroup: (name: string, description?: string) => Promise<string>;
  deleteGroup: (groupId: string) => Promise<void>;
  updateGroup: (groupId: string, data: Partial<Pick<Group, 'name' | 'description' | 'color'>>) => Promise<void>;
  regenerateInviteCode: (groupId: string) => Promise<string>;

  // Member actions
  joinGroup: (inviteCode: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  removeMember: (groupId: string, uid: string) => Promise<void>;
  updateMemberFunction: (groupId: string, uid: string, fn: MemberFunction) => Promise<void>;

  // Navigation
  setCurrentGroupId: (id: string | null) => void;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

// ── provider ─────────────────────────────────────────────────
export function GroupProvider({ children }: { children: ReactNode }) {
  const { user, profile, role, loading: authLoading, isDemo } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [myMemberships, setMyMemberships] = useState<GroupContextType['myMemberships']>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const uid = user?.uid;

  // ── Listen to groups where I am a member ──────────────────
  useEffect(() => {
    // Modo demo: cargar datos de ejemplo
    if (isDemo) {
      setGroups([...DEMO_GROUPS]);
      setMyMemberships(
        DEMO_GROUPS.filter((g) =>
          DEMO_GROUP_MEMBERS[g.id]?.some((m) => m.uid === uid)
        ).map((g) => ({
          groupId: g.id,
          groupName: g.name,
          memberFunction: DEMO_GROUP_MEMBERS[g.id]?.find((m) => m.uid === uid)?.memberFunction || 'otro',
        }))
      );
      setLoadingGroups(false);
      return;
    }

    if (!uid || authLoading || role === null) {
      setGroups([]);
      setMyMemberships([]);
      setLoadingGroups(false);
      return;
    }

    // We listen to ALL groups and then filter by membership on the client.
    // For scalability you'd use collectionGroup queries, but for this app this is fine.
    const unsub = onSnapshot(collection(db, 'groups'), (snap) => {
      const allGroups = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Group));
      setGroups(allGroups);
      setLoadingGroups(false);
    });

    return () => unsub();
  }, [uid, authLoading, role, isDemo]);

  // ── Listen for my memberships across all groups ───────────
  useEffect(() => {
    if (isDemo) return; // Ya cargamos memberships en el efecto anterior
    if (!uid || groups.length === 0) {
      setMyMemberships([]);
      return;
    }

    const unsubscribers: (() => void)[] = [];

    for (const group of groups) {
      const memberRef = doc(db, 'groups', group.id, 'members', uid);
      const unsub = onSnapshot(memberRef, (snap) => {
        setMyMemberships((prev) => {
          const without = prev.filter((m) => m.groupId !== group.id);
          if (snap.exists()) {
            const data = snap.data() as GroupMember;
            return [...without, { groupId: group.id, groupName: group.name, memberFunction: data.memberFunction }];
          }
          return without;
        });
      });
      unsubscribers.push(unsub);
    }

    return () => unsubscribers.forEach((u) => u());
  }, [uid, groups]);

  // ── Listen to members of the current group ────────────────
  useEffect(() => {
    if (!currentGroupId) {
      setMembers([]);
      return;
    }

    if (isDemo) {
      setMembers(DEMO_GROUP_MEMBERS[currentGroupId] || []);
      return;
    }

    const membersCol = collection(db, 'groups', currentGroupId, 'members');
    const unsub = onSnapshot(membersCol, (snap) => {
      setMembers(snap.docs.map((d) => ({ ...d.data(), id: d.id } as GroupMember)));
    });

    return () => unsub();
  }, [currentGroupId]);

  const currentGroup = groups.find((g) => g.id === currentGroupId) ?? null;

  // ── CRUD ──────────────────────────────────────────────────

  const createGroup = useCallback(
    async (name: string, description?: string): Promise<string> => {
      if (!uid || !profile) throw new Error('No autenticado');
      if (role !== 'admin') throw new Error('Solo los administradores pueden crear grupos');

      const inviteCode = generateInviteCode();
      const group: Omit<Group, 'id'> = {
        name,
        description: description || '',
        color: randomGroupColor(),
        createdBy: uid,
        createdAt: Date.now(),
        inviteCode,
      };

      if (isDemo) {
        const newId = `demo-group-${Date.now()}`;
        setGroups((prev) => [...prev, { ...group, id: newId }]);
        setMyMemberships((prev) => [...prev, { groupId: newId, groupName: name, memberFunction: 'administración' }]);
        return newId;
      }

      const groupRef = doc(collection(db, 'groups'));
      await setDoc(groupRef, group);

      // Add creator as first member
      const memberRef = doc(db, 'groups', groupRef.id, 'members', uid);
      const member: Omit<GroupMember, 'id'> = {
        uid,
        displayName: profile.displayName,
        email: profile.email,
        role: 'admin',
        memberFunction: 'administración',
        joinedAt: Date.now(),
      };
      await setDoc(memberRef, member);

      return groupRef.id;
    },
    [uid, profile, role, isDemo]
  );

  const deleteGroup = useCallback(
    async (groupId: string) => {
      if (!uid) throw new Error('No autenticado');
      const group = groups.find((g) => g.id === groupId);
      if (!group) throw new Error('Grupo no encontrado');
      if (group.createdBy !== uid) throw new Error('Solo el creador puede eliminar el grupo');

      if (isDemo) {
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
        setMyMemberships((prev) => prev.filter((m) => m.groupId !== groupId));
        if (currentGroupId === groupId) setCurrentGroupId(null);
        return;
      }

      // Delete members, tasks and projects subcollections first
      const membersSnap = await getDocs(collection(db, 'groups', groupId, 'members'));
      const groupTasksSnap = await getDocs(collection(db, 'groups', groupId, 'tasks'));
      const groupProjectsSnap = await getDocs(collection(db, 'groups', groupId, 'projects'));
      const batch = writeBatch(db);
      membersSnap.docs.forEach((d) => batch.delete(d.ref));
      groupTasksSnap.docs.forEach((d) => batch.delete(d.ref));
      groupProjectsSnap.docs.forEach((d) => batch.delete(d.ref));
      batch.delete(doc(db, 'groups', groupId));
      await batch.commit();

      if (currentGroupId === groupId) setCurrentGroupId(null);
    },
    [uid, groups, currentGroupId, isDemo]
  );

  const updateGroup = useCallback(
    async (groupId: string, data: Partial<Pick<Group, 'name' | 'description' | 'color'>>) => {
      if (isDemo) {
        setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, ...data } : g)));
        return;
      }
      await updateDoc(doc(db, 'groups', groupId), data);
    },
    [isDemo]
  );

  const regenerateInviteCode = useCallback(
    async (groupId: string): Promise<string> => {
      const newCode = generateInviteCode();
      if (isDemo) {
        setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, inviteCode: newCode } : g)));
        return newCode;
      }
      await updateDoc(doc(db, 'groups', groupId), { inviteCode: newCode });
      return newCode;
    },
    [isDemo]
  );

  const joinGroup = useCallback(
    async (inviteCode: string) => {
      if (!uid || !profile) throw new Error('No autenticado');

      const target = groups.find((g) => g.inviteCode === inviteCode.trim().toUpperCase());
      if (!target) {
        if (isDemo) throw new Error('Código de invitación inválido');
        // Query Firestore directly in case the group wasn't loaded yet
        const q = query(collection(db, 'groups'), where('inviteCode', '==', inviteCode.trim().toUpperCase()));
        const snap = await getDocs(q);
        if (snap.empty) throw new Error('Código de invitación inválido');
        const groupDoc = snap.docs[0];
        const memberRef = doc(db, 'groups', groupDoc.id, 'members', uid);
        await setDoc(memberRef, {
          uid,
          displayName: profile.displayName,
          email: profile.email,
          role: profile.role,
          memberFunction: 'otro' as MemberFunction,
          joinedAt: Date.now(),
        });
        return;
      }

      // Check if already a member
      const alreadyMember = myMemberships.some((m) => m.groupId === target.id);
      if (alreadyMember) throw new Error('Ya eres miembro de este grupo');

      if (isDemo) {
        setMyMemberships((prev) => [...prev, { groupId: target.id, groupName: target.name, memberFunction: 'otro' }]);
        return;
      }

      const memberRef = doc(db, 'groups', target.id, 'members', uid);
      await setDoc(memberRef, {
        uid,
        displayName: profile.displayName,
        email: profile.email,
        role: profile.role,
        memberFunction: 'otro' as MemberFunction,
        joinedAt: Date.now(),
      });
    },
    [uid, profile, groups, myMemberships, isDemo]
  );

  const leaveGroup = useCallback(
    async (groupId: string) => {
      if (!uid) return;
      const group = groups.find((g) => g.id === groupId);
      if (group?.createdBy === uid) throw new Error('El creador no puede abandonar el grupo. Elimínalo en su lugar.');
      if (isDemo) {
        setMyMemberships((prev) => prev.filter((m) => m.groupId !== groupId));
        if (currentGroupId === groupId) setCurrentGroupId(null);
        return;
      }
      await deleteDoc(doc(db, 'groups', groupId, 'members', uid));
      if (currentGroupId === groupId) setCurrentGroupId(null);
    },
    [uid, groups, currentGroupId, isDemo]
  );

  const removeMember = useCallback(
    async (groupId: string, memberUid: string) => {
      if (!uid) return;
      const group = groups.find((g) => g.id === groupId);
      if (!group) throw new Error('Grupo no encontrado');
      if (group.createdBy !== uid && role !== 'admin')
        throw new Error('Solo el admin del grupo puede remover miembros');
      if (memberUid === group.createdBy) throw new Error('No puedes remover al creador del grupo');
      if (isDemo) {
        setMembers((prev) => prev.filter((m) => m.uid !== memberUid));
        return;
      }
      await deleteDoc(doc(db, 'groups', groupId, 'members', memberUid));
    },
    [uid, groups, role, isDemo]
  );

  const updateMemberFunction = useCallback(
    async (groupId: string, memberUid: string, fn: MemberFunction) => {
      if (isDemo) {
        setMembers((prev) => prev.map((m) => (m.uid === memberUid ? { ...m, memberFunction: fn } : m)));
        return;
      }
      await updateDoc(doc(db, 'groups', groupId, 'members', memberUid), { memberFunction: fn });
    },
    [isDemo]
  );

  const value: GroupContextType = {
    groups,
    currentGroupId,
    currentGroup,
    members,
    myMemberships,
    loadingGroups,
    createGroup,
    deleteGroup,
    updateGroup,
    regenerateInviteCode,
    joinGroup,
    leaveGroup,
    removeMember,
    updateMemberFunction,
    setCurrentGroupId,
  };

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
}

export function useGroups() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error('useGroups must be used inside GroupProvider');
  return ctx;
}
