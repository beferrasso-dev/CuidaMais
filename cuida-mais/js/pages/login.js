class LoginPage {

    static CHAVE_LEMBRAR = Storage.CHAVES.LEMBRAR_EMAIL || "cuida_lembrar_email";

    static iniciar() {
        
        Storage.iniciar();

        if (AuthService.usuarioLogado() !== null) {
            window.location.href = "medicos.html";
            return;
        }

        Layout.renderFooter();

        const formulario = document.getElementById("form-login");
        const botaoSenha = document.getElementById("mostrar-senha");
        const linkCadastro = document.getElementById("link-cadastro");
        const linkRecuperar = document.getElementById("link-recuperar-senha");

        const emailLembrado = Storage.ler(LoginPage.CHAVE_LEMBRAR, "");
        if (emailLembrado !== "") {
            document.getElementById("email").value = emailLembrado;
            document.getElementById("lembrar").checked = true;
        }

        if (linkCadastro != null) {
            linkCadastro.addEventListener("click", (evento) => {
                evento.preventDefault();
                LoginPage.abrirCadastro();
            });
        }

        if (botaoSenha != null) {
            botaoSenha.addEventListener("click", () => LoginPage.alternarVisibilidadeSenha())
        }

        if (linkRecuperar != null) {
            linkRecuperar.addEventListener("click", (evento) => {
                evento.preventDefault();
                LoginPage.esqueciSenha();
            });
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
        if (!LoginPage.validarCampos()) {
            return;
        }
        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;
        const usuario = AuthService.login(email, senha);
        if (usuario === null) {
            LoginPage.mostrarErro("E-mail ou senha incorretos.");
            return;
        }

        if (document.getElementById("lembrar").checked) {
            Storage.salvar(LoginPage.CHAVE_LEMBRAR, email.trim());
        } else {
            Storage.remover(LoginPage.CHAVE_LEMBRAR);
        }
        window.location.href = "medicos.html";
    }

    static validarCampos() {
        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;

        if (!Validador.obrigatorio(email)) {
            LoginPage.mostrarErro("Informe seu e-mail.");
            return false;
        }
        if (!Validador.email(email)) {
            LoginPage.mostrarErro("Digite um e-mail válido, como nome@exemplo.com.");
            return false;
        }
        if (!Validador.obrigatorio(senha)) {
            LoginPage.mostrarErro("Informe sua senha.");
            return false;
        }
        return true;
    }

    static mostrarErro(msg) {
        const mensagemErro = document.getElementById("mensagem-erro");
        mensagemErro.textContent = msg;
    }

    static alternarVisibilidadeSenha() {
        const senha = document.getElementById("senha");
        const botao = document.getElementById("mostrar-senha");
        if (senha.type === "password") {
            senha.type = "text";
            botao.textContent = "Ocultar";   
        } else {
            senha.type = "password";
            botao.textContent = "Mostrar";
        }
    }

    static esqueciSenha() {
        Toast.mostrar("Recuperação de senha não está disponível nesta versão de demonstração.", "info", 5000);
    }

    static abrirCadastro() {
        Modal.abrir("Criar conta", `
            <div class="cadastro-form">
                <div class="campo">
                    <label for="cad-nome">Nome completo</label>
                    <input class="input" type="text" id="cad-nome" autocomplete="name" placeholder="Seu nome">
                </div>
                <div class="campo">
                    <label for="cad-email">E-mail</label>
                    <input class="input" type="email" id="cad-email" autocomplete="email" placeholder="seuemail@exemplo.com">
                </div>
                <div class="campo">
                    <label for="cad-senha">Senha (mínimo 6 caracteres)</label>
                    <input class="input" type="password" id="cad-senha" autocomplete="new-password" placeholder="••••••••">
                </div>
                <div class="campo">
                    <label for="cad-confirmar">Confirmar senha</label>
                    <input class="input" type="password" id="cad-confirmar" autocomplete="new-password" placeholder="••••••••">
                </div>
                <p class="msg-erro" id="cad-erro" role="alert" hidden></p>
            </div>`, [
            { rotulo: "Cancelar", tipo: "outline" },
            { rotulo: "Criar conta", tipo: "primario", aoClicar: (janela) => LoginPage.confirmarCadastro(janela) }
        ]);
    }

    static confirmarCadastro(janela) {
        const nome = janela.querySelector("#cad-nome").value;
        const email = janela.querySelector("#cad-email").value;
        const senha = janela.querySelector("#cad-senha").value;
        const confirmar = janela.querySelector("#cad-confirmar").value;
        const erro = janela.querySelector("#cad-erro");

        try {
            if (senha !== confirmar) {
                throw new Error("As senhas não são iguais.");
            }
            AuthService.cadastrar({ nome: nome, email: email, senha: senha });
        } catch (e) {
            erro.textContent = e.message;
            erro.hidden = false;
            return false;
        }

        AuthService.login(email, senha);
        window.location.href = "medicos.html";
    }
}


LoginPage.iniciar();
