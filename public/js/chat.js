const socket = io()

const $messageForm = document.querySelector('form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
//const $sendLocationButton = document.querySelector("#send-location")
const $messages = document.querySelector('#messages')

const $cryptoBtn = document.querySelector('#crypto_btn')
const $keysBtn = document.querySelector('#keys_btn')
const $keysSaveBtn = document.querySelector('#save')

const $cryptoOverlay = document.querySelector('#crypto_overlay')
const $overlayClose = document.querySelector('#crypto_overlay_close')

const $keysOverlay = document.querySelector('#keys_overlay')
const $keysOverlayClose = document.querySelector('#keys_overlay_close')



const messageTemplate = document.querySelector('#message-template').innerHTML
// const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const cryptoType = document.getElementsByClassName('crypto_type')

const keys = {
    ceasar: 12,
    vigenere: 'BİRZAMANLARSOĞUKBİRKIŞ',
    matrix:[[3, 2, 2],
            [0, 1, 0],
            [1, 0, 1]],
    columns: 4
}

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })



const autoscroll = () => {
    const $newMessage = $messages.lastElementChild

    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    //const decryptedMessage = message.username != 'Admin' ? caesarShift(message.text, 19): message.text
    //const decryptedMessage = message.username != 'Admin' ? dePolybius(message.text): message.text
    //const decryptedMessage = message.username != 'Admin' ? deVigenere(message.text, 'BİRZAMANLARSOĞUKBİRKIŞ') : message.text
    const decryptedMessage = message.username != 'Admin' ? Decryption(message.text.message,message.text.encryptionMethods) : message.text
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: decryptedMessage,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

// socket.on('locationMessage', (message) => {
//     console.log(message)
//     const html = Mustache.render(locationMessageTemplate, {
//         username: message.username,
//         url: message.url,
//         createdAt: moment(message.createdAt).format('h:mm a')
//     })
//     $messages.insertAdjacentHTML('beforeend', html)
//     autoscroll()
// })
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html
})
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    var cryptoObj = []
    for(var input of cryptoType){
        if(input.checked)
            cryptoObj.push(input.name)
    }
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value
    //const encryptedMessage = caesarShift(message, 10)
    //const encryptedMessage = Vigenere(message, 'BİRZAMANLARSOĞUKBİRKIŞ')//Polybius(message)
    //const encryptedMessage = cit(message)
    
    const encryptedMessage = Encryption(message,cryptoObj)
    const messageForm = {
        message: encryptedMessage,
        encryptionMethods: cryptoObj
    }
    socket.emit('sendMessage', messageForm, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if (error) {
            return console.log(error)
        }
        console.log('The message was delivered!')
    })
})

// $sendLocationButton.addEventListener('click', () => {
//     if (!navigator.geolocation) {
//         return alert('Geolocation is not supported by your browser.')
//     }

    // $sendLocationButton.setAttribute('disabled', 'disabled')

//     navigator.geolocation.getCurrentPosition((position) => {
//         socket.emit('sendLocation', {
//             latitude: position.coords.latitude,
//             longitude: position.coords.longitude
//         }, () => {
//             $sendLocationButton.removeAttribute('disabled')
//             console.log('Location shared')
//         })
//     })
// })

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})

function Encryption(message, methods){
    var result = message
    if(methods.includes('ceasar'))
        result = caesarShift(result,keys.ceasar%29)
    if(methods.includes('vigenere'))
        result = Vigenere(result,keys.vigenere)
    if(methods.includes('oddeven'))
        result = cit(result)
    if(methods.includes('columns'))
        result = ColumnCrypto(result)
    if(methods.includes('polybius'))
        result = Polybius(result)
    if(methods.includes('nonsingularmatrix'))
        result = MatrixCrypto(result,keys.matrix,methods.includes('polybius')? 1:0)
    return result
}
function Decryption(message, methods){
    var result = message
    if(methods.includes('nonsingularmatrix'))
        result = deMatrixCrypto(result, keys.matrix,methods.includes('polybius')? 1:0)
    if(methods.includes('polybius'))
        result = dePolybius(result)
    if(methods.includes('columns'))
        result = ColumnCrypto(result)
    if(methods.includes('oddeven'))
        result = cit(result)
    if(methods.includes('vigenere'))
        result = deVigenere(result, keys.vigenere)
    if(methods.includes('ceasar'))
        result = caesarShift(result,(29-keys.ceasar)%29)
    
    return result
}
$cryptoBtn.addEventListener('click',()=>{
    $cryptoOverlay.style.display = "block"
})
$overlayClose.addEventListener('click',()=>{
    $cryptoOverlay.style.display = "none"
})

