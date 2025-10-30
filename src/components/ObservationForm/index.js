import React, { useState } from 'react';
import styles from './ObservationForm.module.css'; // Crie este arquivo CSS

const ObservationForm = ({ appointment, onSubmit, onClose, isLoading }) => {
    const [diagnostic, setDiagnostic] = useState('');
    const [procedures, setProcedures] = useState('');
    const [recommendations, setRecommendations] = useState('');
    const [examFile, setExamFile] = useState(null);
    const [fileError, setFileError] = useState('');

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setFileError(''); // Limpa erro anterior
        if (file) {
            // Validação simples de tipo/tamanho (opcional, mas recomendado)
            const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                setFileError('Tipo de arquivo inválido. Use JPG, PNG ou PDF.');
                setExamFile(null);
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // Limite de 5MB
                setFileError('Arquivo muito grande. O limite é 5MB.');
                setExamFile(null);
                return;
            }
            setExamFile(file);
        } else {
            setExamFile(null);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const observationData = { diagnostic, procedures, recommendations };
        onSubmit(observationData, examFile);
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Registrar Prontuário</h3>
                    <p>Paciente: <strong>{appointment?.patient?.username || 'N/A'}</strong></p>
                    <p>Data: {new Date(`${appointment?.date}T00:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} ({appointment?.startTime?.slice(0, 5)} - {appointment?.endTime?.slice(0, 5)})</p>
                    <button onClick={onClose} className={styles.modalCloseButton} disabled={isLoading}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <label htmlFor="diagnostic">Diagnóstico:</label>
                    <textarea
                        id="diagnostic"
                        value={diagnostic}
                        onChange={(e) => setDiagnostic(e.target.value)}
                        rows="3"
                        className={styles.textarea}
                    />

                    <label htmlFor="procedures">Procedimentos Realizados:</label>
                    <textarea
                        id="procedures"
                        value={procedures}
                        onChange={(e) => setProcedures(e.target.value)}
                        rows="4"
                        className={styles.textarea}
                    />

                    <label htmlFor="recommendations">Recomendações:</label>
                    <textarea
                        id="recommendations"
                        value={recommendations}
                        onChange={(e) => setRecommendations(e.target.value)}
                        rows="3"
                        className={styles.textarea}
                    />

                    <label htmlFor="examFile">Anexar Exame (Opcional - JPG, PNG, PDF - Máx 5MB):</label>
                    <input
                        id="examFile"
                        type="file"
                        onChange={handleFileChange}
                        accept=".jpg, .jpeg, .png, .pdf"
                        className={styles.inputFile}
                    />
                    {fileError && <p className={styles.error}>{fileError}</p>}
                    {examFile && <p className={styles.fileName}>Arquivo selecionado: {examFile.name}</p>}


                    <div className={styles.modalFooter}>
                        <button type="button" onClick={onClose} className={styles.secondaryButton} disabled={isLoading}>
                            Cancelar
                        </button>
                        <button type="submit" className={styles.button} disabled={isLoading || fileError}>
                            {isLoading ? 'Salvando...' : 'Salvar Prontuário'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ObservationForm;