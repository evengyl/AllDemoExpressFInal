const { Request, Response, NextFunction } = require('express');
const { BaseSchema } = require('yup');
const { ErrorResponse, InvalidFieldErrorResponse } = require('../response-schemas/error-schema');

/**
 * Middleware de validation Yup
 * @param {BaseSchema} yupValidator 
 * @param {number} errorCode 
 * @returns {(req: Request, res: Response, next: NextFunction) => Void}
 */
const bodyValidation = (yupValidator, errorCode = 422) => {

    /**
     * Middleware pour valider les donnée du body via un validator Yup
     * @param {Request} req 
     * @param {Response} res 
     * @param {NextFunction} next 
     */
    return (req, res, next) => {

        yupValidator.noUnknown().validate(req.body, { abortEarly: false })
            .then((data) => {
                // Ajout d'une propriété "validedData" avec les données validées par yup
                req.validatedData = data;

                // Appel de la méthode "next"
                next();
            })
            .catch(yupError => {
                // Création d'un object "errors" sur base de données de validation Yup
                const errors = yupError.inner.reduce((acc, error) => {
                    const { path, message } = error;
                    if (!acc.hasOwnProperty(path)) {
                        acc[path] = [message];
                    }
                    else {
                        acc[path].push(message);
                    }
                    return acc;
                }, {});

                // Envoi d'un réponse d'erreur formatté
                res.status(errorCode).json(new InvalidFieldErrorResponse(
                    'Data invalid',
                    errors,
                    errorCode
                ));
            });
    };
};

module.exports = bodyValidation;