$keysBtn.addEventListener('click',()=>{
    $keysOverlay.style.display = "block"
})
$keysOverlayClose.addEventListener('click',()=>{
    $keysOverlay.style.display = "none"
})
$keysSaveBtn.addEventListener('click',()=>{
    var ceasarKey = document.querySelector('#ceasarkey').value ? document.querySelector('#ceasarkey').value : keys.ceasar
    var vigenereKey = document.querySelector('#vigenerekey').value ? document.querySelector('#vigenerekey').value : keys.vigenere
    var columnsKey = document.querySelector('#columnskey').value ? document.querySelector('#columnskey').value : keys.columns
    var matrixKey = document.querySelector('#matrixkey').getElementsByTagName('input')
    var notNumerical = false
    var detNotOne = false
    var MatrixKeyObj = [[],[],[]]
    var matrixEmpty = false
    if(isNaN(ceasarKey) || isNaN(columnsKey))
        notNumerical = true
    for(var i = 0 ; i < matrixKey.length; i++){    
        MatrixKeyObj[parseInt(i/3)].push(matrixKey[i].value)
        if(isNaN(matrixKey[i].value))
            notNumerical = true

        if(!matrixKey[i].value)
            matrixEmpty = true
    }
    if(matrixEmpty)
        MatrixKeyObj = keys.matrix
    if(detMatrix(MatrixKeyObj) != 1 && detMatrix(MatrixKeyObj) != -1)
        detNotOne = true
    if(notNumerical)
        alert('Ceasar, Columns, Matrix Keys must numrical')
    if(detNotOne)
        alert('Det of Matrix key must be 1 or -1')
    if(!detNotOne && !notNumerical){
        keys.ceasar = ceasarKey
        keys.columns = columnsKey
        keys.matrix = MatrixKeyObj
        keys.vigenere = vigenereKey
        console.log(keys)
        $keysOverlay.style.display = "none"
    }
})

function caesarShift(text, shift) {
    var result = "";
    const capLetters = 'A,B,C,Ç,D,E,F,G,Ğ,H,I,İ,J,K,L,M,N,O,Ö,P,R,S,Ş,T,U,Ü,V,Y,Z'
    const smallLetters = 'a,b,c,ç,d,e,f,g,ğ,h,ı,i,j,k,l,m,n,o,ö,p,r,s,ş,t,u,ü,v,y,z'
    const capLettersArr = capLetters.split(',')
    const smallLettersArr = smallLetters.split(',')
    for (var i = 0; i < text.length; i++) {
        var c = text.charAt(i);
        if (capLetters.includes(c))
            result += capLettersArr[(capLettersArr.indexOf(c) + shift) % 29]
        else if (smallLetters.includes(c))
            result += smallLettersArr[(smallLettersArr.indexOf(c) + shift) % 29]
        else result += c
    }
    return result;
}

