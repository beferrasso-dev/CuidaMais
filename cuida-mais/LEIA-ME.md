# Cuida+: base compartilhada (parte do Bernardo)

Este pacote traz a **base** que todas as páginas usam. Cada um continua só nos arquivos da sua lista.

## Como o código está organizado
- HTML + CSS + JavaScript puro, **scripts clássicos** (sem `import`/`export`), para abrir direto do ZIP.
- Todas as classes têm **métodos estáticos**: `ConsultaService.criar(...)`, `Layout.iniciar(...)`.
- Cada página é uma classe com `static iniciar()`, chamada no fim do HTML (veja `modelo-pagina.html`).
- Os dados ficam no `localStorage`; quem está logado fica no `sessionStorage`.

## Padrões obrigatórios
| Item | Formato |
|---|---|
| data | texto `"DD-MM-AAAA"` (ex.: `"12-11-2026"`) |
| hora | texto `"HH:MM"` (ex.: `"14:00"`) |
| status da consulta | `"agendada"`, `"realizada"` ou `"cancelada"` |
| erros de regra de negócio | os services lançam `Error` com mensagem pronta; a tela mostra com `Toast.mostrar(e.message, 'erro')` |

## Ao abrir qualquer página interna
```js
static iniciar() {
  if (!Layout.iniciar('historico')) return;   // 'medicos' | 'agenda' | 'avaliacao' | 'historico'
  // ... resto da página
}
```
`Layout.iniciar` carrega os dados, exige login, atualiza o status das consultas e desenha cabeçalho e rodapé.
O HTML precisa ter `<div id="cabecalho"></div>` e `<footer id="rodape"></footer>`.

## O que cada pessoa deve entregar para a base funcionar
- **Login (AuthService + Validador):** métodos estáticos `login`, `logout`, `usuarioLogado`, `exigirLogin`, `cadastrar`.
  Use `Storage.lerSessao()`, `Storage.salvarSessao(obj)` e `Storage.removerSessao()` para a sessão,
  e `Storage.CHAVES.USUARIOS` para a lista de usuários. `usuarioLogado()` deve devolver um objeto com `id` e `nome`.
  `exigirLogin()` redireciona para `index.html` se não houver sessão.
- **Histórico (Modal):** `Modal.abrir(titulo, conteudoHtml, botoes)` e `Modal.fechar()`. O CSS já está em `componentes.css`
  (`.modal-fundo`, `.modal`, `.modal-titulo`, `.modal-acoes`).
- **Agenda (Calendario):** a classe `Calendario` do UML.

## Métodos úteis já prontos
- `ConsultaService`: `listarDoUsuario`, `buscarPorId`, `criar`, `cancelar`, `remarcar`, `horarioOcupado`,
  `filtrarPorStatus`, `resumo`, `atualizarStatusAutomatico` e `marcarAvaliada` (extra, usado pelo AvaliacaoService).
- `MedicoService`: `listar`, `buscarPorId`, `listarEspecialidades`, `filtrar`, `horariosLivres`, `atualizarNota`.
- `Formatadores`: `moeda`, `data`, `dataLonga`, `iniciais` e `escapar` (extra: use antes de colocar texto em `innerHTML`).
- Datas (`Formatadores`): `paraDate(data, hora)` converte para `Date` (use para comparar e calcular, nunca compare datas como texto), `dataValida(data)`, `deDate(date)`, e `deInputData` / `paraInputData` para converter de/para o `<input type="date">` (que usa `AAAA-MM-DD`).
- `Toast.mostrar(mensagem, 'sucesso' | 'erro' | 'info')`.
- Classes de CSS prontas: `.btn`, `.btn-primario`, `.btn-outline`, `.card`, `.chip`, `.chip-ativo`, `.badge-agendada|realizada|cancelada`,
  `.campo`, `.input`, `.tabela`, `.avatar`, `.msg-erro`.

## Usuário de teste
E-mail `maria@exemplo.com` · senha `123456`. Para voltar ao estado inicial: `Storage.resetar()` no console do navegador.

## Antes de entregar
Trocar `Layout.INTEGRANTES` (em `js/ui/Layout.js`) pelos 4 nomes reais.

## Como as telas conversam (parâmetros na URL)
- Médicos -> Agenda: `agenda.html?medico=2` ou `agenda.html?medico=2&data=12-11-2026&hora=14:00` (data em DD-MM-AAAA).
  A página da Agenda lê esses parâmetros com `new URLSearchParams(window.location.search)`.
- Histórico -> Avaliação: `avaliacao.html?consulta=ID`.
- Histórico -> Agenda (remarcar): a combinar entre a Pessoa 3 e a Pessoa 4.

## Componentes prontos
- `Estrelas.html(nota, tamanho)`: estrelas só para mostrar.
- `new EstrelasInput(container, valorInicial, onChange)`: estrelas clicáveis (`getValor()`, `setValor(n)`).
- Avaliação -> Histórico: depois de enviar ou pular, a Avaliação volta para `historico.html`.
