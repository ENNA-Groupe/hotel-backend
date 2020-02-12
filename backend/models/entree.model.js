module.exports = function (sequelize, Sequelize) {
    const Entree = sequelize.define('entree', {
         //cle
         fournisseurId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        // attributes
        numeroFacture: {
            type: Sequelize.STRING,
            allowNull: false
        },
        montantTotal: {
            type: Sequelize.INTEGER,
        },
        montantPaye: {
            type: Sequelize.INTEGER
        },
        autresFrais: {
            type: Sequelize.INTEGER
        },
        deletedAt: {
            type: Sequelize.DATE,
        }
    }, {
        // options
    });
    return Entree;
}