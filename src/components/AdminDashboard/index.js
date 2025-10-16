// src/components/AdminDashboard/index.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { updateUserById, getAllUsers, deleteUserById, createAdmin, createSecretary, createDoctor } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';
import CreateUserForm from '../CreateUserForm';
import styles from './AdminDashboard.module.css';

// ========================================================================
// 1. COMPONENTES DE UI REUTILIZÁVEIS
// ========================================================================

const FeedbackMessage = ({ type, message }) => {
    if (!message) return null;
    return <p className={styles[type]}>{message}</p>;
};

const PageHeader = ({ title, children }) => (
    <div className={styles.pageHeader}>
        <h3>{title}</h3>
        <div>{children}</div>
    </div>
);

// ========================================================================
// 2. COMPONENTES DE VISUALIZAÇÃO PRINCIPAIS
// ========================================================================

const UserManagementView = ({ users, currentUser, onEdit, onDelete, onSearch, searchTerm, feedback, isLoading }) => (
    <div>
        <PageHeader title="Gerenciamento de Usuários">
            <div className={styles.filterContainer}>
                <input type="text" placeholder="Buscar por nome, email ou função..." className={styles.searchInput} value={searchTerm} onChange={(e) => onSearch(e.target.value)} />
            </div>
        </PageHeader>
        <FeedbackMessage type={feedback.type} message={feedback.text} />
        {isLoading && users.length === 0 && <p>Carregando usuários...</p>}
        <div className={styles.tableContainer}>
            <table className={styles.userTable}>
                <thead>
                    <tr>
                        <th>Usuário</th><th>Função</th><th>Email</th><th>CRO</th><th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u.id} className={isLoading ? styles.disabledRow : ''}>
                            <td data-label="Usuário">{u.username}</td>
                            <td data-label="Função">{u.role}</td>
                            <td data-label="Email">{u.email || 'N/A'}</td>
                            <td data-label="CRO">{u.cro || 'N/A'}</td>
                            <td data-label="Ações" className={styles.actionsCell}>
                                <button className={`${styles.actionButton} ${styles.editButton}`} onClick={() => onEdit(u)} disabled={u.id === currentUser.id || isLoading}>Editar</button>
                                <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={() => onDelete(u.id)} disabled={u.id === currentUser.id || isLoading}>Deletar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const CreateUserView = ({ onUserCreated }) => {
    const [userType, setUserType] = useState('secretary');
    const forms = {
        admin: { Component: CreateUserForm, props: { userType: "Administrador", apiService: createAdmin, requiredFields: ['username', 'password'] } },
        secretary: { Component: CreateUserForm, props: { userType: "Secretária", apiService: createSecretary, requiredFields: ['username', 'password', 'email'] } },
        doctor: { Component: CreateUserForm, props: { userType: "Dentista", apiService: createDoctor, requiredFields: ['username', 'password', 'cro'] } }
    };
    const ActiveForm = forms[userType].Component;
    return (
        <div>
            <PageHeader title="Criar Novo Usuário" />
            <div className={styles.tabsContainer}>
                <button onClick={() => setUserType('secretary')} className={userType === 'secretary' ? styles.activeTab : ''}>Secretária</button>
                <button onClick={() => setUserType('doctor')} className={userType === 'doctor' ? styles.activeTab : ''}>Dentista</button>
                <button onClick={() => setUserType('admin')} className={userType === 'admin' ? styles.activeTab : ''}>Admin</button>
            </div>
            <div className={styles.formWrapper}><ActiveForm key={userType} {...forms[userType].props} onUserCreated={onUserCreated} /></div>
        </div>
    );
};

