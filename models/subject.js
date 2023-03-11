const { DataTypes, Sequelize } = require('sequelize');

/**
 * Représentation du model Subject
 * @param {Sequelize} sequelize
 * @returns
 */

module.exports = (sequelize) => {

    // Initialize Subject model
    const Subject = sequelize.define('subject', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        content: {
            type: DataTypes.STRING(1000),
            allowNull: false
        }
    });

    return Subject;
};
