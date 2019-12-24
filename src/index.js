const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { genrateMessage, genrateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUserInRoom, updateUserTime, getUsers} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')
sokets = []
app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    sokets.push(socket)
    console.log('New WebSocket')
    
    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })
        if (error) {
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', genrateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message', genrateMessage('Admin',`${user.username} has joined`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUserInRoom(user.room)
        })
        callback()
        
    })



    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()
        const user = getUser(socket.id)
        updateUserTime(user)
        if (filter.isProfane(message)) {
            return callback('Profinity is not allowed')
        }
        console.log(message)
        io.to(user.room).emit('message', genrateMessage(user.username,message))
        callback()
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', genrateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', genrateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }
    })
    // console.log(sokets)
})

function sleepTwoSec(){
    
    return new Promise(res=>{
        setTimeout(()=>{
        const users = getUsers()
        users.forEach(user=>{
            user.userTime -= 1000
            
            //console.log(user)
            if(user.userTime == 0){
                let socket
                sokets.forEach(soket=>{
                    if(soket.id == user.id)
                        socket = soket
                })
                socket.emit('left')
                const s = removeUser(user.id)
               
                socket.disconnect()
                if (s) {
                    io.to(user.room).emit('message', genrateMessage('Admin',`${user.username} has left!`))
                    io.to(user.room).emit('roomData', {
                        room: user.room,
                        users: getUserInRoom(user.room)
                    })     
                }         
            }
        }) 
        res('s')
        },2000)
    })
}
function chekUsersTimeOut(){
    
    return new Promise(async res => {
        while(true){
        await sleepTwoSec()}  
    })
}
chekUsersTimeOut()
server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})