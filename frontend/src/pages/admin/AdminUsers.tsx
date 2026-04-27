import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getAuthToken } from '@/lib/supabase';
import { useHotel } from '@/contexts/HotelContext';
import { useToast } from '@/hooks/use-toast';
import { logAuditAction } from './AdminSettings';
import { supabase } from '@/lib/supabase';
import { UserRole, User } from '@/types/hotel';
import { Shield, ShieldOff, Plus, Loader2, Pencil, Trash2 } from 'lucide-react';

// Helper to get auth token - tries localStorage first, then Supabase
const getAuthToken = async (): Promise<string | null> => {
  // First check if we have a cached user (immediate, no async)
  const cachedUser = localStorage.getItem('cached-user');
  if (cachedUser) {
    // We have a cached user, try to get token quickly
    try {
      const result = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Token fetch timeout')), 5000))
      ]) as any;
      if (result.data?.session?.access_token) {
        return result.data.session.access_token;
      }
    } catch (err) {
      console.warn('⚠️ Quick token fetch failed, will retry');
    }
  }
  
  // No cached user or quick fetch failed, try longer timeout
  try {
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Token fetch timeout')), 30000))
    ]) as any;
    return result.data?.session?.access_token || null;
  } catch (err) {
    console.warn('⚠️ Auth token fetch timed out');
    return null;
  }
};

const roleColors: Record<string, string> = {
  admin: 'bg-primary text-primary-foreground',
  staff: 'bg-warning/20 text-warning',
  user: 'bg-accent text-accent-foreground',
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  staff: 'Staff',
  user: 'Client',
};

