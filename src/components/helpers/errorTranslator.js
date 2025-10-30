/**
 * Converte mensagens de erro técnicas do backend em mensagens amigáveis.
 * @param {string} errorMessage A mensagem de erro original (ex: err.message)
 * @returns {string} Uma mensagem limpa e amigável para o usuário.
 */
export const translateErrorMessage = (errorMessage) => {
  if (!errorMessage) return "Ocorreu um erro desconhecido.";

  const message = String(errorMessage);

  // --- Erros de Agendamento (AppointmentService) ---
  if (message.includes("notNull Violation")) {
    return "Erro ao salvar: Todos os campos obrigatórios devem ser preenchidos.";
  }
  if (message.includes("Usuário (paciente) não encontrado")) {
    return "Paciente não encontrado. Verifique o e-mail digitado.";
  }
  if (message.includes("Já existe uma consulta agendada")) {
    return "Este horário já está ocupado por outra consulta.";
  }
  if (message.includes("Consulta fora do horário da agenda")) {
    return "O horário da consulta deve ser dentro do turno disponível do médico.";
  }
  if (message.includes("O horário de início deve ser antes")) {
    return "O horário de início deve ser antes do horário de fim.";
  }

  // --- Erros de Criação de Usuário (Admin/Client Service) ---
  if (message.includes("Nome de usuário já está em uso")) {
    return "Este nome de usuário já está em uso. Por favor, escolha outro.";
  }
  if (message.includes("Este email já está em uso")) {
    return "Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.";
  }
  if (message.includes("Número de celular já está em uso")) {
    return "Este número de celular já está cadastrado.";
  }
  if (message.includes("Telefone inválido")) {
    return "O formato do telefone é inválido (use 11 dígitos, ex: 11987654321).";
  }

  // --- Erros de Senha (Password Validator) ---
  if (message.includes("Deve ter ao menos 1 letra maiúscula")) {
    return "A senha deve conter ao menos 1 letra maiúscula.";
  }
  if (message.includes("Deve ter ao menos 1 Número")) {
    return "A senha deve conter ao menos 1 número.";
  }
  if (message.includes("Deve ter ao menos 1 caractere especial")) {
    return "A senha deve conter ao menos 1 caractere especial (ex: !@#$).";
  }
  if (message.includes("Deve ter no mínimo 8 caracteres")) {
    return "A senha deve ter no mínimo 8 caracteres.";
  }
  
  // --- Erros de Rede ---
  if (message.includes("Failed to fetch")) {
    return "Erro de conexão: Não foi possível conectar ao servidor. (API está online?)";
  }

  // --- Fallbacks (Se não reconhecer, limpa a mensagem) ---
  if (message.startsWith("Erro ao criar consulta: ")) {
    return message.replace("Erro ao criar consulta: ", "");
  }
  if (message.startsWith("Erro ao criar agendamento: ")) {
    return message.replace("Erro ao criar agendamento: ", "");
  }
  if (message.startsWith("Erro:")) {
    return message.replace("Erro:", "");
  }

  // Retorna uma mensagem genérica se nada for pego
  return "Ocorreu um erro inesperado. Por favor, tente novamente.";
};