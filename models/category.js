const { DataTypes, Sequelize } = require('sequelize');

/**
 * Représentation du model Category
 * @param {Sequelize} sequelize
 * @returns
 */

module.exports = (sequelize) => {

    const Category = sequelize.define('category', {
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: {
                name: 'UK_Categories__Name'
            }
        }
    }, {
        timestamps: false
    });

    return Category;
};
