module.exports = function (sequelize, Sequelize) {
    const Table = sequelize.define('table', {
        // attributes
        numero: {
            type: Sequelize.STRING,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT,
        },
        deletedAt: {
            type: Sequelize.DATE,
        }
    }, {
        // options
    });
    return Table;
}