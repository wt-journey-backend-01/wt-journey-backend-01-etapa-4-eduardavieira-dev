const { z } = require('zod');

const registerSchema = z.object({
    nome: z.string({
        required_error: 'Nome é obrigatório',
        invalid_type_error: 'Nome deve ser uma string'
    })
        .trim()
        .min(1, 'Nome não pode ser vazio')
        .refine((value) => value.trim().length > 0, {
            message: 'Nome não pode ser vazio'
        }),

    email: z.string({
        required_error: 'Email é obrigatório',
        invalid_type_error: 'Email deve ser uma string'
    })
        .trim()
        .min(1, 'Email não pode ser vazio')
        .email('Email inválido')
        .refine((value) => value.trim().length > 0, {
            message: 'Email não pode ser vazio'
        }),

    senha: z.string({
        required_error: 'Senha é obrigatória',
        invalid_type_error: 'Senha deve ser uma string'
    })
        .trim()
        .min(8, 'Senha deve ter no mínimo 8 caracteres')
        .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
        .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
        .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
        .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial')
        .refine(
            (value) => {
                return (
                    value.length >= 8 &&
                    /[a-z]/.test(value) &&
                    /[A-Z]/.test(value) &&
                    /[0-9]/.test(value) &&
                    /[^A-Za-z0-9]/.test(value)
                );
            },
            {
                message: 'Senha deve conter pelo menos 8 caracteres, uma letra maiúscula, uma letra minúscula, um número e um caractere especial'
            }
        )
}).strict({
    message: 'Campos extras não são permitidos'
}); // .strict() não permite campos extras

const loginSchema = z.object({
    email: z.string({
        required_error: 'Email é obrigatório',
        invalid_type_error: 'Email deve ser uma string'
    })
        .min(1, 'Email não pode ser vazio')
        .email('Email inválido')
        .trim(),

    senha: z.string({
        required_error: 'Senha é obrigatória',
        invalid_type_error: 'Senha deve ser uma string'
    })
        .min(1, 'Senha não pode ser vazia')
        .trim()
}).strict({
    message: 'Campos extras não são permitidos'
});

module.exports = {
    registerSchema,
    loginSchema
};
