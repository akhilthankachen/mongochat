const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;


//connect to mongodb

mongo.connect('mongodb://localhost:27017/mongochat', (err, db) => {
  if(err){
    throw err;
  }
  console.log('mongodb connected ');

  //connect to socket.io
  client.on('connection', function(socket){
    let chat = db.collection('chats');

    //create function to send status
    sendStatus = function(s){
      socket.emit('status',s);
    }

    //get chat from mongo collection
    chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
      if(err){
        throw err;
      }

      //emit the messages
      socket.emit('output',res);
    });

    //handle input events
    socket.on('input',function(data){
      let name = data.name;
      let message = data.message;

      //check for name and message
      if(name == '' || message == ''){
        //send error status
        sendStatus('Please enter a name and message');
      }else{
        //insert message
        chat.insert({name: name, message: message}, function(){
          client.emit('output',[data]);

          //send status object
          sendStatus({
            message: 'message send',
            clear: true
          });
        });
      }
    });

    //Handle clear
    socket.on('clear', function(data){
      //remove all chats from collection
      chat.remove({}, function(){
        //emit cleared
        socket.emit('cleared');
      });
    });
  });
});
