/**
 * HistoricoPage: tela "Histórico de consultas" (historico.html).
 * Mostra o resumo, filtra por status e por médico, e permite remarcar, cancelar, avaliar e ver detalhes.
 *
 * Para onde esta tela leva:
 *   Avaliar    -> avaliacao.html?consulta=ID
 *   Reagendar  -> agenda.html?medico=ID      (consulta cancelada: marcar uma nova com o mesmo médico)
 */
class HistoricoPage {
  static ROTULO_STATUS = { agendada: 'Agendada', realizada: 'Realizada', cancelada: 'Cancelada' };
  static ROTULO_ACAO = { remarcar: 'Remarcar', avaliar: 'Avaliar', reagendar: 'Reagendar', detalhes: 'Ver detalhes' };

  /* Estado dos filtros */
  static statusAtual = 'todas';
  static textoBusca = '';

  static iniciar() {
    if (!Layout.iniciar('historico')) return;

    document.getElementById('filtros-status').addEventListener('click', (evento) => {
      const chip = evento.target.closest('[data-status]');
      if (chip) HistoricoPage.filtrarPorStatus(chip.dataset.status);
    });
    document.getElementById('busca-medico').addEventListener('input', (evento) => {
      HistoricoPage.buscarPorMedico(evento.target.value);
    });
    document.getElementById('corpo-tabela').addEventListener('click', HistoricoPage._aoClicarNaTabela);

    HistoricoPage.renderizarResumo();
    HistoricoPage._atualizar();
  }

  /** Desenha os 4 cards do topo: total, realizadas, canceladas e agendadas. */
  static renderizarResumo() {
    const r = ConsultaService.resumo();
    const cards = [
      ['Total de consultas', r.total, ''],
      ['Realizadas', r.realizadas, 'ok'],
      ['Canceladas', r.canceladas, 'erro'],
      ['Agendadas', r.agendadas, 'info']
    ];
    document.getElementById('resumo').innerHTML = cards.map(([rotulo, valor, cor]) => `
      <div class="card resumo-card">
        <span class="resumo-rotulo">${rotulo}</span>
        <span class="resumo-valor ${cor}">${valor}</span>
      </div>`).join('');
  }

  /** Aplica o status e o texto da busca juntos e redesenha a tabela. */
  static _atualizar() {
    const normalizar = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const busca = normalizar(HistoricoPage.textoBusca);
    let lista = ConsultaService.filtrarPorStatus(HistoricoPage.statusAtual);
    if (busca) {
      lista = lista.filter((c) => {
        const medico = MedicoService.buscarPorId(c.medicoId);
        return medico && normalizar(medico.nome).includes(busca);
      });
    }
    HistoricoPage.renderizarTabela(lista);
  }

  /** status: 'todas' | 'realizada' | 'cancelada' | 'agendada' */
  static filtrarPorStatus(status) {
    HistoricoPage.statusAtual = status;
    document.querySelectorAll('#filtros-status [data-status]').forEach((chip) => {
      const ativo = chip.dataset.status === status;
      chip.classList.toggle('chip-ativo', ativo);
      chip.setAttribute('aria-pressed', String(ativo));
    });
    HistoricoPage._atualizar();
  }

  static buscarPorMedico(texto) {
    HistoricoPage.textoBusca = texto;
    HistoricoPage._atualizar();
  }

  /** Qual é a ação principal de uma linha: 'remarcar' | 'avaliar' | 'reagendar' | 'detalhes'. */
  static acaoDaLinha(consulta) {
    if (consulta.status === Consulta.STATUS.AGENDADA) return 'remarcar';
    if (consulta.status === Consulta.STATUS.CANCELADA) return 'reagendar';
    return consulta.podeAvaliar() ? 'avaliar' : 'detalhes';
  }

