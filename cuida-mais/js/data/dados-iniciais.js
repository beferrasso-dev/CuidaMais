/**
 * Dados de partida do sistema (carregados na primeira abertura pelo Storage.iniciar()).
 * Tudo aqui é fictício.
 *
 * Padrões do projeto (todo o grupo deve seguir):
 *   - data    -> texto "DD-MM-AAAA"   (ex.: "12-11-2026")
 *   - hora    -> texto "HH:MM"        (ex.: "14:00")
 *   - status  -> "agendada" | "realizada" | "cancelada"
 */
const HORARIOS_PADRAO = ['08:30', '09:00', '10:30', '14:00', '15:30', '16:00'];

const DadosIniciais = {
  USUARIO_DEMO: { id: 1, nome: 'Maria Souza', email: 'maria@exemplo.com', senha: '123456' },

  MEDICOS_INICIAIS: [
    { id: 1, nome: 'Dra. Ana Beatriz Souza', especialidade: 'Clínica Geral', crm: 'CRM 11234/RS', preco: 200, nota: 4.9, totalAvaliacoes: 214, cor: '#0E7C86', horarios: HORARIOS_PADRAO },
    { id: 2, nome: 'Dr. Carlos Henrique Lima', especialidade: 'Cardiologia', crm: 'CRM 20871/RS', preco: 280, nota: 4.8, totalAvaliacoes: 167, cor: '#2F6FDE', horarios: HORARIOS_PADRAO },
    { id: 3, nome: 'Dra. Mariana Costa', especialidade: 'Dermatologia', crm: 'CRM 15530/RS', preco: 300, nota: 4.7, totalAvaliacoes: 132, cor: '#B5499C', horarios: HORARIOS_PADRAO },
    { id: 4, nome: 'Dr. Rafael Almeida', especialidade: 'Ortopedia', crm: 'CRM 18402/RS', preco: 320, nota: 4.8, totalAvaliacoes: 98, cor: '#D9822B', horarios: HORARIOS_PADRAO },
    { id: 5, nome: 'Dra. Juliana Ferreira', especialidade: 'Pediatria', crm: 'CRM 22916/RS', preco: 250, nota: 5.0, totalAvaliacoes: 251, cor: '#2FA37A', horarios: HORARIOS_PADRAO },
    { id: 6, nome: 'Dr. Paulo Menezes', especialidade: 'Oftalmologia', crm: 'CRM 17745/RS', preco: 260, nota: 4.6, totalAvaliacoes: 76, cor: '#6B5BD6', horarios: HORARIOS_PADRAO }
  ],

  CONSULTAS_INICIAIS: [
    { id: 1, usuarioId: 1, medicoId: 2, data: '12-11-2026', hora: '14:00', modalidade: 'Presencial', observacoes: '', valor: 280, status: 'agendada', avaliada: false },
    { id: 2, usuarioId: 1, medicoId: 2, data: '05-10-2026', hora: '14:00', modalidade: 'Presencial', observacoes: '', valor: 280, status: 'realizada', avaliada: false },
    { id: 3, usuarioId: 1, medicoId: 3, data: '22-09-2026', hora: '10:30', modalidade: 'Presencial', observacoes: '', valor: 300, status: 'realizada', avaliada: true },
    { id: 4, usuarioId: 1, medicoId: 4, data: '10-09-2026', hora: '09:00', modalidade: 'Presencial', observacoes: '', valor: 320, status: 'cancelada', avaliada: false },
    { id: 5, usuarioId: 1, medicoId: 1, data: '18-08-2026', hora: '15:30', modalidade: 'Telemedicina', observacoes: '', valor: 200, status: 'realizada', avaliada: true },
    { id: 6, usuarioId: 1, medicoId: 6, data: '02-07-2026', hora: '08:30', modalidade: 'Presencial', observacoes: '', valor: 260, status: 'realizada', avaliada: true }
  ],

  AVALIACOES_INICIAIS: [
    { id: 1, consultaId: 3, medicoId: 3, notaGeral: 5, criterios: { atendimento: 5, pontualidade: 5, estrutura: 5 }, comentario: 'Atendimento excelente.', recomenda: true, criadaEm: '2026-09-22T12:00:00' },
    { id: 2, consultaId: 5, medicoId: 1, notaGeral: 4, criterios: { atendimento: 5, pontualidade: 4, estrutura: 4 }, comentario: '', recomenda: true, criadaEm: '2026-08-18T17:00:00' },
    { id: 3, consultaId: 6, medicoId: 6, notaGeral: 5, criterios: { atendimento: 5, pontualidade: 5, estrutura: 5 }, comentario: 'Muito atencioso.', recomenda: true, criadaEm: '2026-07-02T10:00:00' }
  ]
};
