class AuthService {

    static normalizarEmail(email) {
        return String(email || "").trim().toLowerCase();
    }

    static login(email, senha) {
        Storage.iniciar();
        const usuarios = Storage.ler(Storage.CHAVES.USUARIOS, []);
        const emailNormalizado = AuthService.normalizarEmail(email);
        const usuario = usuarios.find(u => {
            return AuthService.normalizarEmail(u.email) === emailNormalizado && u.senha === senha;
        })

        if (usuario === undefined) {
            return null;
        }
        const sessao = {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email   
        }
        Storage.salvarSessao(sessao);
        return usuario;
    }


    static logout() {
        Storage.removerSessao();
    }

    static usuarioLogado() {
        return Storage.lerSessao();
    }

    static exigirLogin() {
        const usuario = AuthService.usuarioLogado();
        if (usuario === null) {
            window.location.href = 'index.html';
        }
    }

    static cadastrar(dados) {
        if (!Validador.obrigatorio(dados.nome)) {
            throw new Error("Informe seu nome.");
        }
        if (!Validador.email(dados.email)) {
            throw new Error("Informe um e-mail válido.");
        }
        if (!Validador.senhaMinima(dados.senha, 6)) {
            throw new Error("A senha precisa ter pelo menos 6 caracteres.");
        }

        Storage.iniciar();
        const usuarios = Storage.ler(Storage.CHAVES.USUARIOS, []);
        const emailNormalizado = AuthService.normalizarEmail(dados.email);
        const usuario = usuarios.find(u => AuthService.normalizarEmail(u.email) === emailNormalizado);
        if (usuario !== undefined) {
            throw new Error("Já existe uma conta com este e-mail.");
        }

        const ids = usuarios.map(u => u.id);
        const novoUsuario = {
            id: ids.length > 0 ? Math.max(...ids) + 1 : 1,
            nome: dados.nome.trim(),
            email: emailNormalizado,
            senha: dados.senha
        }
        usuarios.push(novoUsuario);
        Storage.salvar(Storage.CHAVES.USUARIOS, usuarios);
        return novoUsuario;
    }
}
