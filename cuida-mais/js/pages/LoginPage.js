class LoginPage {

    static iniciar() {
        const formulario = document.getElementById("form-login");
        const mensagemErro = document.getElementById("mensagem-erro");
        if (formulario != null) {
            formulario.addEventListener("submit", (event) => {
                event.preventDefault();
                mensagemErro.textContent = "";
                const campoEmail = document.getElementById("email");
                const email = campoEmail.value;
                const campoSenha = document.getElementById("senha");
                const senha = campoSenha.value;
                const emailValido = Validador.obrigatorio(email) && Validador.email(email);
                const senhaValida = Validador.obrigatorio(senha) && Validador.senhaMinima(senha, 6);
                if (emailValido && senhaValida) {
                    const usuario = AuthService.login(email, senha);
                    if (usuario !== null) {
                        window.location.href = "medicos.html";
                    } else {
                        mensagemErro.textContent = "Email ou senha inválidos.";
                    }
                } else {
                    mensagemErro.textContent = "Email ou senha inválidos.";
                }
            })
        }
    }

}
LoginPage.iniciar();