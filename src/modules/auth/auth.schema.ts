/**
 * Auth schemas
 * Validation uniquement pour l'authentification
 */

export const registerSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'Adresse email de l’utilisateur'
      },
      password: {
        type: 'string',
        minLength: 8,
        description: 'Mot de passe utilisateur'
      }
    }
  }
};

export const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email'
      },
      password: {
        type: 'string',
        minLength: 8
      }
    }
  }
};
