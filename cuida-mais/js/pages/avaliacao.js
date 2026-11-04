/**
 * AvaliacaoPage: tela "Avaliar consulta" (avaliacao.html).
 *
 * Quem abre esta tela:
 *   avaliacao.html?consulta=ID   -> avalia a consulta indicada (vem do link "Avaliar" do Histórico)
 *   avaliacao.html               -> pega a primeira consulta realizada e ainda não avaliada
 *
 * Depois de enviar (ou pular), volta para historico.html.
 */
class AvaliacaoPage {
  static ROTULOS_NOTA = ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente'];
  static CRITERIOS = ['atendimento', 'pontualidade', 'estrutura'];

  /* Estado da página */
  static consulta = null;
  static notaGeral = 0;
  static criterios = { atendimento: 0, pontualidade: 0, estrutura: 0 };
  static recomenda = true;
  static estrelasGeral = null;
  static estrelasCriterios = {};

  static iniciar() {
    if (!Layout.iniciar('avaliacao')) return;
    if (!AvaliacaoPage.carregarConsulta()) return;
    AvaliacaoPage.montarEstrelas();

    document.getElementById('form-avaliacao').addEventListener('submit', AvaliacaoPage.enviar);
    document.getElementById('btn-pular').addEventListener('click', AvaliacaoPage.pular);
    document.querySelectorAll('[data-recomenda]').forEach((botao) => {
      botao.addEventListener('click', () => AvaliacaoPage._escolherRecomendacao(botao.dataset.recomenda === 'sim'));
    });
  }

  /**
   * Descobre qual consulta será avaliada e desenha o resumo dela.
   * Devolve false (e mostra uma mensagem) se não há consulta que possa ser avaliada.
   */
  static carregarConsulta() {
    const usuario = AuthService.usuarioLogado();
    const id = new URLSearchParams(window.location.search).get('consulta');
    let consulta = null;

    if (id) {
      consulta = ConsultaService.buscarPorId(id);
      if (!consulta || consulta.usuarioId !== usuario.id) {
        AvaliacaoPage._mostrarVazio('Consulta não encontrada', 'Não achamos essa consulta. Volte ao histórico e escolha outra.');
        return false;
      }
    } else {
      consulta = ConsultaService.listarDoUsuario().find((c) => c.podeAvaliar()) || null;
      if (!consulta) {
        AvaliacaoPage._mostrarVazio('Nenhuma consulta para avaliar', 'Quando você tiver uma consulta realizada, ela aparece aqui.');
        return false;
      }
    }

    if (consulta.status !== Consulta.STATUS.REALIZADA) {
      AvaliacaoPage._mostrarVazio('Esta consulta ainda não pode ser avaliada', 'Só é possível avaliar consultas que já foram realizadas.');
      return false;
    }
    if (AvaliacaoService.jaAvaliada(consulta.id)) {
      AvaliacaoPage._mostrarVazio('Você já avaliou esta consulta', 'Obrigado pela sua opinião!');
      return false;
    }

    AvaliacaoPage.consulta = consulta;
    const medico = MedicoService.buscarPorId(consulta.medicoId);
    document.getElementById('consulta-resumo').innerHTML = `
      <span class="avatar" style="background:${Formatadores.escapar(medico.cor)}" aria-hidden="true">${Formatadores.escapar(medico.iniciais())}</span>
      <div>
        <h3>${Formatadores.escapar(medico.nome)}</h3>
        <p>${Formatadores.escapar(medico.especialidade)} · ${Formatadores.data(consulta.data)} às ${Formatadores.escapar(consulta.hora)}</p>
      </div>`;
    document.getElementById('cartao-avaliacao').hidden = false;
    return true;
  }

  static _mostrarVazio(titulo, texto) {
    document.getElementById('titulo-vazio').textContent = titulo;
    document.getElementById('texto-vazio').textContent = texto;
    document.getElementById('estado-vazio').hidden = false;
  }

  /** Cria as estrelas clicáveis: uma para a nota geral e uma para cada critério. */
  static montarEstrelas() {
    AvaliacaoPage.estrelasGeral = new EstrelasInput(document.getElementById('estrelas-geral'), 0, (nota) => {
      AvaliacaoPage.notaGeral = nota;
      document.getElementById('texto-nota').textContent = AvaliacaoPage.ROTULOS_NOTA[nota];
      document.getElementById('erro-nota').hidden = true;
    }, 40);

    AvaliacaoPage.CRITERIOS.forEach((criterio) => {
      AvaliacaoPage.estrelasCriterios[criterio] = new EstrelasInput(document.getElementById(`estrelas-${criterio}`), 0, (nota) => {
        AvaliacaoPage.criterios[criterio] = nota;
      }, 22);
    });
  }

  static _escolherRecomendacao(sim) {
    AvaliacaoPage.recomenda = sim;
    document.querySelectorAll('[data-recomenda]').forEach((botao) => {
      const ativo = (botao.dataset.recomenda === 'sim') === sim;
      botao.classList.toggle('chip-ativo', ativo);
      botao.setAttribute('aria-pressed', String(ativo));
    });
  }

  /** A nota geral é obrigatória. Mostra o erro e devolve false se faltar. */
  static validar() {
    if (AvaliacaoPage.notaGeral >= 1) return true;
    document.getElementById('erro-nota').hidden = false;
    const primeira = document.querySelector('#estrelas-geral .estrela-botao');
    if (primeira) primeira.focus();
    return false;
  }

  static enviar(evento) {
    evento.preventDefault();
    if (!AvaliacaoPage.validar()) return;

    const botao = document.getElementById('btn-enviar');
    try {
      AvaliacaoService.criar({
        consultaId: AvaliacaoPage.consulta.id,
        notaGeral: AvaliacaoPage.notaGeral,
        criterios: { ...AvaliacaoPage.criterios },
        comentario: document.getElementById('comentario').value,
        recomenda: AvaliacaoPage.recomenda
      });
      botao.disabled = true;
      Toast.mostrar('Avaliação enviada. Obrigado pela sua opinião!', 'sucesso');
      setTimeout(AvaliacaoPage.pular, 1200);
    } catch (erro) {
      Toast.mostrar(erro.message, 'erro');
    }
  }

  /** Volta para o histórico sem avaliar. */
  static pular() {
    window.location.href = 'historico.html';
  }
}
