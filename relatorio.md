<sup>Esse é um feedback gerado por IA, ele pode conter erros.</sup>

Você tem 7 créditos restantes para usar o sistema de feedback AI.

# Feedback para eduardavieira-dev:

Nota final: **70.0/100**

```markdown
# Olá, Eduarda! 👋🚀

Primeiramente, parabéns pelo esforço e pelo progresso que você já fez até aqui! 🎉 Você conseguiu implementar muitos pontos importantes da API, como o sistema de autenticação com JWT, proteção das rotas e criação dos endpoints básicos para usuários, agentes e casos. Isso já é um baita avanço para uma aplicação segura e funcional!

Além disso, você também passou em vários testes essenciais, como:

- Criação e login de usuários com JWT válido.
- Logout funcionando e invalidando o token.
- Proteção das rotas de agentes e casos com middleware de autenticação.
- Manipulação dos agentes e casos com status codes corretos.
- Implementação da filtragem simples nos endpoints, e busca por termos nos casos.
- Organização da estrutura do projeto está alinhada com o esperado (controllers, repositories, middlewares, routes, etc).
  
🎯 **Você também implementou alguns bônus legais, como:**

- Endpoint para buscar casos por agente.
- Endpoint para buscar agente responsável por um caso.
- Filtragem e ordenação de agentes pela data de incorporação.
- Mensagens de erro customizadas para IDs inválidos.

Isso mostra que você está indo além do básico, parabéns! 👏

---

# Agora, vamos falar sobre os pontos que precisam de atenção para destravar 100% do seu desafio! 🔍

---

## 1. Testes que falharam relacionados à validação dos dados do usuário na criação (registro)

### Problema detectado:

Os testes falharam porque o sistema **não está retornando erro 400 para vários casos de dados inválidos no registro de usuários**, como:

- Nome vazio ou nulo
- Email vazio ou nulo
- Senha vazia, nula, senha curta, sem números, sem caractere especial, sem letra maiúscula ou sem letras
- Campos extras enviados no corpo da requisição
- Campos faltantes no corpo da requisição

### Análise da causa raiz:

No seu `authController.js`, você usa o esquema `registerSchema` do Zod para validar os dados do usuário no registro:

```js
const result = registerSchema.safeParse(req.body);
if (!result.success) {
    const errors = [];
    
    if (result.error.errors.some(e => e.code === 'unrecognized_keys')) {
        const extraFields = result.error.errors
            .find(e => e.code === 'unrecognized_keys')
            .keys;
        errors.push(`Campos não permitidos: ${extraFields.join(', ')}`);
    } else {
        const formattedErrors = result.error.format();
        if (formattedErrors.nome?._errors) {
            errors.push(...formattedErrors.nome._errors);
        }
        if (formattedErrors.email?._errors) {
            errors.push(...formattedErrors.email._errors);
        }
        if (formattedErrors.senha?._errors) {
            errors.push(...formattedErrors.senha._errors);
        }
    }
    
    throw new AppError(400, 'Dados inválidos', errors);
}
```

No entanto, o problema provavelmente está na **definição do seu `registerSchema` em `utils/userValidations.js`** — que você não enviou aqui, mas é o ponto crítico para essas validações.

Se o schema não estiver validando corretamente os campos obrigatórios, tipos, padrões e o formato da senha, os testes vão falhar.

### O que revisar e ajustar:

- Garanta que o `registerSchema` use o Zod para validar os campos obrigatórios (`nome`, `email`, `senha`), e que:

  - `nome` seja uma string não vazia.
  - `email` seja uma string que respeite o formato de e-mail.
  - `senha` tenha no mínimo 8 caracteres, pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.  

- Utilize regex para validar a senha conforme os requisitos.

- Configure o schema para **não permitir campos extras** (usar `.strict()` no Zod).

- Exemplo básico de schema para senha (simplificado):

```js
const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

