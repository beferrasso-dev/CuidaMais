/**
 * MedicosPage: tela "Agendar consulta" (medicos.html).
 * Lista os médicos, filtra por especialidade / data / nome e leva para agenda.html.
 *
 * Ao clicar em "Agendar consulta" (ou em um horário), vai para:
 *   agenda.html?medico=ID                      (sem data escolhida)
 *   agenda.html?medico=ID&data=12-11-2026&hora=14:00   (data no formato DD-MM-AAAA)
 */
class MedicosPage {
  /** Quantos dias à frente procurar o "próximo dia com horário" quando não há data no filtro. */
  static DIAS_DE_BUSCA = 30;

  static iniciar() {
    if (!Layout.iniciar('medicos')) return;
    MedicosPage.carregarFiltros();
    MedicosPage.aplicarFiltros();
  }

  /** Preenche a lista de especialidades, limita a data a hoje em diante e liga os eventos. */
  static carregarFiltros() {
    const select = document.getElementById('filtro-especialidade');
    MedicoService.listarEspecialidades().forEach((nome) => {
      const opcao = document.createElement('option');
      opcao.value = nome;
      opcao.textContent = nome;
      select.appendChild(opcao);
    });

    document.getElementById('filtro-data').min = Formatadores.paraInputData(Formatadores.deDate(new Date()));

    document.getElementById('form-filtros').addEventListener('submit', (evento) => {
      evento.preventDefault();
      MedicosPage.aplicarFiltros();
    });
    select.addEventListener('change', MedicosPage.aplicarFiltros);
    document.getElementById('filtro-data').addEventListener('change', MedicosPage.aplicarFiltros);
    document.getElementById('filtro-nome').addEventListener('input', MedicosPage.aplicarFiltros);
    document.getElementById('btn-limpar').addEventListener('click', MedicosPage._limparFiltros);
  }

  /** Lê os campos e devolve { especialidade, nome, data } (data em DD-MM-AAAA ou vazia). */
  static _lerFiltros() {
    return {
      especialidade: document.getElementById('filtro-especialidade').value,
      nome: document.getElementById('filtro-nome').value,
      data: Formatadores.deInputData(document.getElementById('filtro-data').value)
    };
  }

  static _limparFiltros() {
    document.getElementById('filtro-especialidade').value = '';
    document.getElementById('filtro-data').value = '';
    document.getElementById('filtro-nome').value = '';
    MedicosPage.aplicarFiltros();
  }

  static aplicarFiltros() {
    const filtros = MedicosPage._lerFiltros();
    MedicosPage.renderizarCards(MedicoService.filtrar(filtros), filtros);
  }

  /** Desenha os cards (ou a mensagem de "nenhum médico") e atualiza o contador. */
  static renderizarCards(lista, filtros = MedicosPage._lerFiltros()) {
    const area = document.getElementById('lista-medicos');
    area.innerHTML = '';

    const contador = document.getElementById('contador');
    contador.textContent = lista.length === 1 ? '1 médico disponível' : `${lista.length} médicos disponíveis`;

    if (lista.length === 0) {
      area.appendChild(MedicosPage._criarVazio(filtros));
      return;
    }
    lista.forEach((medico) => area.appendChild(MedicosPage.criarCard(medico, filtros.data)));
  }

  /**
   * Mostra os horários livres do médico:
   *  - com data escolhida no filtro: os desse dia;
   *  - sem data: os do primeiro dia (a partir de hoje) que tenha horário.
   * Devolve { data, horarios } (horarios vazio se não achou nada).
   */
  static _proximosHorarios(medico, dataFiltro) {
    if (dataFiltro) return { data: dataFiltro, horarios: MedicoService.horariosLivres(medico.id, dataFiltro) };
    const dia = new Date();
    for (let i = 0; i < MedicosPage.DIAS_DE_BUSCA; i++) {
      const data = Formatadores.deDate(dia);
      const horarios = MedicoService.horariosLivres(medico.id, data);
      if (horarios.length > 0) return { data, horarios };
      dia.setDate(dia.getDate() + 1);
    }
    return { data: '', horarios: [] };
  }

  /** "12-11-2026" -> "Qui, 12/11" */
  static _rotuloDia(data) {
    const dia = Formatadores.DIAS_SEMANA[Formatadores.paraDate(data).getDay()].slice(0, 3);
    const [d, m] = data.split('-');
    return `${dia}, ${d}/${m}`;
  }

  /** Monta o card de um médico e devolve o elemento. */
  static criarCard(medico, dataFiltro = '') {
    const { data, horarios } = MedicosPage._proximosHorarios(medico, dataFiltro);
    const nota = medico.nota.toFixed(1).replace('.', ',');

    const card = document.createElement('article');
    card.className = 'card medico-card';
    card.innerHTML = `
      <div class="medico-topo">
        <span class="avatar avatar-grande" style="background:${Formatadores.escapar(medico.cor)}" aria-hidden="true">${Formatadores.escapar(medico.iniciais())}</span>
        <div>
          <h3>${Formatadores.escapar(medico.nome)}</h3>
          <p class="texto-suave">${Formatadores.escapar(medico.especialidade)}</p>
        </div>
      </div>
      <div class="medico-nota">
        ${Estrelas.html(medico.nota, 14)}
        <span>${nota} (${medico.totalAvaliacoes} avaliações)</span>
      </div>
      <p class="medico-rotulo">${data ? `Próximos horários disponíveis · ${MedicosPage._rotuloDia(data)}` : 'Próximos horários disponíveis'}</p>
      <div class="medico-horarios"></div>
      <button type="button" class="btn btn-primario btn-bloco">Agendar consulta</button>`;

    const areaHorarios = card.querySelector('.medico-horarios');
    if (horarios.length === 0) {
      areaHorarios.innerHTML = '<span class="medico-sem-horario">Sem horários livres neste período.</span>';
    } else {
      horarios.slice(0, 4).forEach((hora) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.textContent = hora;
        chip.setAttribute('aria-label', `Agendar com ${medico.nome} às ${hora}`);
        chip.addEventListener('click', () => MedicosPage.aoClicarAgendar(medico.id, data, hora));
        areaHorarios.appendChild(chip);
      });
    }

    card.querySelector('.btn').addEventListener('click', () => MedicosPage.aoClicarAgendar(medico.id, dataFiltro));
    return card;
  }

  /** Vai para a tela de agenda levando médico (e, se houver, data e hora) na URL. */
  static aoClicarAgendar(medicoId, data = '', hora = '') {
    const params = new URLSearchParams({ medico: medicoId });
    if (data) params.set('data', data);
    if (hora) params.set('hora', hora);
    window.location.href = `agenda.html?${params.toString()}`;
  }

  /** Mensagem mostrada quando nenhum médico atende aos filtros. */
  static _criarVazio(filtros) {
    const caixa = document.createElement('div');
    caixa.className = 'card vazio';
    const fimDeSemana = filtros.data && Formatadores.dataValida(filtros.data) && [0, 6].includes(Formatadores.paraDate(filtros.data).getDay());
    const texto = fimDeSemana
      ? 'Não há atendimento aos fins de semana. Escolha um dia útil.'
      : 'Tente outra especialidade, outra data ou limpe os filtros.';
    caixa.innerHTML = `<h2>Nenhum médico encontrado</h2><p>${texto}</p><button type="button" class="btn btn-outline">Limpar filtros</button>`;
    caixa.querySelector('button').addEventListener('click', MedicosPage._limparFiltros);
    return caixa;
  }
}
