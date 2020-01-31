module.exports = function (sequelize, Sequelize) {
    const Controller = sequelize.define('controller', {
        // attributes
        nom: {
            type: Sequelize.STRING,
            allowNull: false
        },
        operation: {
            type: Sequelize.STRING,
        },
        Ajout: {
            type: Sequelize.BOOLEAN,
            allowNull: false
        }, 
        Modification: {
            type: Sequelize.BOOLEAN,
            allowNull: false
        }, 
        Supression: {
            type: Sequelize.BOOLEAN,
            allowNull: false
        },
        Restoration: {
            type: Sequelize.BOOLEAN,
            allowNull: false
        },
        deletedAt: {
            type: Sequelize.DATE,
        }
    }, {
        // options
    });
    return Controller;
}