const registerSchema = z.object({
  nome: z.string().min(1, "O nome não pode ser vazio"),
  email: z.string().email("Email inválido"),
  senha: z.string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .regex(senhaRegex, "A senha deve conter letra maiúscula, minúscula, número e caractere especial"),
}).strict();
```

- Com isso, sua validação vai capturar todos os casos que os testes esperam e retornar mensagens de erro claras.

---

## 2. Testes que falharam relacionados a IDs inválidos para agentes e casos

### Problema detectado:

Os testes falharam quando você tenta buscar, atualizar ou deletar agentes ou casos usando IDs em formato inválido (ex: strings que não são números).

### Análise da causa raiz:

No seu código dos controllers de agentes e casos, você verifica se o recurso existe, mas não está validando se o ID recebido é um número inteiro válido antes de consultar o banco.

Exemplo do `getCasosById`:

```js
async function getCasosById(req, res) {
    const id = Number(req.params.id);

    if (!id || !Number.isInteger(id)) {
        throw new AppError(404, 'Id inválido');
    }

    const caso = await casosRepository.findById(id);

    if (!caso) {
        throw new AppError(404, 'Nenhum caso encontrado para o id especificado');
    }

    res.json(caso);
}
```

Aqui você converte `id` para número, mas o teste `!id` falhará para `0` (que não é um ID válido, mas pode causar confusão). Além disso, para outros endpoints (ex: agentesController), não vi essa validação explícita.

### O que revisar e ajustar:

- Centralize a validação de IDs para todos os endpoints que recebem `:id` como parâmetro.

- Garanta que o ID seja um número inteiro positivo.

- Exemplo de validação simples:

```js
function isValidId(id) {
  const num = Number(id);
  return Number.isInteger(num) && num > 0;
}
```

- Use essa validação antes de consultar o banco. Caso o ID seja inválido, retorne erro 404 com mensagem clara.

- Isso evitará consultas desnecessárias no banco e deixará seu código mais robusto.

---

## 3. Comentário sobre a Estrutura de Diretórios

Sua estrutura está muito bem organizada e segue o padrão esperado, com pastas claras para controllers, repositories, routes, middlewares e utils.

Só fique atenta para que o arquivo `authRoutes.js`, `authController.js` e `usuariosRepository.js` estejam na pasta correta, como você fez.

---

## 4. Sobre os testes bônus que falharam

Você implementou várias funcionalidades bônus, mas alguns testes bônus não passaram, como:

- Endpoint `/usuarios/me` para retornar dados do usuário autenticado.
- Implementação completa da lógica de refresh tokens.
- Filtros avançados e mensagens customizadas para agentes e casos.

Esses são extras que podem elevar sua nota, e você já está no caminho certo!

---

# Recomendações e Recursos para Estudo

Para te ajudar a corrigir esses pontos, recomendo muito os seguintes vídeos, feitos pelos meus criadores, que explicam os conceitos que você precisa dominar:

- **Autenticação e Segurança com JWT e Bcrypt:**  
  https://www.youtube.com/watch?v=Q4LQOfYwujk  
  *Esse vídeo fala muito bem sobre os conceitos básicos e fundamentais da cibersegurança.*

- **JWT na prática:**  
  https://www.youtube.com/watch?v=keS0JWOypIU  
  *Como gerar, validar e usar tokens JWT corretamente.*

- **Uso de JWT e Bcrypt no Node.js:**  
  https://www.youtube.com/watch?v=L04Ln97AwoY  
  *Mostra como integrar hashing de senha com bcrypt e autenticação JWT.*

- **Validação com Zod e boas práticas:**  
  Embora não tenha vídeo direto, recomendo a [documentação oficial do Zod](https://github.com/colinhacks/zod) para aprender a criar schemas rigorosos e claros.

- **Knex.js para consultas e migrations:**  
  https://www.youtube.com/watch?v=GLwHSs7t3Ns&t=4s  
  *Para garantir que suas queries estejam corretas e que as migrations estejam bem definidas.*

---

# Resumo dos principais pontos para focar:

- [ ] **Aprimorar o schema de validação `registerSchema` para garantir validação rigorosa de nome, email e senha, incluindo regras específicas para senha e bloqueio de campos extras.**

- [ ] **Adicionar validação robusta para IDs nos controllers de agentes e casos, garantindo que IDs inválidos retornem erro 404 antes de consultar o banco.**

- [ ] **Testar os endpoints com dados inválidos para garantir que o sistema retorna status 400 e mensagens claras, conforme esperado nos testes.**

- [ ] **Considerar implementar o endpoint `/usuarios/me` para retornar dados do usuário autenticado (bônus).**

- [ ] **Estudar os vídeos recomendados para aprofundar seus conhecimentos em autenticação, JWT, bcrypt, validação e Knex.js.**

---

# Conclusão

Eduarda, você está com uma base muito boa e o projeto está bem estruturado! 🎯✨ Os pontos que precisam de ajuste são principalmente sobre validação rigorosa de dados e tratamento correto de IDs inválidos. Isso é super comum em APIs profissionais e vai garantir que seu sistema seja seguro, confiável e robusto.

Continue firme, revise os schemas de validação e as verificações de ID, e logo logo você terá uma aplicação completa e segura, pronta para produção! 🚀

Qualquer dúvida, pode me chamar que vamos destravar isso juntos! 😉

Abraços e bons códigos! 💻💙
```

> Caso queira tirar uma dúvida específica, entre em contato com o Chapter no nosso [discord](https://discord.gg/DryuHVnz).



---
<sup>Made By the Autograder Team.</sup><br>&nbsp;&nbsp;&nbsp;&nbsp;<sup><sup>- [Arthur Carvalho](https://github.com/ArthurCRodrigues)</sup></sup><br>&nbsp;&nbsp;&nbsp;&nbsp;<sup><sup>- [Arthur Drumond](https://github.com/drumondpucminas)</sup></sup><br>&nbsp;&nbsp;&nbsp;&nbsp;<sup><sup>- [Gabriel Resende](https://github.com/gnvr29)</sup></sup>