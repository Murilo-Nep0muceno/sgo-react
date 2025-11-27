import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { updateUserById, getAllUsers, deleteUserById, createAdmin, createSecretary, createDoctor, getDashboardStats } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';
import CreateUserForm from '../CreateUserForm';
import styles from './AdminDashboard.module.css';

const FeedbackMessage = ({ type, message }) => {
  if (!message) return null;
  const role = type === 'error' ? 'alert' : 'status';
  return <p className={styles[type]} role={role}>{message}</p>;
};

const PageHeader = ({ title, children }) => (
  <div className={styles.pageHeader}>
    <h2 id="page-title">{title}</h2>
    <div>{children}</div>
  </div>
);

const ReportsView = ({ token }) => {
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const data = await getDashboardStats(token);
        setStats(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Não foi possível carregar os dados do relatório.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  const chartData = useMemo(() => {
    if (!stats.length) return [];

    if (viewMode === 'yearly') {
      const years = {};
      stats.forEach(app => {
        if (!app.date) return;
        const year = app.date.substring(0, 4);
        years[year] = (years[year] || 0) + 1;
      });
      return Object.entries(years)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => a.label.localeCompare(b.label));
    } else {
      const months = Array(12).fill(0);
      stats.forEach(app => {
        if (!app.date) return;
        const [year, month] = app.date.split('-');
        if (parseInt(year) === selectedYear) {
          months[parseInt(month) - 1]++;
        }
      });
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return months.map((value, index) => ({ label: monthNames[index], value }));
    }
  }, [stats, viewMode, selectedYear]);

  const maxVal = Math.max(...chartData.map(d => d.value), 1);

  if (isLoading) return <p>Carregando estatísticas...</p>;
  if (error) return <FeedbackMessage type="error" message={error} />;

  return (
    <div>
      <PageHeader title="Relatório de Volume de Agendamentos" />
      
      <div className={styles.chartControls}>
        <div className={styles.tabsContainer}>
          <button 
            className={`${viewMode === 'monthly' ? styles.activeTab : ''}`} 
            onClick={() => setViewMode('monthly')}
          >
            Visualização Mensal
          </button>
          <button 
            className={`${viewMode === 'yearly' ? styles.activeTab : ''}`} 
            onClick={() => setViewMode('yearly')}
          >
            Visualização Anual
          </button>
        </div>

        {viewMode === 'monthly' && (
          <div className={styles.yearSelector}>
            <label htmlFor="year-select">Ano de Referência: </label>
            <select 
              id="year-select" 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className={styles.modalInput}
              style={{width: 'auto', display: 'inline-block', marginLeft: '10px'}}
            >
              {Array.from(new Set(stats.map(s => s.date ? parseInt(s.date.substring(0, 4)) : new Date().getFullYear()))).sort().map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className={styles.chartContainer}>
        <div className={styles.barChart}>
          {chartData.map((item, index) => (
            <div key={index} className={styles.barGroup}>
              <div 
                className={styles.bar} 
                style={{ height: `${(item.value / maxVal) * 100}%` }}
                title={`${item.label}: ${item.value} agendamentos`}
              >
                {item.value > 0 && <span className={styles.barValue}>{item.value}</span>}
              </div>
              <span className={styles.barLabel}>{item.label}</span>
            </div>
          ))}
        </div>
        {chartData.length === 0 && <p style={{textAlign: 'center', marginTop: '20px'}}>Nenhum dado para exibir.</p>}
      </div>
      
      <div className={styles.statsSummary}>
        <p>Total de agendamentos no período: <strong>{chartData.reduce((a, b) => a + b.value, 0)}</strong></p>
      </div>
    </div>
  );
};

const ConfirmationModal = ({ isOpen, title, onClose, onConfirm }) => {
  const [inputValue, setInputValue] = useState('');
  const canConfirm = inputValue.toLowerCase() === 'confirmar';

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className={styles.modalHeader}>
          <h3 id="modal-title">{title}</h3>
          <button onClick={onClose} className={styles.modalCloseButton} aria-label="Fechar modal">×</button>
        </div>
        <div className={styles.modalBody}>
          <label htmlFor="confirm-input" id="confirm-label">
            Esta ação não pode ser desfeita. Para continuar, digite <strong>confirmar</strong> abaixo:
          </label>
          <input
            id="confirm-input"
            type="text"
            className={styles.modalInput}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="confirmar"
            autoFocus
            aria-labelledby="confirm-label"
          />
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={`${styles.actionButton} ${styles.cancelButton}`}>
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className={`${styles.actionButton} ${styles.confirmButton}`}
            disabled={!canConfirm}
          >
            Confirmar Ação
          </button>
        </div>
      </div>
    </div>
  );
};

const UserManagementView = ({ users, currentUser, onEdit, onDelete, onSearch, searchTerm, feedback, isLoading }) => (
  <div>
    <PageHeader title="Gerenciamento de Usuários">
      <div className={styles.filterContainer}>
        <input
          type="text"
          placeholder="Buscar por nome, email ou função..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          aria-label="Buscar por nome, email ou função"
        />
      </div>
    </PageHeader>
    <FeedbackMessage type={feedback.type} message={feedback.text} />
    {isLoading && users.length === 0 && <p>Carregando usuários...</p>}
    <div className={styles.tableContainer}>
      <table className={styles.userTable} role="table">
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
                <button
                  className={`${styles.actionButton} ${styles.editButton}`}
                  onClick={() => onEdit(u)}
                  disabled={u.id === currentUser.id || isLoading}
                  aria-label={`Editar usuário ${u.username}`}
                >
                  Editar
                </button>
                <button
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  onClick={() => onDelete(u.id)}
                  disabled={u.id === currentUser.id || isLoading}
                  aria-label={`Deletar usuário ${u.username}`}
                >
                  Deletar
                </button>
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
      <div className={styles.tabsContainer} role="tablist">
        <button role="tab" aria-selected={userType === 'secretary'} onClick={() => setUserType('secretary')} className={userType === 'secretary' ? styles.activeTab : ''}>Secretária</button>
        <button role="tab" aria-selected={userType === 'doctor'} onClick={() => setUserType('doctor')} className={userType === 'doctor' ? styles.activeTab : ''}>Dentista</button>
        <button role="tab" aria-selected={userType === 'admin'} onClick={() => setUserType('admin')} className={userType === 'admin' ? styles.activeTab : ''}>Admin</button>
      </div>
      <div className={styles.formWrapper}><ActiveForm key={userType} {...forms[userType].props} onUserCreated={onUserCreated} /></div>
    </div>
  );
};

const EditUserForm = ({ userToEdit, onUpdate, onCancel, isUpdating, feedback }) => {
  const [formData, setFormData] = useState({ ...userToEdit, password: '' });
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div>
      <button onClick={onCancel} className={styles.backButton}>← Voltar para a lista</button>
      <PageHeader title={`Editando: ${userToEdit.username}`} />
      <div className={styles.formWrapper}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="edit-username">Nome de Usuário</label>
          <input id="edit-username" name="username" value={formData.username} onChange={handleChange} required />
          
          {(formData.role === 'secretary' || formData.role === 'Client') && (
            <>
              <label htmlFor="edit-email">Email</label>
              <input id="edit-email" name="email" type="email" value={formData.email || ''} onChange={handleChange} />
            </>
          )}
          {formData.role === 'doctor' && (
            <>
              <label htmlFor="edit-cro">CRO</label>
              <input id="edit-cro" name="cro" value={formData.cro || ''} onChange={handleChange} required />
            </>
          )}
          
          <label htmlFor="edit-password">Nova Senha (deixe em branco para não alterar)</label>
          <input id="edit-password" name="password" type="password" placeholder="Mínimo 8 caracteres" onChange={handleChange} />
          
          <button type="submit" className={styles.button} disabled={isUpdating}>
            {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
        <FeedbackMessage type={feedback.type} message={feedback.text} />
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [activeView, setActiveView] = useState('listUsers');
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(true);

  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    title: '',
    action: null,
    data: null
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

  useEffect(() => { 
    if (activeView === 'listUsers') fetchUsers(); 
  }, [fetchUsers, activeView]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const lowercasedFilter = searchTerm.toLowerCase();
    return users.filter(u => u.username.toLowerCase().includes(lowercasedFilter) || (u.email && u.email.toLowerCase().includes(lowercasedFilter)) || u.role.toLowerCase().includes(lowercasedFilter));
  }, [users, searchTerm]);

  const requestDeleteConfirmation = (userId) => {
    const userToDelete = users.find(u => u.id === userId);
    setFeedback({ type: '', text: '' });
    setConfirmationState({
      isOpen: true,
      title: `Confirmar Exclusão de ${userToDelete?.username || 'Usuário'}`,
      action: 'delete',
      data: userId
    });
  };

  const requestUpdateConfirmation = (formData) => {
    setFeedback({ type: '', text: '' });
    setConfirmationState({
      isOpen: true,
      title: `Confirmar Alteração em ${formData.username}`,
      action: 'update',
      data: formData
    });
  };

  const handleConfirmationSuccess = async () => {
    const { action, data } = confirmationState;
    
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
      if (!payload.password) delete payload.password;
      delete payload.role;

      try {
        const updatedUserResponse = await updateUserById(userId, payload, token);
        setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, ...updatedUserResponse.user } : u));
        setEditingUser(null);
        setFeedback({ type: 'success', text: 'Usuário atualizado com sucesso!' });
      } catch (err) {
        setFeedback({ type: 'error', text: err.message });
      }
    }

    setIsLoading(false);
  };

  const handleUserCreated = () => {
    setFeedback({ type: 'success', text: 'Usuário criado com sucesso!' });
    setActiveView('listUsers');
    fetchUsers();
  };

  const handleModalClose = () => {
    setConfirmationState({ isOpen: false, title: '', action: null, data: null });
  };

  const renderContent = () => {
    if (editingUser) {
      return (
        <EditUserForm
          userToEdit={editingUser}
          onCancel={() => setEditingUser(null)}
          onUpdate={requestUpdateConfirmation}
          isUpdating={isLoading}
          feedback={feedback}
        />
      );
    }
    
    switch (activeView) {
      case 'createUser': return <CreateUserView onUserCreated={handleUserCreated} />;
      case 'reports': return <ReportsView token={token} />;
      case 'listUsers': default: return (
        <UserManagementView
          users={filteredUsers}
          currentUser={user}
          onEdit={setEditingUser}
          onDelete={requestDeleteConfirmation}
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
        <nav className={styles.nav} aria-label="Menu principal do administrador">
          <button className={`${styles.menuButton} ${activeView === 'listUsers' && !editingUser ? styles.active : ''}`} onClick={() => { setActiveView('listUsers'); setEditingUser(null); setFeedback({type:'', text:''}); }}>Gerenciar Usuários</button>
          <button className={`${styles.menuButton} ${activeView === 'createUser' ? styles.active : ''}`} onClick={() => { setActiveView('createUser'); setEditingUser(null); setFeedback({type:'', text:''}); }}>+ Criar Usuário</button>
          <button className={`${styles.menuButton} ${activeView === 'reports' ? styles.active : ''}`} onClick={() => { setActiveView('reports'); setEditingUser(null); setFeedback({type:'', text:''}); }}>Relatórios</button>
        </nav>
      </aside>
      <main className={styles.contentArea} aria-labelledby="page-title">
        {renderContent()}
      </main>

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