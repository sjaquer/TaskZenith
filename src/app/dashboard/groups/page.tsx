'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useGroups } from '@/contexts/group-context';
import { MEMBER_FUNCTIONS, type MemberFunction, type GroupMember } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Plus,
  Copy,
  RefreshCw,
  Trash2,
  LogOut,
  MoreVertical,
  Shield,
  UserPlus,
  Building2,
  Crown,
  Settings2,
  KeyRound,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

// ── Color picker para grupos ─────────────────────────────────
const GROUP_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
  '#84cc16', '#a855f7',
];

// ── Componente: Crear grupo (solo admin) ─────────────────────
function CreateGroupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { createGroup } = useGroups();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createGroup(name.trim(), description.trim());
      toast({ title: 'Grupo creado', description: `"${name}" se creó correctamente.`, className: 'bg-primary text-primary-foreground' });
      setName('');
      setDescription('');
      onOpenChange(false);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Crear nuevo grupo
          </DialogTitle>
          <DialogDescription>
            Crea un entorno aislado para tu equipo o empresa. Recibirás un código de invitación para compartir.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="group-name">Nombre del grupo</Label>
            <Input
              id="group-name"
              placeholder="Ej: Mi Empresa S.A."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group-desc">Descripción (opcional)</Label>
            <Textarea
              id="group-desc"
              placeholder="Ej: Equipo de desarrollo web..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={!name.trim() || loading}>
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Crear Grupo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Componente: Unirse a grupo ───────────────────────────────
function JoinGroupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { joinGroup } = useGroups();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      await joinGroup(code.trim());
      toast({ title: '¡Te uniste!', description: 'Ahora formas parte del grupo.', className: 'bg-primary text-primary-foreground' });
      setCode('');
      onOpenChange(false);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Unirse a un grupo
          </DialogTitle>
          <DialogDescription>
            Introduce el código de invitación que te compartió un administrador.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Código de invitación</Label>
            <Input
              id="invite-code"
              placeholder="Ej: A3B7K9M2"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={10}
              className="text-center text-lg tracking-widest font-mono"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleJoin} disabled={!code.trim() || loading}>
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
            Unirse
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Componente: Editar grupo ─────────────────────────────────
function EditGroupDialog({
  open,
  onOpenChange,
  groupId,
  initialName,
  initialDescription,
  initialColor,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groupId: string;
  initialName: string;
  initialDescription: string;
  initialColor: string;
}) {
  const { updateGroup } = useGroups();
  const { toast } = useToast();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [color, setColor] = useState(initialColor);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await updateGroup(groupId, { name: name.trim(), description: description.trim(), color });
      toast({ title: 'Grupo actualizado', className: 'bg-primary text-primary-foreground' });
      onOpenChange(false);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            Editar grupo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} rows={3} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="w-4 h-4" /> Color
            </Label>
            <div className="flex flex-wrap gap-2">
              {GROUP_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                    color === c ? 'border-foreground scale-110 ring-2 ring-primary' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!name.trim() || loading}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Componente: Tarjeta de miembro ───────────────────────────
