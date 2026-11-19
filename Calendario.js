/**
 * Calendario
 * ----------------------------------------------------------------------------
 * Toda a lógica de datas do calendário mensal da agenda: navegação entre meses,
 * geração da grade de dias, regras de disponibilidade e formatação.
 *
 * Não manipula o DOM (quem desenha é a AgendaPage) e não acessa Storage/serviços.
 * Padrão do projeto: datas em texto "DD-MM-AAAA" (ex.: "12-11-2026").
 * Meses vão de 0 (janeiro) a 11 (dezembro), igual ao objeto Date.
 */
class Calendario {
  static NOMES_MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  static DIAS_SEMANA_CURTO = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  static DIAS_SEMANA_COMPLETO = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado',
  ];

  #ano;
  #mes;

  /**
   * @param {Date} [dataReferencia=new Date()] Qualquer data do mês a exibir.
   */
  constructor(dataReferencia = new Date()) {
    this.#ano = dataReferencia.getFullYear();
    this.#mes = dataReferencia.getMonth();
  }

  // ---------------------------------------------------------------------------
  // Estado atual
  // ---------------------------------------------------------------------------

  get ano() {
    return this.#ano;
  }

  get mes() {
    return this.#mes;
  }

  /** Texto do cabeçalho. Ex.: "Novembro de 2026". */
  get titulo() {
    return `${Calendario.NOMES_MESES[this.#mes]} de ${this.#ano}`;
  }

  // ---------------------------------------------------------------------------
  // Navegação
  // ---------------------------------------------------------------------------

  irParaMesAnterior() {
    this.#deslocarMeses(-1);
  }

  irParaProximoMes() {
    this.#deslocarMeses(1);
  }

  /**
   * Indica se existe mês anterior navegável (não permite voltar para meses
   * que já terminaram, pois não há o que agendar neles).
   * @param {Date} [hoje=new Date()]
   * @returns {boolean}
   */
  podeVoltar(hoje = new Date()) {
    return (
      this.#ano > hoje.getFullYear() ||
      (this.#ano === hoje.getFullYear() && this.#mes > hoje.getMonth())
    );
  }

  /**
   * NOVO: limita até quantos meses à frente o calendário deixa avançar (antes dava para
   * avançar para sempre; um mês de 2027 não faz sentido numa agenda de consultas).
   * Funciona como o podeVoltar, só que para o outro lado.
   * @param {Date} [hoje=new Date()]
   * @param {number} [limiteMeses=3] Quantos meses à frente do mês atual podem ser vistos.
   * @returns {boolean}
   */
  podeAvancar(hoje = new Date(), limiteMeses = 3) {
    const mesesAdiante = (this.#ano - hoje.getFullYear()) * 12 + (this.#mes - hoje.getMonth());
    return mesesAdiante < limiteMeses;
  }

  // ---------------------------------------------------------------------------
  // Grade do mês
  // ---------------------------------------------------------------------------

  /**
   * Gera a grade do mês para renderização.
   * Posições vazias antes do dia 1 são `null`, para que o primeiro dia caia na
   * coluna correta do dia da semana.
   *
   * @returns {Array<Date|null>}
   */
  gerarGrade() {
    const primeiroDiaSemana = new Date(this.#ano, this.#mes, 1).getDay();
    const totalDias = new Date(this.#ano, this.#mes + 1, 0).getDate();

    const grade = Array(primeiroDiaSemana).fill(null);

    for (let dia = 1; dia <= totalDias; dia++) {
      grade.push(new Date(this.#ano, this.#mes, dia));
    }

    return grade;
  }

  // ---------------------------------------------------------------------------
  // Regras (estáticas: não dependem do mês exibido)
  // ---------------------------------------------------------------------------

  /** @returns {boolean} `true` para sábado e domingo. */
  static ehFimDeSemana(data) {
    const diaSemana = data.getDay();
    return diaSemana === 0 || diaSemana === 6;
  }

  /** @returns {boolean} `true` se as duas datas são o mesmo dia do calendário. */
  static mesmoDia(a, b) {
    return (
      Boolean(a) &&
      Boolean(b) &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  /** @returns {boolean} `true` se o dia é anterior a `hoje` (hoje NÃO é passado). */
  static ehPassado(data, hoje = new Date()) {
    const inicioDeHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    return data < inicioDeHoje;
  }

  /** Um dia só pode ser agendado se não for passado nem fim de semana. */
  static estaDisponivel(data, hoje = new Date()) {
    return !Calendario.ehPassado(data, hoje) && !Calendario.ehFimDeSemana(data);
  }

  /**
   * Primeiro dia disponível a partir de `aPartirDe` (inclusive).
   * @returns {Date}
   */
  static proximoDiaDisponivel(aPartirDe = new Date()) {
    const data = new Date(aPartirDe.getFullYear(), aPartirDe.getMonth(), aPartirDe.getDate());

    while (!Calendario.estaDisponivel(data, aPartirDe)) {
      data.setDate(data.getDate() + 1);
    }

    return data;
  }

  // ---------------------------------------------------------------------------
  // Formatação e leitura de datas
  // ---------------------------------------------------------------------------

  /** Ex.: "12/11". */
  static formatarDiaMes(data) {
    return `${Calendario.#doisDigitos(data.getDate())}/${Calendario.#doisDigitos(data.getMonth() + 1)}`;
  }

  /** Ex.: "12/11/2026". */
  static formatarCompleta(data) {
    return `${Calendario.formatarDiaMes(data)}/${data.getFullYear()}`;
  }

  /** Ex.: "Quinta, 12/11/2026". */
  static formatarComDiaSemana(data) {
    return `${Calendario.DIAS_SEMANA_COMPLETO[data.getDay()]}, ${Calendario.formatarCompleta(data)}`;
  }

  /** Padrão do projeto, usado nos serviços. Ex.: "12-11-2026". */
  static formatarPadrao(data) {
    const dia = Calendario.#doisDigitos(data.getDate());
    const mes = Calendario.#doisDigitos(data.getMonth() + 1);
    return `${dia}-${mes}-${data.getFullYear()}`;
  }

  /**
   * Converte "DD-MM-AAAA" em Date (horário local).
   * @param {string|null|undefined} texto
   * @returns {Date|null} `null` se não for uma data real (ex.: "31-02-2026").
   */
  static lerPadrao(texto) {
    const partes = /^(\d{2})-(\d{2})-(\d{4})$/.exec(texto ?? '');
    return partes ? Calendario.#criarDataValida(Number(partes[3]), Number(partes[2]), Number(partes[1])) : null;
  }

  /**
   * Converte "AAAA-MM-DD" (formato do <input type="date">) em Date.
   * @param {string|null|undefined} texto
   * @returns {Date|null}
   */
  static lerISO(texto) {
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto ?? '');
    return partes ? Calendario.#criarDataValida(Number(partes[1]), Number(partes[2]), Number(partes[3])) : null;
  }

  // ---------------------------------------------------------------------------
  // Internos
  // ---------------------------------------------------------------------------

  #deslocarMeses(quantidade) {
    const nova = new Date(this.#ano, this.#mes + quantidade, 1);
    this.#ano = nova.getFullYear();
    this.#mes = nova.getMonth();
  }

  /** Cria a data e rejeita "transbordos" (31/02 viraria 03/03). */
  static #criarDataValida(ano, mes, dia) {
    const data = new Date(ano, mes - 1, dia);
    const valida =
      data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
    return valida ? data : null;
  }

  static #doisDigitos(numero) {
    return String(numero).padStart(2, '0');
  }
}
