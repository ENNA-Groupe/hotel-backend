module.exports = function (sequelize, Sequelize) {
    const Controller = sequelize.define('controller', {
         //cle
         userId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        controlId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        donnees: {
            type: Sequelize.BOOLEAN,
            allowNull: false
        },
        corbeille: {
            type: Sequelize.BOOLEAN,
            allowNull: false
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

