<sup>Esse é um feedback gerado por IA, ele pode conter erros.</sup>

Você tem 9 créditos restantes para usar o sistema de feedback AI.

# Feedback para eduardavieira-dev:

Nota final: **27.5/100**

# Feedback para eduardavieira-dev 🚓🔐

Olá, Eduarda! Que legal ver o seu empenho nessa etapa tão importante de segurança e autenticação! 🎉

---

## 🎉 Primeiramente, parabéns pelos acertos!

- Você estruturou muito bem o projeto, seguindo a arquitetura MVC com controllers, repositories, middlewares e rotas organizados — isso é fundamental para projetos profissionais! 👏
- A integração com PostgreSQL via Knex está bem feita, e suas migrations e seeds estão corretas.
- Implementou os endpoints básicos de autenticação (`/auth/register`, `/auth/login`, `/auth/logout`) e proteção de rotas usando middleware JWT.
- A proteção das rotas de agentes e casos com o middleware de autenticação está funcionando, garantindo segurança.
- Os testes básicos de criação e login de usuários, logout e exclusão de usuários passaram, mostrando que a base está sólida.
- Você também avançou nos bônus, como o endpoint `/usuarios/me` para retornar dados do usuário autenticado, e a filtragem de agentes e casos por parâmetros — muito bom! 🌟

---

## 🚨 Agora, vamos analisar os pontos que precisam de atenção para destravar sua nota e garantir que sua API esteja 100% pronta para produção.

### 1. Validação dos dados do usuário na criação (registro) — testes falharam:

> Testes que falharam relacionados a isso:
> - "USERS: Recebe erro 400 ao tentar criar um usuário com nome vazio"
> - "USERS: Recebe erro 400 ao tentar criar um usuário com email vazio"
> - "USERS: Recebe erro 400 ao tentar criar um usuário com senha vazia"
> - "USERS: Recebe erro 400 ao tentar criar um usuário com senha curta de mais"
> - "USERS: Recebe erro 400 ao tentar criar um usuário com senha sem números"
> - "USERS: Recebe erro 400 ao tentar criar um usuário com senha sem caractere especial"
> - "USERS: Recebe erro 400 ao tentar criar um usuário com senha sem letra maiúscula"
> - "USERS: Recebe erro 400 ao tentar criar um usuário com senha sem letras"
> - "USERS: Recebe erro 400 ao tentar criar um usuário com e-mail já em uso"
> - "USERS: Recebe erro 400 ao tentar criar um usuário com campo extra"
> - "USERS: Recebe erro 400 ao tentar criar um usuário com campo faltante"

**Análise da causa raiz:**

No seu `authController.js`, no método `register`, você verifica se o email já existe, e faz o hash da senha, mas não encontrei nenhuma validação explícita para:

- Campos obrigatórios (nome, email, senha) não vazios ou nulos
- Validação da complexidade da senha (mínimo 8 caracteres, letras maiúsculas, minúsculas, números e caracteres especiais)
- Validação de formato do email
- Rejeição de campos extras no payload (para evitar dados inesperados)

Exemplo do seu código atual:

```js
const register = async (req, res, next) => {
    try {
        const { nome, email, senha } = req.body;

        const usuarioExistente = await usuariosRepository.findUserByEmail(email);
        if (usuarioExistente) {
            throw new AppError(409, 'Email já cadastrado');
        }

        const salt = await Bcrypt.genSalt(10);
        const senhaHash = await Bcrypt.hash(senha, salt);
        await usuariosRepository.createUser({ nome, email, senha: senhaHash });

        return res.status(201).json({
            message: "Usuario cadastrado com sucesso",
        });

    } catch (error) {
        return next(error);
    }
};
```

**O que está faltando?**

Você precisa validar os dados antes de tentar criar o usuário. Por exemplo, usando uma biblioteca como `zod` (que você já tem nas dependências) para garantir que:

- `nome` é string, não vazio
- `email` é string, não vazio, e no formato correto
- `senha` atende aos critérios de complexidade (mínimo 8 caracteres, letras maiúsculas, minúsculas, números, caracteres especiais)
- Nenhum campo extra está presente no objeto recebido

Isso evita que o banco receba dados inválidos e que seu sistema aceite registros incompletos ou inseguros.

**Exemplo básico de validação com Zod:**

```js
const { z } = require('zod');

const registerSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  senha: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[a-z]/, 'Senha deve conter letra minúscula')
    .regex(/[A-Z]/, 'Senha deve conter letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter caractere especial'),
});

const register = async (req, res, next) => {
    try {
        registerSchema.parse(req.body);

        const { nome, email, senha } = req.body;

        const usuarioExistente = await usuariosRepository.findUserByEmail(email);
        if (usuarioExistente) {
            throw new AppError(400, 'Email já cadastrado'); // Atenção: o teste espera 400, não 409
        }

        const salt = await Bcrypt.genSalt(10);
        const senhaHash = await Bcrypt.hash(senha, salt);
        await usuariosRepository.createUser({ nome, email, senha: senhaHash });

        return res.status(201).json({
            message: "Usuario cadastrado com sucesso",
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return next(new AppError(400, 'Parâmetros inválidos', error.errors.map(e => e.message)));
        }
        return next(error);
    }
};
```

⚠️ Note que o teste espera erro 400 para email já em uso, mas seu código retorna 409. Ajuste para 400 para passar o teste.

---

