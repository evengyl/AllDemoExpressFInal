const { Request, Response, NextFunction } = require('express');

const defaultOptions = {
    defaultLimit: 20,
    maxLimit: 50
};

/**
 * Middleware pour obtenir les valeur de pagination
 * @param {{defaultLimit: number?, maxLimit: number?}} options
 * @returns {(req: Request, res: Response, next: NextFunction) => Void}
 */
const pagination = (options) => {

    // Fusion des valeurs des options et des valeurs par defaut
    const { defaultLimit, maxLimit } = { ...defaultOptions, ...options };

    /**
     * Middleware de pagination
     * @param {Request} req 
     * @param {Response} res 
     * @param {NextFunction} next 
     */
    return (req, res, next) => {
        const userOffset = parseInt(req.query.offset);
        const userLimit = parseInt(req.query.limit);

        const offset = !isNaN(userOffset) && userOffset > 0 ? userOffset : 0;
        const limit = !isNaN(userLimit) && userLimit > 0 ? Math.min(userLimit, maxLimit) : defaultLimit;

        req.pagination = { offset, limit };
        next();
    };
};

module.exports = pagination;