const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const bad_words = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const public_directory_path = path.join(__dirname, '../public')

app.use(express.static(public_directory_path))


io.on('connection', (socket) => {
    console.log('New web socket connection')
    

    socket.on('join', ({username, room}, callback) => {
        const {error, user} = addUser({id: socket.id, username: username, room: room})

        if(error){
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message',generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new bad_words()

        if(filter.isProfane(message)){
            return callback(generateMessage('Warning: Profanities are not allowed!'))
        }

        io.to(user.room).emit('message', generateMessage(user.username,message))
        callback()
    })

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, location) )
        callback()
    })

    socket.on('disconnect', ()=> {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message',generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log('The server is running on port ' + port)
})