function Polybius(message) {
    var result = ''
    const lettersMatrix = [
        ['A', 'B', 'C', 'D', 'E'],
        ['F', 'G', 'Ğ', 'H', 'I'],
        ['J', 'K', 'L', 'M', 'N'],
        ['O', 'P', 'R', 'S', 'Ş'],
        ['T', 'U', 'V', 'Y', 'Z']
    ]
    for (var i = 0; i < message.length; i++) {
        var c = message.charAt(i).toUpperCase()
        c = c == 'Ç' ? 'C' : c
        c = c == 'İ' ? 'I' : c
        c = c == 'Ö' ? 'O' : c
        c = c == 'Ü' ? 'U' : c
        for (var x in lettersMatrix)
            if (lettersMatrix[x].includes(c))
                result += x + lettersMatrix[x].indexOf(c) + ' '
    }
    console.log(result)
    return result
}
function dePolybius(message) {
    var result = ''
    const lettersMatrix = [
        ['A', 'B', 'C', 'D', 'E'],
        ['F', 'G', 'Ğ', 'H', 'I'],
        ['J', 'K', 'L', 'M', 'N'],
        ['O', 'P', 'R', 'S', 'Ş'],
        ['T', 'U', 'V', 'Y', 'Z']
    ]
    for (var i = 0; i < message.length; i += 3) {
        var x = message.charAt(i)
        var y = message.charAt(i + 1)
        result += lettersMatrix[x][y]
    }
    return result
}

function Vigenere(message, key) {
    var result = ''
    const capLetters = 'A,B,C,Ç,D,E,F,G,Ğ,H,I,İ,J,K,L,M,N,O,Ö,P,R,S,Ş,T,U,Ü,V,Y,Z'
    const capLettersArr = capLetters.split(',')
    const lettersMatrix = []
    for (var i = 0; i < capLettersArr.length; i++) {
        var tempArr = [...capLettersArr]
        for (var j = 0; j < i; j++) {
            var shiftedItem = tempArr.shift()
            tempArr.push(shiftedItem)
        }
        lettersMatrix.push(tempArr)
    }
    key = key.toUpperCase().replace(' ', '')
    message = message.toUpperCase()
    for (var i = 0; i < message.length; i++) {
        if(!capLettersArr.includes(message.charAt(i))){
            result += message.charAt(i)
            continue
        }
        var x = capLettersArr.indexOf(key.charAt(i % key.length))
        var y = capLettersArr.indexOf(message.charAt(i))
        result += lettersMatrix[x][y]
    }
    return result
}

function deVigenere(message, key) {
    var result = ''
    const capLetters = 'A,B,C,Ç,D,E,F,G,Ğ,H,I,İ,J,K,L,M,N,O,Ö,P,R,S,Ş,T,U,Ü,V,Y,Z'
    const capLettersArr = capLetters.split(',')
    const lettersMatrix = []
    for (var i = 0; i < capLettersArr.length; i++) {
        var tempArr = [...capLettersArr]
        for (var j = 0; j < i; j++) {
            var shiftedItem = tempArr.shift()
            tempArr.push(shiftedItem)
        }
        lettersMatrix.push(tempArr)
    }
    key = key.toUpperCase().replace(' ', '')
    message = message.toUpperCase()
    for (var i = 0; i < message.length; i++) {
        if(!capLettersArr.includes(message.charAt(i))){
            result += message.charAt(i)
            continue
        }
        var x = capLettersArr.indexOf(key.charAt(i % key.length))
        var y = lettersMatrix[x].indexOf(message.charAt(i))
        result += capLettersArr[y]
    }
    return result
}

function cit(message) {
    var result = ''
    var oddLetters = ''
    var evenLetters = ''
    for (var i = 0; i < message.length; i++) {
        var c = message.charAt(i)
        console.log(c, i)
        if (c == ' ') {
            continue
        }
        if (i % 2 == 0)
            oddLetters += c
        else evenLetters += c
    }
    result = oddLetters + evenLetters
    return result
}

function ColumnCrypto(message) {
    message = message.toUpperCase().replace(" ", "")

}
function MatrixCrypto(message, key, num) {
    
    var letterNumbersArr = num ? message.split(' '): Let2Num(message)
    num ? letterNumbersArr.pop() : letterNumbersArr
    var letterMatrix = Arr2Matrix(letterNumbersArr)
    var cryptedMatrix = MultMatrix(key, letterMatrix)
    return cryptedMatrix
}
function deMatrixCrypto(message, key, num) {
    key = MatrixReverse(key)
    
    var deMatrix = MultMatrix(key,message)
    
    return num ? Matrix2Arr(deMatrix).join(" ") + ' ':Num2Let(Matrix2Arr(deMatrix)) 
}

