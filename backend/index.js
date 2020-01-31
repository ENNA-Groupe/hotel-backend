const server = require('http').createServer();
const io = require('socket.io')(server);
const Sequelize = require('sequelize');

const sequelize = new Sequelize('hotel', 'root', '', {
    host: '192.168.1.185',
    dialect: 'mysql'
});

//Models
const Fonction = require('./models/fonction.model')(sequelize, Sequelize);
const User = require('./models/user.model')(sequelize, Sequelize);
const Categorie = require('./models/categorie.model')(sequelize, Sequelize);
const Produit = require('./models/produit.model')(sequelize, Sequelize);
const Type = require('./models/type.model')(sequelize, Sequelize);
const Chambre = require('./models/chambre.model')(sequelize, Sequelize);

//fonctions
function dateFormat(date){
    let y = date.getFullYear();
    let m = date.getMonth()+1;
    if (m<10) m = "0"+m;
    let d = date.getDate();

    return y+'-'+m+'-'+d;
}

function heureFormat(date){
    let h = date.getHours();
    let m = date.getMinutes();
    let s = date.getSeconds();

    return h+':'+m+':'+s;
}


//Initialisation sequelize
sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
    sequelize.sync({ force: false }).then(() => {
        // Now the `users` table in the database corresponds to the model definition
        console.log('table created succesfull')
    });
})
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

io.on('connection', socket => {
    socket.on('hello', data => {
        console.log(data);
    });

    /**
     * FONCTION METHODE
     */
    //get All
    socket.on('fonction:all', data => {
        console.log(data);
        Fonction.findAll().then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('fonction:all', res);
        });
    });

    //add item
    socket.on('fonction:add', data => {
        console.log(data);
        Fonction.create(data).then(res => {
            io.emit('fonction:add', res);
        });
    });

    //edit item
    socket.on('fonction:edit', data => {
        Fonction.update(data, {
            where: {
              id: data.id
            }
          }).then(() => {
            io.emit('fonction:edit',data);
          });
    });

    //delete item
    socket.on('fonction:delete', data => {
        console.log(data);
        let now = new Date();
        now = dateFormat(now) + ' ' +heureFormat(now);
        Fonction.update({deletedAt: now}, {
            where: {
              id: data.id
            }
          }).then(() => {
            io.emit('fonction:delete',data);
          });
    });

    //restore item
    socket.on('fonction:restore', data => {
        console.log(data);
        Fonction.update({deletedAt: null}, {
            where: {
              id: data.id
            }
          }).then(() => {
            io.emit('fonction:restore',data);
          });
    });

    
    /**
     * USER METHODS
     */


    socket.on('disconnect', () => {
        console.log('user is gone!')
    });
});

server.listen(3000, () => {
    console.log('server listen on port 3000');
});