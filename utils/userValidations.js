const { z } = require('zod');

const registerSchema = z.object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    senha: z.string()
        .min(8, 'Senha deve ter no mínimo 8 caracteres')
        .regex(/[a-z]/, 'Senha deve conter letra minúscula')
        .regex(/[A-Z]/, 'Senha deve conter letra maiúscula')
        .regex(/[0-9]/, 'Senha deve conter número')
        .regex(/[^A-Za-z0-9]/, 'Senha deve conter caractere especial')
}).strict(); // .strict() não permite campos extras

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    senha: z.string().min(1, 'Senha é obrigatória')
}).strict();

module.exports = {
    registerSchema,
    loginSchema
};
