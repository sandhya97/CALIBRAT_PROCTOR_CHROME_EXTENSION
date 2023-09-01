const express = require('express')
const app = express()
const server = require('http').createServer(app)
server.keepAliveTimeout = (60 * 100000) + 1000;
server.headersTimeout = (60 * 1000) + 2000;
const io = require('socket.io')(server,{
  cors: {origin : '*'},
  transports: ['polling', 'websocket'], // Set the allowed transports
  allowEIO3: true, // Allow EIO version 3
 

});
count=0;
clients=[];


app.use('/', express.static('public'))

// app.get("/",(req,res)=>{
//   res.send("Hello");
//   console.log("hello");
// })
// app.post('/',(req,res)=>{
//   res.send("Hello");
// })

io.on('connection', (socket) => {
  // console.log('user joined'+count++);
  // console.log('socket Id'+socket.id);
  clients.push(socket);
 console.log(clients.length);
  // Handle incoming video streams from the client
  socket.on('stream', (data) => {
    // Broadcast the video stream to all connected clients except the sender
    Object.keys(clients).forEach((clientID) => {
      if (clientID !== socket.id) {
        clients[clientID].emit('stream', data);
      }
    });
  });
  
//   socket.on('join', (roomId) => {
//     console.log("Iside room");
//     const selectedRoom = io.sockets.adapter.rooms[roomId]
//     const numberOfClients = selectedRoom ? selectedRoom.length : 0
//     console.log("numberOfClients"+numberOfClients);
//     // These events are emitted only to the sender socket.
//     if (numberOfClients == 0) {
//       console.log(`Creating room ${roomId} and emitting room_created socket event`)
//       socket.join(roomId)
//       socket.emit('room_created', roomId)
//     } else if (numberOfClients == 1) {
//       console.log(`Joining room ${roomId} and emitting room_joined socket event`)
//       socket.join(roomId)
//       socket.emit('room_joined', roomId)
//     } else {
//       console.log(`Can't join room ${roomId}, emitting full_room socket event`)
//       socket.emit('full_room', roomId)
//     }
//   })

//   // These events are emitted to all the sockets connected to the same room except the sender.
//   socket.on('start_call', (roomId) => {
//     console.log(`Broadcasting start_call event to peers in room ${roomId}`)
//     socket.broadcast.to(roomId).emit('start_call')
//   })
//   socket.on('webrtc_offer', (event) => {
//     console.log(`Broadcasting webrtc_offer event to peers in room ${event.roomId}`)
//    socket.broadcast.emit('webrtc_offer', event.sdp)
//     socket.send(event.sdp);
//   })
//   socket.on('webrtc_answer', (event) => {
//     console.log(`Broadcasting webrtc_answer event to peers in room ${event.roomId}`)
//     socket.broadcast.to(event.roomId).emit('webrtc_answer', event.sdp)
//   })
//   socket.on('webrtc_ice_candidate', (event) => {
//     console.log(`Broadcasting webrtc_ice_candidate event to peers in room ${event.roomId}`)
//     socket.broadcast.to(event.roomId).emit('webrtc_ice_candidate', event)
//   })

 
 })

// START THE SERVER =================================================================
const port = process.env.PORT || 8081

server.listen(port, () => {
  try{
  console.log(`Express server listening on port ${port}`)
  }catch(error){
    console.log(error);
  }
})