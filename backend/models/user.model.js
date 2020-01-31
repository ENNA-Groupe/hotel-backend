module.exports = function (sequelize, Sequelize) {
    const User = sequelize.define('user', {
        //cle
        fonctionId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        
        // attributes
        nom: {
            type: Sequelize.STRING,
            allowNull: false
        },
        prenom: {
            type: Sequelize.STRING
            // allowNull defaults to true
        },
        identifiant: {
            type: Sequelize.STRING,
            allowNull: false
        },
        password: {
            type: Sequelize.STRING,
            allowNull: false
        },
        contact: {
            type: Sequelize.STRING,
            allowNull: false
        },
        isAdmin: {
            type: Sequelize.BOOLEAN,
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
    return User;
}

