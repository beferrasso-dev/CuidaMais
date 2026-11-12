class LoginPage {

    static iniciar() {
        const formulario = document.getElementById("form-login");
        const botaoSenha = document.getElementById("mostrar-senha");
        const linkCadastro = document.getElementById("link-cadastro");

        if (linkCadastro != null) {
            linkCadastro.addEventListener("click", () => LoginPage.abrirCadastro());
        }

        if (botaoSenha != null) {
            botaoSenha.addEventListener("click", () => LoginPage.alternarVisibilidadeSenha())
        }

        if (formulario != null) {
            formulario.addEventListener("submit", (evento) => {
                LoginPage.aoEnviar(evento);
            })
        }
    }
    static aoEnviar(evento) {
        evento.preventDefault();
        LoginPage.mostrarErro("");
        const campoEmail = document.getElementById("email");
        const email = campoEmail.value;
        const campoSenha = document.getElementById("senha");
        const senha = campoSenha.value;
        if (!LoginPage.validarCampos()) {
            LoginPage.mostrarErro("E-mail ou senha inválidos.");
            return;
        }
        const usuario = AuthService.login(email, senha);
        if (usuario !== null) {
            window.location.href = "medicos.html";
        } else {
            LoginPage.mostrarErro("E-mail ou senha incorretos.");
        }
    }
    static validarCampos() {
        const campoEmail = document.getElementById("email");
        const email = campoEmail.value;
        const campoSenha = document.getElementById("senha");
        const senha = campoSenha.value;
        const emailValido = Validador.obrigatorio(email) && Validador.email(email);
        const senhaValida = Validador.obrigatorio(senha) && Validador.senhaMinima(senha, 6);
        return emailValido && senhaValida;
    }

    static mostrarErro(msg) {
        const mensagemErro = document.getElementById("mensagem-erro");
        mensagemErro.textContent = msg;
    }

    static alternarVisibilidadeSenha() {
        const senha = document.getElementById("senha");
        if (senha.type === "password") {
            senha.type = "text";
        } else {
            senha.type = "password";
        }
    }

    static abrirCadastro() {
        window.location.href = "cadastro.html";
    }
}


LoginPage.iniciar();