const AdminUsers = () => {
  const { bookings, users, refreshUsers } = useHotel();
  const { toast } = useToast();
  const { user: currentUser, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  // Loading states for operations
  const [isCreating, setIsCreating] = useState(false);

  // Add User Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'Client' as UserRole,
  });

  // Edit User Dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });

  // Delete User Dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // User Details Dialog state
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Refresh users when auth is ready
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      refreshUsers();
    }
  }, [isAuthLoading, isAuthenticated, refreshUsers]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) throw new Error('Failed to update role');

      // Log to audit trail
      const user = users.find(u => u.id === userId);
      logAuditAction(
        'Changed User Role',
        user?.name || user?.email || userId,
        'success',
        `Role changed to ${newRole}`
      );

      await refreshUsers();
      toast({ title: `User role updated to ${newRole}` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if email already exists
    if (users.find(u => u.email === newUser.email)) {
      toast({ title: 'Error', description: 'Email already exists', variant: 'destructive' });
      return;
    }

    setIsCreating(true);

    try {
      // Call backend API to create user
      const response = await fetch('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}` // Adjust based on your token storage
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          phone: newUser.phone || '',
          role: newUser.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      await refreshUsers();
      toast({ title: 'User created successfully!', description: `${newUser.name} has been added.` });
      
      // Reset form and close dialog
      setIsAddDialogOpen(false);
      setNewUser({ name: '', email: '', password: '', phone: '', role: 'Client' });
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({ title: 'Error', description: error.message || 'Failed to create user', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleUserActive = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    try {
      const response = await fetch(`http://localhost:3000/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({ is_active: !user.isActive })
      });

      if (!response.ok) throw new Error('Failed to update status');

      // Log to audit trail
      logAuditAction(
        user.isActive ? 'Deactivated User' : 'Activated User',
        user.name || user.email,
        user.isActive ? 'warning' : 'success',
        `User account ${user.isActive ? 'deactivated' : 'activated'} by admin`
      );

      await refreshUsers();
      toast({ title: user.isActive ? 'Account deactivated' : 'Account activated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  // Edit dialog functions
  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, phone: user.phone || '' });
    setIsEditDialogOpen(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const response = await fetch(`http://localhost:3000/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) throw new Error('Failed to update user');

      await refreshUsers();
      toast({ title: 'User updated successfully' });
      setIsEditDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update user', variant: 'destructive' });
    }
  };

  // Delete dialog functions
  const openDeleteDialog = (user: User) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  // Details dialog function
  const openDetailsDialog = (user: User) => {
    setSelectedUser(user);
    setIsDetailsDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      const response = await fetch(`http://localhost:3000/api/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete user');

      // Log to audit trail
      logAuditAction(
        'Deleted User',
        deletingUser.name || deletingUser.email,
        'warning',
        `User permanently deleted by admin`
      );

      await refreshUsers();
      toast({ title: 'User deleted successfully' });
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">User & Staff Management</h1>
          <p className="text-sm text-muted-foreground">{users.length} registered users</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      {isAuthLoading ? (
        <div className="mt-12 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">No users found</p>
          <Button 
            onClick={() => refreshUsers()} 
            className="mt-4" 
            variant="outline"
          >
            Retry
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {users.map(user => {
          const userBookings = bookings.filter(b => b.userId === user.id);
          return (
            <Card 
              key={user.id} 
              className={`card-elevated cursor-pointer hover:shadow-lg transition-shadow ${!user.isActive ? 'opacity-60' : ''}`}
              onClick={() => openDetailsDialog(user)}
            >
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email} · {user.phone}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                      {!user.isActive && <span className="ml-2 text-destructive font-medium">· Deactivated</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className={roleColors[user.role]} onClick={(e) => e.stopPropagation()}>{roleLabels[user.role]}</Badge>
                  <span className="text-sm text-muted-foreground" onClick={(e) => e.stopPropagation()}>{userBookings.length} booking(s)</span>
                  <Select value={user.role} onValueChange={v => handleRoleChange(user.id, v as UserRole)}>
                    <SelectTrigger className="w-28" onClick={(e) => e.stopPropagation()}><SelectValue placeholder={roleLabels[user.role]} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Client</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant={user.isActive ? 'outline' : 'default'}
                    onClick={(e) => { e.stopPropagation(); toggleUserActive(user.id); }}
                    className="gap-1"
                  >
                    {user.isActive ? <><ShieldOff className="h-3 w-3" /> Deactivate</> : <><Shield className="h-3 w-3" /> Activate</>}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); openEditDialog(user); }}
                    className="gap-1"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => { e.stopPropagation(); openDeleteDialog(user); }}
                    className="gap-1"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        </div>
      )}

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={newUser.name}
                onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={newUser.email}
                onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 8 chars, upper, lower, number"
                value={newUser.password}
                onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1-555-0000"
                value={newUser.phone}
                onChange={e => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role <span className="text-destructive">*</span></Label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value as UserRole }))}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="user">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating...</> : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-destructive">Delete User</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete <strong>{deletingUser?.name}</strong> ({deletingUser?.email})?
            </p>
            <p className="text-sm text-destructive mt-2">This action cannot be undone.</p>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteUser}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">User Details</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-2xl">
                {selectedUser?.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
                <Badge className={selectedUser ? roleColors[selectedUser.role] : ''}>
                  {selectedUser ? roleLabels[selectedUser.role] : ''}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-muted-foreground">Full Name</div>
              <div className="col-span-2 font-medium">{selectedUser?.name}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-muted-foreground">Email</div>
              <div className="col-span-2 font-medium">{selectedUser?.email}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-muted-foreground">Phone</div>
              <div className="col-span-2 font-medium">{selectedUser?.phone || 'N/A'}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-muted-foreground">Role</div>
              <div className="col-span-2 font-medium capitalize">{selectedUser?.role}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-muted-foreground">Status</div>
              <div className="col-span-2 font-medium">
                {selectedUser?.isActive ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-destructive">Deactivated</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-muted-foreground">Joined</div>
              <div className="col-span-2 font-medium">
                {selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" onClick={() => setIsDetailsDialogOpen(false)}>
              Okay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
