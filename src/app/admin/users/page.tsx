'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, Search, RefreshCw, UserCheck } from 'lucide-react';
import styles from '../admin.module.css';
import UserModal from '@/components/admin/UserModal';

interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);

    // Auth check state to prevent hydration mismatches
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        fetchUsers();
    }, []);

    const [currentUserRole, setCurrentUserRole] = useState<string>('');

    useEffect(() => {
        const checkUserRole = async () => {
            const { data: { user } } = await createClient().auth.getUser();
            if (user) {
                const { data: profile } = await createClient()
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                setCurrentUserRole(profile?.role || '');
            }
        };
        checkUserRole();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                console.error('Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (id: string, newRole: string) => {
        // Optimistic update
        setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));

        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update role');
            }
        } catch (error: any) {
            console.error('Error updating role:', error);
            alert(`Error: ${error.message}`); // Show error to user
            fetchUsers(); // Revert on error
        }
    };

    const deleteUser = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;

        setUsers(users.filter(u => u.id !== id));

        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete user');
        } catch (error) {
            console.error('Error deleting user:', error);
            fetchUsers(); // Revert
        }
    };

    const filteredUsers = users.filter(user =>
        (user.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    if (!isClient) return null;

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>User Management</h1>
                    <p className={styles.pageSubtitle}>Manage system users and their roles</p>
                </div>
                <button onClick={() => setShowModal(true)} className={styles.addButton}>
                    <Plus size={18} />
                    Add User
                </button>
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className={styles.searchBar} style={{ flex: 1 }}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <button onClick={fetchUsers} className={styles.iconButton} title="Refresh">
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Users Table */}
            <div className={styles.tableContainer}>
                {loading ? (
                    <div className={styles.emptyState}>Loading users...</div>
                ) : filteredUsers.length > 0 ? (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Date Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td style={{ fontWeight: 500 }}>{user.full_name || 'N/A'}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <select
                                            value={user.role || 'user'}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className={styles.statusSelect}
                                            disabled={currentUserRole === 'agent'}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                border: '1px solid #e5e7eb',
                                                backgroundColor:
                                                    user.role === 'admin' ? '#dbeafe' :
                                                        user.role === 'super_admin' ? '#fce7f3' :
                                                            user.role === 'agent' ? '#d1fae5' : '#f3f4f6',
                                                color:
                                                    user.role === 'admin' ? '#1e40af' :
                                                        user.role === 'super_admin' ? '#be185d' :
                                                            user.role === 'agent' ? '#065f46' : '#374151',
                                                fontWeight: 500,
                                                cursor: currentUserRole === 'agent' ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            <option value="user">User</option>
                                            <option value="agent">Agent</option>
                                            <option value="admin" disabled={currentUserRole !== 'super_admin'}>Admin</option>
                                            <option value="super_admin" disabled={currentUserRole !== 'super_admin'}>Super Admin</option>
                                        </select>
                                    </td>
                                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            onClick={() => deleteUser(user.id)}
                                            className={styles.actionBtn}
                                            style={{ color: '#ef4444' }}
                                            title="Delete User"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className={styles.emptyState}>No users found matching your search.</div>
                )}
            </div>

            {showModal && (
                <UserModal
                    onClose={() => setShowModal(false)}
                    onComplete={() => { fetchUsers(); }}
                />
            )}
        </div>
    );
}
