module.exports = function (sequelize, Sequelize) {
    const EntreeProduit = sequelize.define('entreeProduit', {
         //cle
         entreeId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        produitId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        // attributes
        prixUnitaire: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        quantite: {
            type: Sequelize.INTEGER
        },
        deletedAt: {
            type: Sequelize.DATE,
        }
    }, {
        // options
    });
    return EntreeProduit;
}