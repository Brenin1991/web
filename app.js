const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

const dados = fs.readFileSync(
  path.join(__dirname, 'arquivos', 'usuarios.json'),
  'utf-8'
); // String
const usuarios = JSON.parse(dados);

const ultimoId = () => {
  let id = -1;
  usuarios.forEach(u => {
    if (u.id > id) id = u.id;
  });
  return id;
};

const salvaJSON = callback => {
  const usuariosJSON = JSON.stringify(usuarios);
  fs.writeFile(
    path.join(__dirname, 'arquivos', 'usuarios.json'),
    usuariosJSON,
    'utf-8',
    callback
  );
};

const validar = (nome, email, senha, senhaConfirmacao, edicao = false) => {
  const erros = {
    nome: [],
    email: [],
    senha: [],
    senhaConfirmacao: [],
    temErros: function() {
      return (
        this.nome.length > 0 ||
        this.email.length > 0 ||
        this.senha.length > 0 ||
        this.senhaConfirmacao.length > 0
      );
    }
  };

  if (!nome) {
    erros.nome.push('Por favor, informe o seu nome.');
  }
  if (!email) {
    erros.email.push('Por favor, informe o seu e-mail.');
  }
  if (!edicao) {
    if (!senha) {
      erros.senha.push('Por favor, informe a sua senha.');
    }
    if (!senhaConfirmacao) {
      erros.senhaConfirmacao.push('Por favor, confirme a sua senha.');
    }
  }
  if (senha !== senhaConfirmacao) {
    erros.senhaConfirmacao.push('A senha informada não é igual à confirmação.');
  }

  return erros;
};

////////////////////////////////////////////////////

app.get('/login', (req, res) => {
  res.status(200).render('autenticacao/login', {
    titulo: 'Login'
  });
});

app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  let statusCode = 200;
  let mensagem;
  let view;

  const usuario = usuarios.find(u => u.email === email && u.senha === senha);

  if (usuario) {
    mensagem = `Seja bem vindo, ${usuario.nome}`;
    view = 'sucesso';
  } else {
    statusCode = 401;
    mensagem = 'Email ou senha incorretos';
    view = 'autenticacao/login';
  }

  res.status(statusCode).render(view, { mensagem });
});

app.get('/registrar', (req, res) => {
  res.status(200).render('autenticacao/registrar', {
    titulo: 'Registrar',
    usuario: {}
  });
});

app.post('/registrar', (req, res) => {
  const { nome, email, senha, senhaConfirmacao } = req.body;

  const erros = validar(nome, email, senha, senhaConfirmacao);

  if (!erros.temErros()) {
    const id = ultimoId() + 1;
    const usuario = { id, nome, email, senha };
    usuarios.push(usuario);
    salvaJSON(() => {
      res.status(200).render('sucesso', {
        usuario,
        mensagem: `Usuário ${usuario.nome} registrado com sucesso.`
      });
    });
  } else {
    const usuarioView = { nome, email };
    res
      .status(401)
      .render('autenticacao/registrar', { usuario: usuarioView, erros });
  }
});

app.get('/usuarios/:id/editar', (req, res) => {
  const id = req.params.id * 1;
  const usuario = usuarios.find(u => u.id === id);

  if (req.params.id && usuario) {
    res.status(200).render('usuarios/editar', {
      usuario,
      titulo: `Editando ${usuario.nome}`
    });
  } else {
    res.status(404).render('404', {
      titulo: 'Recurso Inexistente'
    });
  }
});

app.post('/usuarios/:id/editar', (req, res) => {
  const { nome, email, senha, senhaConfirmacao } = req.body;
  const id = req.params.id * 1;
  const usuario = usuarios.find(u => u.id === id);

  const erros = validar(nome, email, senha, senhaConfirmacao, true);

  if (!erros.temErros()) {
    usuario.nome = nome;
    usuario.email = email;
    if (senha) {
      usuario.senha = senha;
    }

    salvaJSON(() => {
      res.status(200).render('sucesso', {
        usuario,
        mensagem: `Os dados cadastrais do usuário ${usuario.nome} foram atualizados.`
      });
    });
  } else {
    const usuarioView = { id, nome, email };
    res.status(401).render('usuarios/editar', { usuario: usuarioView, erros });
  }
});

app.get('/usuarios/:id', (req, res) => {
  const id = req.params.id * 1;
  const usuario = usuarios.find(u => u.id === id);

  if (req.params.id && usuario) {
    res.status(200).render('usuarios/mostrar', {
      usuario,
      titulo: usuario.nome
    });
  } else {
    res.status(404).render('404', {
      titulo: 'Recurso Inexistente'
    });
  }
});

app.get('/usuarios', (req, res) => {
  res.status(200).render('usuarios/todos', {
    usuarios,
    titulo: 'Usuários Cadastrados'
  });
});

app.all('*', (req, res) => {
  res.status(404).render('404', {
    titulo: 'Recurso Inexistente'
  });
});

const porta = 3000;
app.listen(porta, () => {
  console.log(`Servidor rodando em http://localhost:${porta} ...`);
});
