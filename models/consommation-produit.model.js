module.exports = function (sequelize, Sequelize) {
    const ConsommationProduit = sequelize.define('consommationProduit', {
        prixUnitaire: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        quantite: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
         // attributes
        deletedAt: {
            type: Sequelize.DATE,
        }
    }, {
        // options
    });
    return ConsommationProduit;
}