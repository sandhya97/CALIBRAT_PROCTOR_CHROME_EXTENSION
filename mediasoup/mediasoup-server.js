// mediasoup-server.js
const mediasoup = require('mediasoup');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const httpServer = http.createServer(app);
httpServer.keepAliveTimeout = (60 * 100000) + 1000;
httpServer.headersTimeout = (60 * 1000) + 2000;
const io = require('socket.io')(httpServer, {
    cors: { origin: '*' },
    transports: ['polling', 'websocket'], // Set the allowed transports
    allowEIO3: true, // Allow EIO version 3


});
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200'); // Replace with your Angular app's URL
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});

const PORT = process.env.PORT || 3000;

let worker;
let router;

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

(async () => {
    worker = await mediasoup.createWorker();
    router = await worker.createRouter({
        mediaCodecs: [
            {
                kind: 'audio',
                mimeType: 'audio/opus',
                clockRate: 48000,
                channels: 2,
            },
            {
                kind: 'video',
                mimeType: 'video/VP8',
                clockRate: 90000,
                parameters: {
                    'x-google-start-bitrate': 1000,
                },
            },
        ],
    });
})();

io.on('connection', socket => {
    console.log('A user connected');

    socket.on('createProducerTransport', async (data) => {
        try {
            const { transport, params } = await createWebRTCTransport(socket);
            socket.emit('createProducerTransport', { transport, params })

        } catch (error) {
            console.error('Error creating producer transport:', error);
            // Handle the error, possibly by sending an error message to the client
        }
    });

    socket.on('join', async () => {
        console.log('User joined:', socket.id);

        // Notify the new user about existing participants
        for (const participantSocketId of Object.keys(io.sockets.sockets)) {
            if (participantSocketId !== socket.id) {
                socket.emit('user-joined', participantSocketId);
            }
        }

        // Notify existing participants about the new user
        socket.broadcast.emit('user-joined', socket.id);

        // Handle other events, such as ICE candidates, offers, and answers
        // ...
        socket.on('offer', async ({ socketId, offer }) => {
            try {
                // Find the socket associated with the provided socketId
                const targetSocket = io.sockets.sockets[socketId];

                if (targetSocket) {
                    // Emit the offer to the target socket
                    targetSocket.emit('offer', { socketId: socket.id, offer });
                } else {
                    console.error(`Socket with ID ${socketId} not found.`);
                }
            } catch (error) {
                console.error('Error emitting offer:', error);
            }
        });

        socket.on('answer', async ({ socketId, answer }) => {
            try {
              // Find the socket associated with the provided socketId
              const targetSocket = io.sockets.sockets[socketId];
          
              if (targetSocket) {
                // Emit the answer to the target socket
                targetSocket.emit('answer', { socketId: socket.id, answer });
              } else {
                console.error(`Socket with ID ${socketId} not found.`);
              }
            } catch (error) {
              console.error('Error emitting answer:', error);
            }
          });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);

            // Notify other participants about the disconnected user
            socket.broadcast.emit('user-left', socket.id);

            // Clean up resources related to the disconnected user
            // ...
        });
    });
    // Handle other events such as creating a consumer transport, producing, consuming, etc.
});

async function createWebRTCTransport(socket) {
    const transport = await router.createWebRtcTransport({
        listenIps: [{ ip: '0.0.0.0', announcedIp: null }],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
    });

    transport.on('close', () => {
        console.log('Transport closed');
    });

    transport.on('dtlsstatechange', dtlsState => {
        if (dtlsState === 'closed') {
            console.log('Transport closed due to DTLS state change');
        }
    });

    // Other event handlers and logic

    const params = {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
    };

    return { transport, params };
}