### 2. Resposta do login — formato esperado do token JWT

> Teste que falhou:
> - O teste espera que o login retorne um JSON com a chave `acess_token`, mas seu código retorna `{ message, token }`

No seu `authController.js`, login retorna:

```js
return res.status(200).json({
    message: "Usuario logado com sucesso",
    token: token,
});
```

Mas o teste espera o formato:

```json
{
  "acess_token": "token aqui"
}
```

**Correção simples:**

```js
return res.status(200).json({
    acess_token: token,
});
```

Remova a mensagem e altere a chave para `acess_token` exatamente assim para passar o teste.

---

### 3. Tratamento dos erros de autenticação no login

Você lança `AppError(401, 'Email inválido')` e `AppError(401, 'Senha inválida')`, mas o enunciado pede erro 400 para email já em uso no registro, e 401 para credenciais inválidas no login — aqui está correto, só fique atento para usar o status certo em cada contexto.

---

### 4. Middleware de autenticação — tratamento assíncrono e uso do jwt.verify

No seu `authMiddleware.js`, você usa a versão callback do `jwt.verify` com async/await dentro:

```js
jwt.verify(token, SECRET, async (err, decoded) => {
    if (err) {
        return next(new AppError(401, 'Token inválido'));
    }

    try {
        const usuario = await usuariosRepository.findUserById(decoded.id);

        if (!usuario) {
            return next(new AppError(401, 'Usuário não encontrado'));
        }

        req.user = {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email
        };

        next();
    } catch (error) {
        return next(new AppError(500, 'Erro ao validar usuário'));
    }
});
```

**Possível problema:**

O uso misto de callback com async/await pode causar confusão e erros silenciosos. Recomendo usar a versão síncrona `jwt.verify` dentro de um try/catch para simplificar:

```js
try {
    const decoded = jwt.verify(token, SECRET);
    const usuario = await usuariosRepository.findUserById(decoded.id);

    if (!usuario) {
        throw new AppError(401, 'Usuário não encontrado');
    }

    req.user = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
    };

    next();
} catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return next(new AppError(401, 'Token inválido'));
    }
    next(err);
}
```

Isso torna o fluxo mais claro e evita problemas assíncronos.

---

### 5. Validação do payload em outras rotas (ex: criação de agentes, casos)

Embora seus controllers estejam protegidos e usando middlewares de validação (`newAgenteValidation`, etc.), é importante garantir que essas validações estejam robustas para evitar payloads com campos extras ou faltantes, que geram erros nos testes.

Se ainda não tiver, implemente validações com `zod` ou `Joi` para validar os dados de entrada, e retornar erros 400 claros.

---

### 6. Estrutura dos diretórios e arquivos

Sua estrutura está condizente com o esperado, parabéns!

Só fique atento para que o arquivo `authRoutes.js` esteja exatamente na pasta `routes/` e que os nomes estejam corretos (ex: `usuariosRepository.js` na pasta `repositories/`).

---

## 📚 Recursos que recomendo para você:

- Para validar os dados de entrada com `zod` e garantir segurança no registro:  
  https://www.youtube.com/watch?v=GLwHSs7t3Ns&t=4s (Guia detalhado do Knex Query Builder e uso de validações)

- Para entender autenticação e JWT com Node.js e Express:  
  https://www.youtube.com/watch?v=Q4LQOfYwujk (Esse vídeo, feito pelos meus criadores, fala muito bem sobre conceitos básicos e fundamentais de cibersegurança)

- Para aprofundar no uso do JWT e bcrypt na prática:  
  https://www.youtube.com/watch?v=L04Ln97AwoY

---

## 📝 Resumo rápido dos principais pontos para focar:

- **Valide rigorosamente os dados de entrada no registro de usuários:** nome, email, senha (complexidade e formato), rejeite campos extras e campos vazios. Use `zod` ou similar.
- **Ajuste o formato da resposta do login para retornar `{ acess_token: "token" }`** exatamente assim.
- **No middleware de autenticação, use `jwt.verify` de forma síncrona dentro de try/catch para evitar problemas assíncronos.**
- **Garanta que os status codes e mensagens de erro estejam conforme o esperado nos testes (ex: 400 para email já em uso no registro).**
- **Continue usando middlewares para validar agentes e casos, evitando payloads inválidos.**

---

Eduarda, você está no caminho certo! Essas correções vão deixar sua API muito mais robusta e profissional. Continue firme nessa jornada, a segurança é um dos pilares mais importantes em qualquer aplicação real! 🚀

Se precisar, volte aos vídeos recomendados para reforçar os conceitos e boas práticas.

Estou aqui torcendo pelo seu sucesso! 💪✨

Um abraço de Code Buddy! 🤖❤️

> Caso queira tirar uma dúvida específica, entre em contato com o Chapter no nosso [discord](https://discord.gg/DryuHVnz).



---
<sup>Made By the Autograder Team.</sup><br>&nbsp;&nbsp;&nbsp;&nbsp;<sup><sup>- [Arthur Carvalho](https://github.com/ArthurCRodrigues)</sup></sup><br>&nbsp;&nbsp;&nbsp;&nbsp;<sup><sup>- [Arthur Drumond](https://github.com/drumondpucminas)</sup></sup><br>&nbsp;&nbsp;&nbsp;&nbsp;<sup><sup>- [Gabriel Resende](https://github.com/gnvr29)</sup></sup>