function MemberCard({
  member,
  groupId,
  isCreator,
  canManage,
}: {
  member: GroupMember;
  groupId: string;
  isCreator: boolean;
  canManage: boolean;
}) {
  const { removeMember, updateMemberFunction } = useGroups();
  const { toast } = useToast();

  const handleFunctionChange = async (fn: MemberFunction) => {
    try {
      await updateMemberFunction(groupId, member.uid, fn);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleRemove = async () => {
    try {
      await removeMember(groupId, member.uid);
      toast({ title: 'Miembro removido', className: 'bg-primary text-primary-foreground' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
          {member.displayName?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{member.displayName}</p>
            {isCreator && <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="text-[10px] capitalize">
          {member.role === 'admin' ? 'Admin' : 'Operador'}
        </Badge>

        {canManage && !isCreator ? (
          <div className="flex items-center gap-1">
            <Select value={member.memberFunction} onValueChange={(v) => handleFunctionChange(v as MemberFunction)}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEMBER_FUNCTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Remover a {member.displayName}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Este miembro será removido del grupo. Podrá unirse de nuevo con un código de invitación.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRemove} className="bg-destructive hover:bg-destructive/90">
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <Badge variant="outline" className="text-[10px] capitalize">
            {MEMBER_FUNCTIONS.find((f) => f.value === member.memberFunction)?.label || member.memberFunction}
          </Badge>
        )}
      </div>
    </div>
  );
}

// ── Componente: Detalle del grupo seleccionado ──────────────
function GroupDetail() {
  const { user } = useAuth();
  const { currentGroup, currentGroupId, members, deleteGroup, leaveGroup, regenerateInviteCode, setCurrentGroupId } = useGroups();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);

  if (!currentGroup || !currentGroupId) {
    return (
      <Card className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center text-muted-foreground space-y-3">
          <Users className="w-16 h-16 mx-auto opacity-30" />
          <p className="text-lg font-medium">Selecciona un grupo</p>
          <p className="text-sm">Elige un grupo de la lista o crea uno nuevo para empezar.</p>
        </div>
      </Card>
    );
  }

  const isOwner = currentGroup.createdBy === user?.uid;
  const canManage = isOwner; // Solo el creador puede gestionar

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentGroup.inviteCode);
    toast({ title: 'Código copiado', description: currentGroup.inviteCode, className: 'bg-primary text-primary-foreground' });
  };

  const handleRegenerate = async () => {
    try {
      const code = await regenerateInviteCode(currentGroupId);
      toast({ title: 'Nuevo código generado', description: code, className: 'bg-primary text-primary-foreground' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGroup(currentGroupId);
      toast({ title: 'Grupo eliminado', className: 'bg-primary text-primary-foreground' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleLeave = async () => {
    try {
      await leaveGroup(currentGroupId);
      toast({ title: 'Abandonaste el grupo', className: 'bg-primary text-primary-foreground' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  return (
    <>
      <Card className="flex-1 overflow-hidden">
        {/* Header del grupo */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xl"
                style={{ backgroundColor: currentGroup.color }}
              >
                {currentGroup.name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <CardTitle className="text-lg truncate">{currentGroup.name}</CardTitle>
                {currentGroup.description && (
                  <CardDescription className="text-xs line-clamp-2">{currentGroup.description}</CardDescription>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canManage && (
                  <>
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                      <Settings2 className="mr-2 w-4 h-4" /> Editar grupo
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {isOwner ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="mr-2 w-4 h-4" /> Eliminar grupo
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar &quot;{currentGroup.name}&quot;?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará permanentemente el grupo y removerá a todos los miembros. No se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <LogOut className="mr-2 w-4 h-4" /> Abandonar grupo
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Abandonar &quot;{currentGroup.name}&quot;?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Dejarás de ver la información de este grupo. Podrás unirte de nuevo con un código de invitación.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLeave} className="bg-destructive hover:bg-destructive/90">
                          Abandonar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Código de invitación (solo admin/creador) */}
          {canManage && (
            <div className="rounded-lg border bg-secondary/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <KeyRound className="w-3 h-3" /> Código de Invitación
                </Label>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyCode} title="Copiar">
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRegenerate} title="Regenerar">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-2xl font-mono font-bold tracking-[0.3em] text-center py-2 select-all">
                {currentGroup.inviteCode}
              </p>
              <p className="text-[10px] text-muted-foreground text-center">
                Comparte este código con los miembros de tu equipo para que se unan.
              </p>
            </div>
          )}

          <Separator />

          {/* Lista de miembros */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" /> Miembros ({members.length})
              </h3>
            </div>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {members
                  .sort((a, b) => {
                    // Creator first, then admins, then operators
                    if (a.uid === currentGroup.createdBy) return -1;
                    if (b.uid === currentGroup.createdBy) return 1;
                    if (a.role === 'admin' && b.role !== 'admin') return -1;
                    if (b.role === 'admin' && a.role !== 'admin') return 1;
                    return a.displayName.localeCompare(b.displayName);
                  })
                  .map((member) => (
                    <MemberCard
                      key={member.uid}
                      member={member}
                      groupId={currentGroupId}
                      isCreator={member.uid === currentGroup.createdBy}
                      canManage={canManage}
                    />
                  ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {editOpen && (
        <EditGroupDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          groupId={currentGroupId}
          initialName={currentGroup.name}
          initialDescription={currentGroup.description || ''}
          initialColor={currentGroup.color}
        />
      )}
    </>
  );
}

// ── Página principal ─────────────────────────────────────────
export default function GroupsPage() {
  const { role } = useAuth();
  const { myMemberships, groups, currentGroupId, setCurrentGroupId, loadingGroups } = useGroups();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const myGroups = groups.filter((g) => myMemberships.some((m) => m.groupId === g.id));

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight font-headline">
            Grupos y Equipos
          </h1>
          <p className="text-sm text-muted-foreground">
            {role === 'admin'
              ? 'Crea y administra grupos para organizar a tu equipo.'
              : 'Únete a grupos e interactúa con tu equipo.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setJoinOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Unirse a grupo</span>
            <span className="sm:hidden">Unirse</span>
          </Button>
          {role === 'admin' && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Crear grupo</span>
              <span className="sm:hidden">Crear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar: Group list */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-3">
            Mis Grupos ({myGroups.length})
          </h2>

          {loadingGroups ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
              Cargando...
            </div>
          ) : myGroups.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Sin grupos aún</p>
                <p className="text-xs mt-1">
                  {role === 'admin' ? 'Crea tu primer grupo para empezar.' : 'Pide un código de invitación a un admin.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-1.5 pr-1">
                {myGroups.map((group) => {
                  const membership = myMemberships.find((m) => m.groupId === group.id);
                  const isActive = currentGroupId === group.id;
                  return (
                    <button
                      key={group.id}
                      onClick={() => setCurrentGroupId(group.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-secondary/30 hover:bg-secondary/60'
                      )}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : group.color }}
                      >
                        {group.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{group.name}</p>
                        <p className={cn('text-[10px] capitalize', isActive ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                          {membership
                            ? MEMBER_FUNCTIONS.find((f) => f.value === membership.memberFunction)?.label || membership.memberFunction
                            : ''}
                        </p>
                      </div>
                      {group.createdBy === membership?.groupId && <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Main: Group detail */}
        <GroupDetail />
      </div>

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
      <JoinGroupDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </div>
  );
}