  /** Desenha as linhas da tabela (ou a mensagem de "nenhuma consulta"). */
  static renderizarTabela(lista) {
    const corpo = document.getElementById('corpo-tabela');

    if (lista.length === 0) {
      const semFiltro = HistoricoPage.statusAtual === 'todas' && !HistoricoPage.textoBusca.trim();
      corpo.innerHTML = `<tr><td colspan="6" class="tabela-vazia">${
        semFiltro
          ? 'Você ainda não tem consultas. <a href="medicos.html">Agende sua primeira consulta</a>.'
          : 'Nenhuma consulta encontrada com esses filtros.'
      }</td></tr>`;
      return;
    }

    const esc = Formatadores.escapar;
    corpo.innerHTML = lista.map((c) => {
      const medico = MedicoService.buscarPorId(c.medicoId);
      const avaliacao = c.avaliada ? AvaliacaoService.buscarPorConsulta(c.id) : null;
      const acao = HistoricoPage.acaoDaLinha(c);
      const cancelar = c.podeCancelar()
        ? `<button type="button" class="btn-link perigo" data-acao="cancelar" data-id="${c.id}">Cancelar</button>` : '';
      return `
        <tr>
          <td><div>${Formatadores.data(c.data)}</div><div class="sub">${esc(c.hora)}</div></td>
          <td><button type="button" class="link-medico" data-acao="detalhes" data-id="${c.id}">${esc(medico ? medico.nome : 'Médico removido')}</button></td>
          <td class="texto-suave">${esc(medico ? medico.especialidade : '')}</td>
          <td><span class="badge badge-${esc(c.status)}">${HistoricoPage.ROTULO_STATUS[c.status]}</span></td>
          <td>${avaliacao ? Estrelas.html(avaliacao.notaGeral, 14) : '<span class="texto-suave">—</span>'}</td>
          <td><div class="acoes-linha">
            <button type="button" class="btn-link" data-acao="${acao}" data-id="${c.id}">${HistoricoPage.ROTULO_ACAO[acao]}</button>
            ${cancelar}
          </div></td>
        </tr>`;
    }).join('');
  }

  /** Um único ouvinte de clique para todos os botões da tabela. */
  static _aoClicarNaTabela(evento) {
    const botao = evento.target.closest('[data-acao]');
    if (!botao) return;
    const consulta = ConsultaService.buscarPorId(botao.dataset.id);
    if (!consulta) return;
    switch (botao.dataset.acao) {
      case 'remarcar': HistoricoPage.abrirRemarcar(consulta); break;
      case 'cancelar': HistoricoPage.confirmarCancelamento(consulta); break;
      case 'avaliar': window.location.href = `avaliacao.html?consulta=${consulta.id}`; break;
      case 'reagendar': window.location.href = `agenda.html?medico=${consulta.medicoId}`; break;
      case 'detalhes': HistoricoPage.abrirDetalhes(consulta); break;
    }
  }

  /** Depois de remarcar ou cancelar: atualiza os cards e a tabela. */
  static _recarregar() {
    HistoricoPage.renderizarResumo();
    HistoricoPage._atualizar();
  }

  /** Janela com todos os dados da consulta (e a avaliação, se houver). */
  static abrirDetalhes(consulta) {
    const esc = Formatadores.escapar;
    const medico = MedicoService.buscarPorId(consulta.medicoId);
    const avaliacao = consulta.avaliada ? AvaliacaoService.buscarPorConsulta(consulta.id) : null;

    let html = `
      <dl class="detalhes-lista">
        <dt>Médico</dt><dd>${esc(medico ? medico.nome : '')}</dd>
        <dt>Especialidade</dt><dd>${esc(medico ? medico.especialidade : '')}</dd>
        <dt>Data</dt><dd>${esc(Formatadores.dataLonga(consulta.data))}</dd>
        <dt>Horário</dt><dd>${esc(consulta.hora)}</dd>
        <dt>Modalidade</dt><dd>${esc(consulta.modalidade)}</dd>
        <dt>Valor</dt><dd>${Formatadores.moeda(consulta.valor)}</dd>
        <dt>Status</dt><dd><span class="badge badge-${esc(consulta.status)}">${HistoricoPage.ROTULO_STATUS[consulta.status]}</span></dd>
      </dl>`;
    if (consulta.observacoes) html += `<p><strong>Observações:</strong> ${esc(consulta.observacoes)}</p>`;
    if (avaliacao) {
      html += `
        <div class="detalhes-avaliacao">
          <strong>Sua avaliação</strong>
          ${Estrelas.html(avaliacao.notaGeral, 18)}
          ${avaliacao.comentario ? `<p>${esc(avaliacao.comentario)}</p>` : ''}
          <span class="texto-suave">${avaliacao.recomenda ? 'Você recomenda este médico.' : 'Você não recomenda este médico.'}</span>
        </div>`;
    }

    const botoes = [{ rotulo: 'Fechar', tipo: 'outline' }];
    if (consulta.podeAvaliar()) {
      botoes.push({ rotulo: 'Avaliar', tipo: 'primario', aoClicar: () => { window.location.href = `avaliacao.html?consulta=${consulta.id}`; } });
    }
    Modal.abrir('Detalhes da consulta', html, botoes);
  }

