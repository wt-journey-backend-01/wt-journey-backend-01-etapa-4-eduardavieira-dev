const { z } = require('zod');

const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

const registerSchema = z.object({
    nome: z.string({
        required_error: 'Nome é obrigatório',
        invalid_type_error: 'Nome deve ser uma string'
    })
        .trim()
        .min(1, "O nome não pode ser vazio")
        .refine(value => value.trim().length > 0, {
            message: "O nome não pode conter apenas espaços"
        }),

    email: z.string({
        required_error: 'Email é obrigatório',
        invalid_type_error: 'Email deve ser uma string'
    })
        .trim()
        .min(1, "O email não pode ser vazio")
        .email("Email inválido")
        .refine(value => value.trim().length > 0, {
            message: "O email não pode conter apenas espaços"
        }),

    senha: z.string({
        required_error: 'Senha é obrigatória',
        invalid_type_error: 'Senha deve ser uma string'
    })
        .min(8, "A senha deve ter no mínimo 8 caracteres")
        .max(100, "A senha não pode ter mais de 100 caracteres")
        .regex(senhaRegex, "A senha deve conter letra maiúscula, minúscula, número e caractere especial")
}).strict({
    message: 'Campos extras não são permitidos'
});

const loginSchema = z.object({
    email: z.string({
        required_error: 'Email é obrigatório',
        invalid_type_error: 'Email deve ser uma string'
    })
        .trim()
        .min(1, 'Email não pode ser vazio')
        .email('Email inválido'),

    senha: z.string({
        required_error: 'Senha é obrigatória',
        invalid_type_error: 'Senha deve ser uma string'
    })
        .trim()
        .min(1, 'Senha não pode ser vazia')
}).strict({
    message: 'Campos extras não são permitidos'
});

module.exports = {
    registerSchema,
    loginSchema
};
