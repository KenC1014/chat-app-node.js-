const socket = io()

//elements
const $message_form = document.querySelector('#message_form')
const $message_form_input = document.querySelector('input')
const $message_form_button = document.querySelector('button')
const $send_location = document.querySelector('#send_location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

//templates
const $messageTemplate = document.querySelector('#message-template').innerHTML
const $locationTemplate = document.querySelector('#location-template').innerHTML
const $errorTemplate = document.querySelector('#error-template').innerHTML
const $sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // Distance scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render($messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('H:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (location_url) => {
    console.log(location_url)
    const html = Mustache.render($locationTemplate, {
        username: location_url.username,
        location_message: location_url.url,
        createdAt: moment(location_url.createdAt).format('H:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render($sidebarTemplate, {
        room: room,
        users: users
    })
    $sidebar.innerHTML = html
})


$message_form.addEventListener('submit' , (e) => {
    e.preventDefault()
    $message_form_button.setAttribute('disabled', 'disabled')
    const message_content = e.target.elements.message

    socket.emit('sendMessage', message_content.value, (error) => {
        $message_form_button.removeAttribute('disabled')
        $message_form_input.value = ''
        $message_form_input.focus()

        if(error){
            const html = Mustache.render($errorTemplate, {
                message: error.text,
                createdAt: moment(error.createdAt).format('H:mm a')
            })
            return $messages.insertAdjacentHTML('beforeend', html)
        }
    })
})



$send_location.addEventListener('click', () => {
    if(! navigator.geolocation){
        return alert('Geolocation is not supported by your browser!')
    }

    $send_location.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            lat: position.coords.latitude,
            long: position.coords.longitude
        }, (error) => {
            $send_location.removeAttribute('disabled')
            if(error){
                return console.log(error)
            }
            console.log('Location shared')
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})
