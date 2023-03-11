const { DataTypes, Sequelize } = require('sequelize');

/**
 * Représentation du model Message
 * @param {Sequelize} sequelize
 * @returns
 */

module.exports = (sequelize) => {

    // Initialize model Message
    const Message = sequelize.define('message', {
        // Clef primaire
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },
        // Attributs
        content: {
            type: DataTypes.STRING(1000),
            allowNull: false
        }
    }, {
        tableName: 'subjectMessages'
    });

    return Message;
};
