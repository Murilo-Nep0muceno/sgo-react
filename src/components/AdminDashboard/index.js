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

// [V2] NOVO COMPONENTE: Modal de Confirmação
const ConfirmationModal = ({ isOpen, title, onClose, onConfirm }) => {
    const [inputValue, setInputValue] = useState('');
    const canConfirm = inputValue.toLowerCase() === 'confirmar';

    useEffect(() => {
        // Resetar o input quando o modal for aberto
        if (isOpen) {
            setInputValue('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (canConfirm) {
            onConfirm();
            onClose(); // Fecha o modal após a confirmação
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h4>{title}</h4>
                    <button onClick={onClose} className={styles.modalCloseButton}>&times;</button>
                </div>
                <div className={styles.modalBody}>
                    <p>Esta ação não pode ser desfeita. Para continuar, digite <strong>confirmar</strong> abaixo:</p>
                    <input
                        type="text"
                        className={styles.modalInput}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="confirmar"
                    />
                </div>
                <div className={styles.modalFooter}>
                    <button onClick={onClose} className={`${styles.actionButton} ${styles.cancelButton}`}>
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`${styles.actionButton} ${styles.confirmButton}`} // <-- [V2.1] Alterado
                        disabled={!canConfirm}
                    >
                        Confirmar Ação
                    </button>
                </div>
            </div>
        </div>
    );
};


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
        {/* [V2] O feedback agora é exibido aqui na lista */}
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
                                {/* [V2] onDelete agora só *solicita* a confirmação */}
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
    // ... (Este componente não precisa de NENHUMA alteração)
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

// [V2] EditUserForm foi "emburrecido".
// Ele não tem mais estado de feedback ou loading. Ele recebe tudo por props.
const EditUserForm = ({ userToEdit, onUpdate, onCancel, isUpdating, feedback }) => {
    const [formData, setFormData] = useState({ ...userToEdit, password: '' });
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // [V2] O handleSubmit agora só envia os dados para o pai (AdminDashboard)
    // que será responsável por abrir o modal de confirmação.
    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate(formData); // Apenas passa o formData atualizado
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
                    
                    {/* [V2] O botão agora é controlado pelo 'isUpdating' do AdminDashboard */}
                    <button type="submit" className={styles.button} disabled={isUpdating}>
                        {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </form>
                {/* [V2] O feedback agora é controlado pelo 'feedback' do AdminDashboard */}
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
    const [editingUser, setEditingUser] = useState(null); // O *objeto* do usuário sendo editado
    const [searchTerm, setSearchTerm] = useState('');
    const [feedback, setFeedback] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(true);

    // [V2] Estado para o modal de confirmação
    const [confirmationState, setConfirmationState] = useState({
        isOpen: false,
        title: '',
        action: null, // 'delete' ou 'update'
        data: null     // userId (para delete) ou formData (para update)
    });

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

    // [V2] Esta é a nova função que o botão "Deletar" chama
    const requestDeleteConfirmation = (userId) => {
        const userToDelete = users.find(u => u.id === userId);
        setFeedback({ type: '', text: '' }); // Limpa feedback anterior
        setConfirmationState({
            isOpen: true,
            title: `Confirmar Exclusão de ${userToDelete?.username || 'Usuário'}`,
            action: 'delete',
            data: userId
        });
    };

    // [V2] Esta é a nova função que o "Editar" chama ao salvar
    const requestUpdateConfirmation = (formData) => {
        setFeedback({ type: '', text: '' }); // Limpa feedback anterior
        setConfirmationState({
            isOpen: true,
            title: `Confirmar Alteração em ${formData.username}`,
            action: 'update',
            data: formData // Armazena o formData completo
        });
    };

    // [V2] Esta é a função "MASTER" que o modal chama ao confirmar
    const handleConfirmationSuccess = async () => {
        const { action, data } = confirmationState;
        
        // Fecha o modal e ativa o loading global
        setConfirmationState({ isOpen: false, title: '', action: null, data: null });
        setIsLoading(true);
        setFeedback({ type: '', text: '' });

        if (action === 'delete') {
            const userId = data;
            try {
                await deleteUserById(userId, token);
                setFeedback({ type: 'success', text: 'Usuário deletado com sucesso!' });
                setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
            } catch (err) {
                setFeedback({ type: 'error', text: err.message });
            }
        }

        if (action === 'update') {
            const formData = data;
            const userId = formData.id;
            
            const payload = { ...formData };
            if (!payload.password) delete payload.password; // Não envia senha se estiver vazia
            delete payload.role; // Remove role

            try {
                const updatedUserResponse = await updateUserById(userId, payload, token);
                setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, ...updatedUserResponse.user } : u));
                setEditingUser(null); // Retorna para a lista
                setFeedback({ type: 'success', text: 'Usuário atualizado com sucesso!' });
            } catch (err) {
                // [V2] Se der erro, NÃO saia da tela de edição.
                // Apenas exiba o erro no feedback.
                setFeedback({ type: 'error', text: err.message });
            }
        }

        setIsLoading(false); // Desativa o loading global
    };

    const handleUserCreated = () => {
        setFeedback({ type: 'success', text: 'Usuário criado com sucesso!' });
        setActiveView('listUsers');
        fetchUsers();
    };

    // [V2] Função auxiliar para fechar e limpar o modal
    const handleModalClose = () => {
        setConfirmationState({ isOpen: false, title: '', action: null, data: null });
    };

    const renderContent = () => {
        if (editingUser) {
            return (
                <EditUserForm
                    userToEdit={editingUser}
                    onCancel={() => setEditingUser(null)}
                    // [V2] Passa as funções e estados do AdminDashboard
                    onUpdate={requestUpdateConfirmation}
                    isUpdating={isLoading}
                    feedback={feedback}
                />
            );
        }
        
        switch (activeView) {
            case 'createUser': return <CreateUserView onUserCreated={handleUserCreated} />;
            case 'listUsers': default: return (
                <UserManagementView
                    users={filteredUsers}
                    currentUser={user}
                    onEdit={setEditingUser}
                    onDelete={requestDeleteConfirmation} // [V2] Prop atualizada
                    onSearch={setSearchTerm}
                    searchTerm={searchTerm}
                    feedback={feedback}
                    isLoading={isLoading}
                />
            );
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

            {/* [V2] O Modal de Confirmação vive aqui */}
            <ConfirmationModal
                isOpen={confirmationState.isOpen}
                title={confirmationState.title}
                onClose={handleModalClose}
                onConfirm={handleConfirmationSuccess}
            />
        </div>
    );
};

export default AdminDashboard;