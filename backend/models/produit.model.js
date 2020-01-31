module.exports = function (sequelize, Sequelize) {
    const Produit = sequelize.define('produit', {
        //cle
        categorieId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        
        // attributes
        nom: {
            type: Sequelize.STRING,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT
            // allowNull defaults to true
        },
        prixUnitaire: {
            type: Sequelize.STRING,
            allowNull: false
        },
        photo: {
            type: Sequelize.TEXT('big'),
        },
        deletedAt: {
            type: Sequelize.DATE,
        }
    }, {
        // options
    });
    return Produit;
}

