const { DataTypes, Sequelize } = require('sequelize');

/**
 * Représentation du model Member
 * @param {Sequelize} sequelize
 * @returns
 */
module.exports = (sequelize) => {

    // Initialize Member model
    const Member = sequelize.define('member', {
        // Attributs
        pseudo: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: {
                name: 'UK_Member__Pseudo'
            }
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: {
                name: 'UK_Member__Email'
            }
        },
        password: {
            type: DataTypes.CHAR(60),
            allowNull: false
        },
        isAdmin: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        // Si on souhaite avoir "createdAt" mais pas "updatedAt" 
        timestamps: true,
        updatedAt: false
    });

    return Member;
};