function detMatrix(matrix) {
    var firstElment = matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1])
    var secondElemnt = matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0])
    var thirdElement = matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0])
    return firstElment - secondElemnt + thirdElement
}

function Let2Num(message) {
    const capLetters = 'A,B,C,Ç,D,E,F,G,Ğ,H,I,İ,J,K,L,M,N,O,Ö,P,R,S,Ş,T,U,Ü,V,Y,Z'
    const capLettersArr = capLetters.split(',')
    var letterArr = []
    for (var i = 0; i < message.length; i++) {
        var c = message.charAt(i).toUpperCase()
        if (capLettersArr.includes(c))
            letterArr.push(capLettersArr.indexOf(c) + 1)
        else letterArr.push(0)
    }
    return letterArr
}
function Num2Let(message) {
    const capLetters = 'A,B,C,Ç,D,E,F,G,Ğ,H,I,İ,J,K,L,M,N,O,Ö,P,R,S,Ş,T,U,Ü,V,Y,Z'
    const capLettersArr = capLetters.split(',')
    var decMessage = ""
    for (var i = 0; i < message.length; i++) {
        decMessage += message[i] == 0 ? ' ' : capLettersArr[message[i] - 1]
    }
    return decMessage
}


function Arr2Matrix(arr) {
    var matrix = []
    var len = arr.length / 3
    var row = []
    for (var i = 0; i < 3; i++) {
        row = []
        for (var j = 0; j < len; j++) {
            if (arr.length)
                row.push(arr.shift())
            else row.push(0)
        }
        matrix.push(row)
    }
    return matrix
}
function Matrix2Arr(matrix) {
    var arr = []
    for (var i = 0; i < matrix.length; i++) {
        for (var j = 0; j < matrix[i].length;) {
                arr.push(matrix[i].shift())
        }
    }
    return arr
}

function MultMatrix(matrix1, matrix2) {
    var result = []
    for (var i = 0; i < matrix1.length; i++) {
        var row = []
        for (var j = 0; j < matrix2[0].length; j++) {
            var element = 0
            for (var k = 0; k < matrix1[0].length; k++) {
                element += matrix2[k][j] * matrix1[i][k]
            }
            row.push(element)
        }
        result.push(row)
    }
    return result
}

function MatrixReverse(M) {
    if(M.length !== M[0].length){return;}
    
    var i=0, ii=0, j=0, dim=M.length, e=0, t=0;
    var I = [], C = [];
    for(i=0; i<dim; i+=1){
        I[I.length]=[];
        C[C.length]=[];
        for(j=0; j<dim; j+=1){
            if(i==j){ I[i][j] = 1; }
            else{ I[i][j] = 0; }
            
            C[i][j] = M[i][j];
        }
    }
    
    for(i=0; i<dim; i+=1){
        e = C[i][i];
        
        if(e==0){
            for(ii=i+1; ii<dim; ii+=1){
                if(C[ii][i] != 0){
                    for(j=0; j<dim; j++){
                        e = C[i][j];       
                        C[i][j] = C[ii][j];
                        C[ii][j] = e;   
                        e = I[i][j];    
                        I[i][j] = I[ii][j];
                        I[ii][j] = e;    
                    }
                    break;
                }
            }
            e = C[i][i];
            if(e==0){return}
        }
        
        for(j=0; j<dim; j++){
            C[i][j] = C[i][j]/e; 
            I[i][j] = I[i][j]/e; 
        }
        for(ii=0; ii<dim; ii++){
            if(ii==i){continue;}
            e = C[ii][i];
            for(j=0; j<dim; j++){
                C[ii][j] -= e*C[i][j];
                I[ii][j] -= e*I[i][j]; 
            }
        }
    }
    for(i=0; i<dim; i++){
        for(j=0; j<dim; j++){
            I[i][j] = Math.round(I[i][j])
        }
    }
    return I;
}