  /** Janela para escolher nova data e horário de uma consulta agendada. */
  static abrirRemarcar(consulta) {
    const esc = Formatadores.escapar;
    const medico = MedicoService.buscarPorId(consulta.medicoId);
    const hoje = Formatadores.paraInputData(Formatadores.deDate(new Date()));

    const janela = Modal.abrir('Remarcar consulta', `
      <p>Consulta com <strong>${esc(medico.nome)}</strong>, hoje marcada para
         <strong>${Formatadores.data(consulta.data)} às ${esc(consulta.hora)}</strong>.</p>
      <div class="remarcar-linha">
        <div class="campo">
          <label for="remarcar-data">Nova data</label>
          <input class="input" type="date" id="remarcar-data" min="${hoje}" value="${Formatadores.paraInputData(consulta.data)}">
        </div>
        <div class="campo">
          <label for="remarcar-hora">Horário</label>
          <select class="input" id="remarcar-hora"></select>
        </div>
      </div>
      <p class="msg-erro" id="remarcar-erro" role="alert" hidden></p>`, [
      { rotulo: 'Voltar', tipo: 'outline' },
      { rotulo: 'Confirmar nova data', tipo: 'primario', aoClicar: (j) => HistoricoPage._confirmarRemarcacao(consulta, j) }
    ]);

    const campoData = janela.querySelector('#remarcar-data');
    const preencher = () => HistoricoPage._preencherHorarios(consulta, janela);
    campoData.addEventListener('change', preencher);
    preencher();
  }

  /** Atualiza a lista de horários livres de acordo com a data escolhida na janela de remarcar. */
  static _preencherHorarios(consulta, janela) {
    const select = janela.querySelector('#remarcar-hora');
    const erro = janela.querySelector('#remarcar-erro');
    const data = Formatadores.deInputData(janela.querySelector('#remarcar-data').value);
    const horarios = data ? MedicoService.horariosLivres(consulta.medicoId, data) : [];

    erro.hidden = true;
    if (horarios.length === 0) {
      select.innerHTML = '<option value="">Sem horários livres</option>';
      select.disabled = true;
      if (data) {
        erro.textContent = 'Não há horários livres nesse dia (fins de semana não têm atendimento). Escolha outra data.';
        erro.hidden = false;
      }
      return;
    }
    select.disabled = false;
    select.innerHTML = horarios.map((h) => `<option value="${Formatadores.escapar(h)}">${Formatadores.escapar(h)}</option>`).join('');
  }

  /** Chamado pelo botão "Confirmar nova data". Devolve false para manter a janela aberta se der erro. */
  static _confirmarRemarcacao(consulta, janela) {
    const data = Formatadores.deInputData(janela.querySelector('#remarcar-data').value);
    const hora = janela.querySelector('#remarcar-hora').value;
    const erro = janela.querySelector('#remarcar-erro');
    try {
      if (!data || !hora) throw new Error('Escolha uma data e um horário livres.');
      ConsultaService.remarcar(consulta.id, data, hora);
    } catch (e) {
      erro.textContent = e.message;
      erro.hidden = false;
      return false;
    }
    Toast.mostrar(`Consulta remarcada para ${Formatadores.data(data)} às ${hora}.`, 'sucesso');
    HistoricoPage._recarregar();
    return true;
  }

  /** Pergunta antes de cancelar uma consulta agendada. */
  static confirmarCancelamento(consulta) {
    const esc = Formatadores.escapar;
    const medico = MedicoService.buscarPorId(consulta.medicoId);
    Modal.abrir('Cancelar consulta?', `
      <p>Você vai cancelar a consulta com <strong>${esc(medico.nome)}</strong> em
         <strong>${Formatadores.data(consulta.data)} às ${esc(consulta.hora)}</strong>.</p>
      <p class="texto-suave">O horário ficará livre para outros pacientes.</p>`, [
      { rotulo: 'Voltar', tipo: 'outline' },
      {
        rotulo: 'Cancelar consulta', tipo: 'perigo',
        aoClicar: () => {
          try {
            ConsultaService.cancelar(consulta.id);
          } catch (e) {
            Toast.mostrar(e.message, 'erro');
            return;
          }
          Toast.mostrar('Consulta cancelada.', 'sucesso');
          HistoricoPage._recarregar();
        }
      }
    ]);
  }
}
