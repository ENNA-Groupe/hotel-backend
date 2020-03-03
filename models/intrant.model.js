module.exports = function (sequelize, Sequelize) {
    const Intrant = sequelize.define('intrant', {
        //cle
        categorieId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        mesureId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        contenanceId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        
        // attributes
        nom: {
            type: Sequelize.STRING,
            allowNull: false
        },
         // attributes
         contenance: {
            type: Sequelize.STRING,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT
            // allowNull defaults to true
        },
        quantiteAlerte: {
            type: Sequelize.INTEGER,
        },
        quantiteStock: {
            type: Sequelize.INTEGER,
            defaultValue: '0'
        },
        deletedAt: {
            type: Sequelize.DATE,
        }
    }, {
        // options
    });
    return Intrant;
}

