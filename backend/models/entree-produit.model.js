module.exports = function (sequelize, Sequelize) {
    const EntreeProduit = sequelize.define('entreeProduit', {
         //cle
         entreeId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        // attributes
        prixUnitaire: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        prixTotal: {
            type: Sequelize.INTEGER,
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