const EditUserForm = ({ userToEdit, onUpdate, onCancel }) => {
    const [formData, setFormData] = useState({ ...userToEdit, password: '' });
    const [feedback, setFeedback] = useState({ type: '', text: '' });
    const [isUpdating, setIsUpdating] = useState(false);
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback({ type: '', text: '' });
        setIsUpdating(true);
        try {
            await onUpdate(userToEdit.id, formData);
            setFeedback({ type: 'success', text: 'Usuário atualizado com sucesso!' });
        } catch (err) {
            setFeedback({ type: 'error', text: err.message });
        } finally {
            setIsUpdating(false);
        }
    };
    return (
        <div>
            <button onClick={onCancel} className={styles.backButton}>&larr; Voltar para a lista</button>
            <PageHeader title={`Editando: ${userToEdit.username}`} />
            <div className={styles.formWrapper}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <label>Nome de Usuário</label>
                    <input name="username" value={formData.username} onChange={handleChange} required />
                    {(formData.role === 'secretary' || formData.role === 'Client') && <><label>Email</label><input name="email" type="email" value={formData.email || ''} onChange={handleChange} /></>}
                    {formData.role === 'doctor' && <><label>CRO</label><input name="cro" value={formData.cro || ''} onChange={handleChange} required /></>}
                    <label>Nova Senha (deixe em branco para não alterar)</label>
                    <input name="password" type="password" placeholder="Mínimo 8 caracteres" onChange={handleChange} />
                    <button type="submit" className={styles.button} disabled={isUpdating}>{isUpdating ? 'Salvando...' : 'Salvar Alterações'}</button>
                </form>
                <FeedbackMessage type={feedback.type} message={feedback.text} />
            </div>
        </div>
    );
};

// ========================================================================
// 3. COMPONENTE PRINCIPAL (ORQUESTRADOR)
// ========================================================================
const AdminDashboard = () => {
    const { user, token } = useAuth();
    const [activeView, setActiveView] = useState('listUsers');
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [feedback, setFeedback] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true); setFeedback({ type: '', text: '' });
        try {
            const data = await getAllUsers(token);
            setUsers(data || []);
        } catch (err) {
            setFeedback({ type: 'error', text: 'Falha ao carregar usuários.' });
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        const lowercasedFilter = searchTerm.toLowerCase();
        return users.filter(u => u.username.toLowerCase().includes(lowercasedFilter) || (u.email && u.email.toLowerCase().includes(lowercasedFilter)) || u.role.toLowerCase().includes(lowercasedFilter));
    }, [users, searchTerm]);

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Tem certeza que deseja DELETAR este usuário?')) {
            setIsLoading(true);
            try {
                await deleteUserById(userId, token);
                setFeedback({ type: 'success', text: 'Usuário deletado com sucesso!' });
                setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
            } catch (err) {
                setFeedback({ type: 'error', text: err.message });
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleUpdateUser = async (userId, updatedUserData) => {
        const payload = { ...updatedUserData };
        if (!payload.password) delete payload.password; // Não envia senha se estiver vazia
        delete payload.role; // O backend já impede, mas é uma boa prática remover aqui também

        setIsLoading(true);
        try {
            const updatedUserResponse = await updateUserById(userId, payload, token);
            setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, ...updatedUserResponse.user } : u));
            setEditingUser(null);
            setFeedback({ type: 'success', text: 'Usuário atualizado com sucesso!' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserCreated = () => {
        setFeedback({ type: 'success', text: 'Usuário criado com sucesso!' });
        setActiveView('listUsers');
        fetchUsers();
    };

    const renderContent = () => {
        if (editingUser) return <EditUserForm userToEdit={editingUser} onUpdate={handleUpdateUser} onCancel={() => setEditingUser(null)} />;
        switch (activeView) {
            case 'createUser': return <CreateUserView onUserCreated={handleUserCreated} />;
            case 'listUsers': default: return <UserManagementView users={filteredUsers} currentUser={user} onEdit={setEditingUser} onDelete={handleDeleteUser} onSearch={setSearchTerm} searchTerm={searchTerm} feedback={feedback} isLoading={isLoading} />;
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <aside className={styles.sideMenu}>
                <div className={styles.welcomeMessage}><p>Painel do</p><strong>Administrador</strong></div>
                <nav className={styles.nav}>
                    <button className={`${styles.menuButton} ${activeView === 'listUsers' && !editingUser ? styles.active : ''}`} onClick={() => { setActiveView('listUsers'); setEditingUser(null); setFeedback({type:'', text:''}); }}>Gerenciar Usuários</button>
                    <button className={`${styles.menuButton} ${activeView === 'createUser' ? styles.active : ''}`} onClick={() => { setActiveView('createUser'); setEditingUser(null); setFeedback({type:'', text:''}); }}>+ Criar Usuário</button>
                </nav>
            </aside>
            <main className={styles.contentArea}>
                {renderContent()}
            </main>
        </div>
    );
};

export default AdminDashboard;