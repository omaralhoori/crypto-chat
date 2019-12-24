const socket = io()

const $messageForm = document.querySelector('form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
//const $sendLocationButton = document.querySelector("#send-location")
const $messages = document.querySelector('#messages')

const $cryptoBtn = document.querySelector('#crypto_btn')
const $keysBtn = document.querySelector('#keys_btn')
const $keysSaveBtn = document.querySelector('#save')
const $generateRsaBtn = document.querySelector('#generateRSABtn')

const $cryptoOverlay = document.querySelector('#crypto_overlay')
const $overlayClose = document.querySelector('#crypto_overlay_close')

const $keysOverlay = document.querySelector('#keys_overlay')
const $keysOverlayClose = document.querySelector('#keys_overlay_close')



const messageTemplate = document.querySelector('#message-template').innerHTML
// const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const cryptoType = document.getElementsByClassName('crypto_type')

const defultKeys = {
    ceasar: 12,
    vigenere: 'BİRZAMANLARSOĞUKBİRKIŞ',
    matrix:[[3, 2, 2],
            [0, 1, 0],
            [1, 0, 1]],
    RSA:{
        privateKey:29,
        publicKey:{
            e:5,
            n:111
        },
    },
    AES:"HELLOWORLD",
    DES:"DAIMAGUVENLIHAPERLESIN"
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
socket.on('left',()=>{
    alert('Your connection is closed, please reload...')
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
        result = caesarShift(result,defultKeys.ceasar%29)
    if(methods.includes('vigenere'))
        result = Vigenere(result,defultKeys.vigenere)
    if(methods.includes('cit'))
        result = cit(result)
    if(methods.includes('columns'))
        result = Columnar(result)
    if(methods.includes('polybius'))
        result = Polybius(result)
    if(methods.includes('nonsingularmatrix'))
        result = MatrixCrypto(result,defultKeys.matrix,methods.includes('polybius')? 1:0)
    if(methods.includes('DES'))
        result = DESEncryption(result,defultKeys.DES)
    if(methods.includes('RSA'))
        result = RSAEncryption(result,defultKeys.RSA)
    if(methods.includes('AES'))
        result = AESEncryption(result,defultKeys.AES)
    return result
}
function Decryption(message, methods){
    var result = message
    if(methods.includes('nonsingularmatrix'))
        result = deMatrixCrypto(result, defultKeys.matrix,methods.includes('polybius')? 1:0)
    if(methods.includes('polybius'))
        result = dePolybius(result)
    if(methods.includes('columns'))
        result = deColumnar(result)
    if(methods.includes('cit'))
        result = deCit(result)
    if(methods.includes('vigenere'))
        result = deVigenere(result, defultKeys.vigenere)
    if(methods.includes('ceasar'))
        result = caesarShift(result,(29-defultKeys.ceasar)%29)
    if(methods.includes('DES'))
        result = DESDecryption(result,defultKeys.DES)
    if(methods.includes('RSA'))
        result = RSADecryption(result,defultKeys.RSA)
    if(methods.includes('AES'))
        result = AESDecryption(result,defultKeys.AES)
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
    var ceasarKey = document.querySelector('#ceasarkey').value ? document.querySelector('#ceasarkey').value : defultKeys.ceasar
    var vigenereKey = document.querySelector('#vigenerekey').value ? document.querySelector('#vigenerekey').value : defultKeys.vigenere
    var rsaEKey = document.querySelector('#RSAKeyE').value ? document.querySelector('#RSAKeyE').value : defultKeys.RSA.publicKey.e
    var rsaDKey = document.querySelector('#RSAKeyD').value ? document.querySelector('#RSAKeyD').value : defultKeys.RSA.privateKey
    var rsaNKey = document.querySelector('#RSAKeyN').value ? document.querySelector('#RSAKeyN').value : defultKeys.RSA.publicKey.n
    var desKey = document.querySelector('#DESkey').value ? document.querySelector('#DESkey').value : defultKeys.DES
    var aesKey = document.querySelector('#AESkey').value ? document.querySelector('#AESkey').value : defultKeys.AES
    var matrixKey = document.querySelector('#matrixkey').getElementsByTagName('input')
    var notNumerical = false
    var detNotOne = false
    var MatrixKeyObj = [[],[],[]]
    var matrixEmpty = false
    if(isNaN(ceasarKey))
        notNumerical = true
    for(var i = 0 ; i < matrixKey.length; i++){    
        MatrixKeyObj[parseInt(i/3)].push(matrixKey[i].value)
        if(isNaN(matrixKey[i].value))
            notNumerical = true

        if(!matrixKey[i].value)
            matrixEmpty = true
    }
    if(matrixEmpty)
        MatrixKeyObj = defultKeys.matrix
    if(detMatrix(MatrixKeyObj) != 1 && detMatrix(MatrixKeyObj) != -1)
        detNotOne = true
    if(notNumerical)
        alert('Ceasar, Matrix Keys must numrical')
    if(detNotOne)
        alert('Det of Matrix key must be 1 or -1')
    if(!detNotOne && !notNumerical){
        defultKeys.ceasar = ceasarKey
        defultKeys.matrix = MatrixKeyObj
        defultKeys.vigenere = vigenereKey
        defultKeys.AES = aesKey
        defultKeys.DES = desKey
        defultKeys.RSA.publicKey.n = rsaNKey
        defultKeys.RSA.publicKey.e = rsaEKey
        defultKeys.RSA.privateKey = rsaDKey
        console.log(defultKeys)
        $keysOverlay.style.display = "none"
    }
})

$generateRsaBtn.addEventListener('click',()=>{
    var rsaEKey = document.querySelector('#RSAKeyE')
    var rsaDKey = document.querySelector('#RSAKeyD')
    var rsaNKey = document.querySelector('#RSAKeyN')

    var key = generateRSAKey()

    rsaEKey.value = key.publicKey.e
    rsaDKey.value = key.privateKey
    rsaNKey.value = key.publicKey.n

})

//---------------------------------------ENCRYPTION GENERAL METHODS-----------------------------------------------

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
        if (c == ' ') {
            evenLetters += c
            continue
        }
        if (i % 2 == 0)
            oddLetters += c
        else evenLetters += c
    }
    result = oddLetters + evenLetters
    return result
}
function deCit(message){
    let msgLng = message.length
    let oddLng = Math.round(msgLng/2)
    let oddLetters = message.slice(0,oddLng)
    let evenLetters = message.slice(oddLng)
    let result = ''
    var i=0
    for(; i<evenLetters.length;i++)
        result += oddLetters.charAt(i) + evenLetters.charAt(i)
    if(oddLetters.length > evenLetters.length)
        result += oddLetters.charAt(i)
    return result
}

function Columnar(message) {
    message = message.replace(/\s/g, '')
    let msgLng = message.length
    let rowCount = Math.round(msgLng/5)
    let msgMatrix = []
    let result = ''
    if(msgLng % 5 <3 && msgLng % 5> 0 )
        rowCount++
    let k=0
    for(var i=0; i<rowCount; i++){
        let row = []
        for(var j=0; j< 5; j++){
            if(k<msgLng){
                row.push(message.charAt(k))
                k++
            }
            else row.push(String.fromCharCode(Math.random() * (90 - 65) + 65))
        }
        msgMatrix.push(row)
    }
    for(var i in msgMatrix[0]){
        for(var j in msgMatrix){
            result += msgMatrix[j][i]
        }
        result += ' '
    }
    return result
}
function deColumnar(message){
    let msgMatrix = message.split(' ')
    let result = ''
    for(var j in msgMatrix){
        for(var i=0; i<5; i++){
            result += msgMatrix[i].charAt(j)
        }
    }
    return result
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

//--------------------------------------------DES ENCRYPTION-----------------------------------
function decimalToBinary(num){
    let bin = num.toString(2)
    while(bin.length<16){
        bin = '0' + bin
    } 
    // bin = '0b' +bin
    return bin
}
function binaryToDecimal(num){
  num = '0b' + num
  let dec = num | 0b0
  return dec
}
function getChar(num){
  return String.fromCharCode(num)
}
function get64BitBlock(arr){
    const emptyWord = '0000000000000000'
    let block = ''
    for(let i=0; i<4 ; i++){
        block += arr[i]? arr[i] : emptyWord
    }
    return block
}
function getArrOf64BitBlock(msg){
    let blocks = []
    let arr = []
    let temp = []
    for(let i=0; i<msg.length; i++){
        let c = msg.charCodeAt(i)
        temp.push(decimalToBinary(c))
        if(i%4 == 3){
            arr.push(temp)
            temp = []
        }
    }
    if(msg.length%4 != 0)
        arr.push(temp)
    for(let i=0; i<arr.length; i++){
        blocks.push(get64BitBlock(arr[i]))
    }
    return blocks
}
function decimalToBinaryByte(num){
  let bin = num.toString(2)
  while(bin.length<8){
      bin = '0' + bin
  } 
  if(bin.length > 8){
    num = num >> 1
    bin = num.toString(2)
  }
  
  return bin
}
function get64BitBlockKey(arr){
const emptyByte = '00000000'
let block = '0b'
for(let i=0; i<8 ; i++){
        block += arr[i]? arr[i] : emptyByte
    }
return block
}
function findKeys(key){
const arr = []
const keys = []
const perCohTable = [
[57,49,41,33,25,17,9],
[1,58,50,42,34,26,18],
[10,2,59,51,43,35,27],
[19,11,3,60,52,44,36],
[63,55,47,39,31,23,15],
[7,62,54,46,38,30,22],
[14,6,61,53,45,37,29],
[21,13,5,28,20,12,4]
]
const shiftTable = [1,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1]
for(i=0; i<8 &&i<key.length; i++){
var c = key.charCodeAt(i);
arr.push(decimalToBinaryByte(c))
}
var keyBlocks = get64BitBlockKey(arr)

keyBlocks = applyPermutation(perCohTable, keyBlocks)

let keysObj = {
leftKeyBlock : keyBlocks.slice(0,28),
rightKeyBlock : keyBlocks.slice(28,56)
}
for(var i in shiftTable){
keysObj = applyShifTable(shiftTable[i],keysObj)
var roundKey = keysObj.leftKeyBlock.slice(4,28) + keysObj.rightKeyBlock.slice(0,24)
keys.push(roundKey)
}

return keys
}
function applyShifTable(sif, keyObj){
var shiftedLeft = keyObj.leftKeyBlock.split("")
var shiftedRight = keyObj.rightKeyBlock.split("")
for(var i=0; i<sif; i++){            
var shifted = shiftedLeft.shift()
shiftedLeft.push(shifted)
            
shifted = shiftedRight.shift()
shiftedRight.push(shifted)
}
shiftedLeft = shiftedLeft.join("")
shiftedRight = shiftedRight.join("")

return {
leftKeyBlock : shiftedLeft,
rightKeyBlock :shiftedRight
}
}
function applyPermutation(permutation, block){
  let newBlock = ''
  if(block.indexOf('b') > -1){
    block = block.substr(1)
    block = block.substr(1)
  }
  for(var i in permutation){
    for(var j in permutation[i]){
        var c = block.charAt(permutation[i][j]-1) 
        newBlock += c
    }
  }
  return newBlock
}
function DESEncryption(msg,key){

  const permutation = [
    [58,50,42,34,26,18,10,2,60,52,44,36,28,20,12,4],
    [62,54,46,38,30,22,14,6,64,56,48,40,32,24,16,8],
    [57,49,41,33,25,17,9,1,59,51,43,35,27,19,11,3],
    [61,53,45,37,29,21,13,5,63,55,47,39,31,23,15,7]
  ]
  const IPermutation = [
    [40,8,48,16,56,24,64,32,39,7,47,15,55,23,63,31],
    [38,6,46,14,54,22,62,30,37,5,45,13,53,21,61,29],
    [36,4,44,12,52,20,60,28,35,3,43,11,51,19,59,27],
    [34,2,42,10,50,18,58,26,33,1,41,9,49,17,57,25]
  ]
  let msgBinaryBlocks = getArrOf64BitBlock(msg)
  let roundKeys = findKeys(key)
  
  var cipherMsg = []
  for(var i in msgBinaryBlocks){
    msgBinaryBlocks[i] = applyPermutation(permutation, msgBinaryBlocks[i])
    var leftBlock = msgBinaryBlocks[i].slice(0,32)
    var rightBlock = msgBinaryBlocks[i].slice(32,64)

    for(var j in roundKeys){
      var temp = leftBlock
      leftBlock = rightBlock
      rightBlock = xor(temp, rightBlockFunction(rightBlock, roundKeys[j]))
         
    }
    var concatent =  rightBlock + leftBlock
    
    concatent = applyPermutation(IPermutation, concatent)
    cipherMsg.push(concatent)
    // var firstChar = concatent.slice(0,16)
    // var secondChar = concatent.slice(16,32)
    // var thirdChar = concatent.slice(32,48)
    // var fourthChar = concatent.slice(48,64)
    // cipherMsg += getChar(binaryToDecimal(firstChar))
    // cipherMsg += getChar(binaryToDecimal(secondChar))
    // cipherMsg += getChar(binaryToDecimal(thirdChar))
    // cipherMsg += getChar(binaryToDecimal(fourthChar))
    // console.log(cipherMsg)
  }
  
  return cipherMsg
}
function DESDecryption(msg,key){
    console.log(msg,key)
  const permutation = [
    [58,50,42,34,26,18,10,2,60,52,44,36,28,20,12,4],
    [62,54,46,38,30,22,14,6,64,56,48,40,32,24,16,8],
    [57,49,41,33,25,17,9,1,59,51,43,35,27,19,11,3],
    [61,53,45,37,29,21,13,5,63,55,47,39,31,23,15,7]
  ]
  const IPermutation = [
    [40,8,48,16,56,24,64,32,39,7,47,15,55,23,63,31],
    [38,6,46,14,54,22,62,30,37,5,45,13,53,21,61,29],
    [36,4,44,12,52,20,60,28,35,3,43,11,51,19,59,27],
    [34,2,42,10,50,18,58,26,33,1,41,9,49,17,57,25]
  ]
  let msgBinaryBlocks = msg//getArrOf64BitBlock(msg)
  let roundKeys = findKeys(key)
  var plainMsg = ''
  for(var i in msgBinaryBlocks){
    msgBinaryBlocks[i] = applyPermutation(permutation, msgBinaryBlocks[i])
    var rightBlock = msgBinaryBlocks[i].slice(0,32)
    var leftBlock = msgBinaryBlocks[i].slice(32,64)

    for(var j =roundKeys.length - 1;j >= 0;j--){
      var temp = rightBlock
      rightBlock = leftBlock
      leftBlock = xor(temp, rightBlockFunction(rightBlock, roundKeys[j]))
         
    }
    var concatent =  leftBlock + rightBlock
    concatent = applyPermutation(IPermutation, concatent)
    
    var firstChar = concatent.slice(0,16)
    var secondChar = concatent.slice(16,32)
    var thirdChar = concatent.slice(32,48)
    var fourthChar = concatent.slice(48,64)

    plainMsg += getChar(binaryToDecimal(firstChar))
    plainMsg += getChar(binaryToDecimal(secondChar))
    plainMsg += getChar(binaryToDecimal(thirdChar))
    plainMsg += getChar(binaryToDecimal(fourthChar))
       
  }
  if(plainMsg.indexOf("\u0000")>-1){
    let s =plainMsg.indexOf("\u0000")
    plainMsg = plainMsg.slice(0,s)
  }
  return plainMsg
}
function rightBlockFunction(R,K){
  const ebox = [
    [32,1,2,3,4,5,4,5,6,7,8,9],
    [8,9,10,11,12,13,12,13,14,15,16,17],
    [16,17,18,19,20,21,20,21,22,23,24,25],
    [24,25,26,27,28,29,28,29,30,31,32,1]
  ]
  const permutation = [
    [16,7,20,21,29,12,28,7,1,15,23,26,5,18,31,10],
    [2,8,24,14,32,27,3,9,19,13,30,6,22,11,4,25]]
  
  var extendedR = applyPermutation(ebox, R)
  var RK = xor(extendedR,K)
  var strictR = applySBoxes(RK)

  return applyPermutation(permutation, strictR)

}
function applySBoxes(msg){
  const sboxes = [[
    [14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7],
    [0,15,7,4,14,2,13,1,10,6,12,11,9,5,3,8],
    [4,1,14,8,13,6,2,11,15,12,9,7,3,10,5,0],
    [15,12,8,2,4,9,1,7,5,11,3,14,10,0,6,13]
  ],[
    [15,1,8,14,6,11,3,4,9,7,2,13,12,0,5,10],
    [3,13,4,7,15,2,8,14,12,0,1,10,6,9,11,5],
    [0,14,7,11,10,4,13,1,5,8,12,6,9,3,2,15],
    [13,8,10,1,3,15,4,2,11,6,7,12,0,5,14,9]
  ],[
    [10,0,9,14,6,3,15,5,1,13,12,7,11,4,2,8],
    [13,7,0,9,3,4,6,10,2,8,5,14,12,11,15,1],
    [13,6,4,9,8,15,3,0,11,1,2,12,5,10,14,7],
    [1,10,13,0,6,9,8,7,4,15,14,3,11,5,2,12]
  ],[
    [7,13,14,3,0,6,9,10,1,2,8,5,11,12,4,15],
    [13,8,11,5,6,15,0,3,4,7,2,12,1,10,14,9],
    [10,6,9,0,12,11,7,13,15,1,3,14,5,2,8,4],
    [3,15,0,6,10,1,13,8,9,4,5,11,12,7,2,14]
  ],[
    [2,12,4,1,7,10,11,6,8,5,3,15,13,0,14,9],
    [14,11,2,12,4,7,13,1,5,0,15,10,3,9,8,6],
    [4,2,1,11,10,13,7,8,15,9,12,5,6,3,0,14],
    [11,8,12,7,1,14,2,13,6,15,0,9,10,4,5,3]
  ],[
    [12,1,10,15,9,2,6,8,0,13,3,4,14,7,5,11],
    [10,15,4,2,7,12,9,5,6,1,13,14,0,11,3,8],
    [9,14,15,5,2,8,12,3,7,0,4,10,1,13,11,6],
    [4,3,2,12,9,5,15,10,11,14,1,7,6,0,8,13]
  ],[
    [4,11,2,14,15,0,8,13,3,12,9,7,5,10,6,1],
    [13,0,11,7,4,9,1,10,14,3,5,12,2,15,8,6],
    [1,4,11,13,12,3,7,14,10,15,6,8,0,5,9,2],
    [6,11,13,8,1,4,10,7,9,5,0,15,14,2,3,12]
  ],[
    [13,2,8,4,6,15,11,1,10,9,3,14,5,0,12,7],
    [1,15,13,8,10,3,7,4,12,5,6,11,0,14,9,2],
    [7,11,4,1,9,12,14,2,0,6,10,13,15,3,5,8],
    [2,1,14,7,4,10,8,13,15,12,9,0,3,5,6,11]
  ]]
  
  var msgPart = [
    msg.slice(0,6),
    msg.slice(6,12),
    msg.slice(12,18),
    msg.slice(18,24),
    msg.slice(24,30),
    msg.slice(30,36),
    msg.slice(36,42),
    msg.slice(42,48)
  ]
  var newMsg = ''
  for(var i =0; i<sboxes.length; i++){
    var column = ('0b'+ msgPart[i].slice(1,5)) | 0b0
    var row = ('0b'+ msgPart[i].slice(0,1) + msgPart[i].slice(5,6)) | 0b0
    var newBlock = (sboxes[i][row][column]).toString(2)
    while(newBlock.length<4)
      newBlock = '0' + newBlock
    newMsg +=  newBlock
  }
  return newMsg
}
function xor(num1,num2){
  if(num1.length != num2.length)
    return
  let result = ''
  for(var i=0; i<num1.length; i++){
    let b = num1.charAt(i)
    let c = num2.charAt(i)
    if(c == b)
      result += '0'
    else
      result += '1'
  }
  return result
}


//---------------------------RSA ENCRYPTION------------------------------------------------
function RSAEncryption(msg,key){
    let numMsg = ''
    let numMsgArr = []
    let cipherMsg = ''
    for(var i=0;i<msg.length; i++){
      var c = msg.charCodeAt(i).toString()
      while(c.length<3){
        c = '0'+c
      }
      numMsg += c
    }
    for(var i=0;i<numMsg.length;){
      var tempArr = ''

      for(var j=0; j< key.publicKey.n.toString().length - 1;j++){
        var c = numMsg.charAt(i)
        tempArr += c
        i++
      }
      while(tempArr.length < key.publicKey.n.toString().length - 1){
        tempArr += '0'
      }
      numMsgArr.push(tempArr)
    }
    for(var i in numMsgArr){
      var cipherChar = modPower(numMsgArr[i],key.publicKey.e, key.publicKey.n)
      while(cipherChar.toString().length < key.publicKey.n.toString().length)
        cipherChar = '0' + cipherChar
      cipherMsg+= cipherChar
    }
    return cipherMsg
  }
function getRandomNum(){
return Math.round(Math.random() * Math.pow(10,2))
}
function generateRandomNum(max,min){
var val = Math.random()

while(val < max){
    val *= 10
}
val /= 10
return Math.round(val)
}
function isPrime(num) {
for ( var i = 2; i < num; i++ ) {
    if ( num % i === 0 ) {
        return false;
    }
}
return true;
}
function generateRSAKey(){
const p = getRandomPrime()
const q = getRandomPrime()
const n = p * q
const fi = (q-1) * (p-1)
let temp = generateRandomNum(fi)
while(gcd(fi,temp)!=1){
    temp = generateRandomNum(fi)
}
const e = temp
temp = generateRandomNum(fi)
while(mod(e*temp,fi)!=1){
    temp = generateRandomNum(fi)
}
const d = temp
return {
    publicKey:{
    n,e
    },
    privateKey: d
}

}
function mod(num1,num2){
return num1 % num2
}
function modPower(num,pow,mod){
if(pow <= 2){
    return Math.pow(num,pow) % mod
}
var left = Math.round(pow / 2)
var right = Math.round(pow / 2)

if(pow % 2 > 0){
    left--
}
var x1 = modPower(num,left,mod)
var x2 = modPower(num,right, mod)
return (x1 * x2 ) % mod
}
function gcd(num1,num2){
if(num1 < num2) return gcd(num2,num1)
if((num1 % num2)===0) return num2
return gcd(num2, num1%num2)
}
function getRandomPrime(){
var x = getRandomNum()
while(!isPrime(x)){
    x = getRandomNum()
}
return x
}
function RSADecryption(msg,key){
const lcipher = key.publicKey.n.toString().length
const lclear = lcipher - 1
let msgArr = []
let msgPlainNum = ''
let plainMsg = ''
for(var i=0; i<msg.length;)
    { var temp = ''
    for(var j=0;j<lcipher;j++){
        var c = msg.charAt(i)
        temp += c
        i++
    }
    msgArr.push(temp)
    }
msgArr.forEach( e=>{
    var p = modPower(e,key.privateKey,key.publicKey.n)
    while(p.toString().length < lclear){
    p = '0' + p
    }
    msgPlainNum += p
})
for(var i=0;i<msgPlainNum.length;){
    var char = ''
    for(var j=0; j<3;j++){
    char += msgPlainNum.charAt(i)
    i++
    }
    plainMsg += String.fromCharCode(char)
}
if(plainMsg.indexOf("\u0000")>-1){
    let s =plainMsg.indexOf("\u0000")
    plainMsg = plainMsg.slice(0,s)
}
return plainMsg
}

//------------------------------------AES ENCRYPTION -------------------------------------------------


function AESEncryption(msg,key){
    var temp =''
    var stateBlocks = []
    var roundKeys = findAESRoundKeys(key)
    for(var i=0; i<msg.length; i++){
      temp += msg.charAt(i)
      if ( i%16 == 15){
        stateBlocks.push(stringToHexMatrix(temp))
        temp = ''
      }
    }
    if(msg.length % 16 != 0){
      stateBlocks.push(stringToHexMatrix(temp))
    }
    var cipherMsgBloks = []
    for(var i in stateBlocks){
        var cipherMsg = [...addRoundKey(stateBlocks[i],roundKeys[1])]
        for(var j=2;j<roundKeys.length - 1;j++){
            shiftRows(cipherMsg)
            cipherMsg = subByteTable(cipherMsg)
            cipherMsg = mixColumn(cipherMsg)
            cipherMsg = addRoundKey(cipherMsg,roundKeys[j])
        }

        shiftRows(cipherMsg)
        cipherMsg = subByteTable(cipherMsg)
        cipherMsg = addRoundKey(cipherMsg,roundKeys[roundKeys.length - 1])
        cipherMsgBloks.push(cipherMsg)
    }
    return cipherMsgBloks
  }
function AESDecryption(msgBlocks,key){
  var plainMsg = ''
  var roundKeys = findAESRoundKeys(key)
  for(var i in msgBlocks){
    var tempMsg = msgBlocks[i]
    
    tempMsg = addRoundKey(tempMsg,roundKeys[roundKeys.length - 1])
     tempMsg = subByteTable(tempMsg,1)
     shiftRows(tempMsg,1)
    for(var j=roundKeys.length - 2;j>1;j--){
      tempMsg = addRoundKey(tempMsg,roundKeys[j])
       tempMsg = mixColumn(tempMsg,1)
       tempMsg = subByteTable(tempMsg,1)
       shiftRows(tempMsg,1)
    }
    
    tempMsg = addRoundKey(tempMsg,roundKeys[1])
    for(var l in tempMsg){
      for(var k in tempMsg[l]){ 
        plainMsg += String.fromCharCode(toDec(tempMsg[l][k]) * 1)
      }
    }
  }
  if(plainMsg.indexOf("\u0000")>-1){
                let s =plainMsg.indexOf("\u0000")
                plainMsg = plainMsg.slice(0,s)
              }
  return plainMsg
}
function findAESRoundKeys(key){
var roundKeys = []
var w0 = stringToHexMatrix(key)
// w0 = [
//     ['2b','28','ab','09'],
//     ['7e','ae','f7','cf'],
//     ['15','d2','15','4f'],
//     ['16','a6','88','3c']
// ]
pushMatrix(roundKeys,w0)
var j=0

for(var i=3 ;i < 10 * 4 + 3;i++){

    if(i % 4 == 3){
        var wi = firstWord(roundKeys[i],roundKeys[i-3],j)
        j++
    }else{
        var wi = xorTwoWords(roundKeys[i],roundKeys[i-3])
    }
       roundKeys.push(wi)
}
var roundKeysBlocks = []
for(var i=0 ;i< roundKeys.length;){
    var key = []
    for(var j= 0;j<4;j++){
        key.push(roundKeys[i])
        i++
    }
    roundKeysBlocks.push(key)
}
return roundKeysBlocks
}
function firstWord(w,w0,r){
    sh = shiftWord(w)
    sb = subByteWord(sh)
    re = Recon(sb,r)
    newWord = xorTwoWords(w0,re)
    return newWord
}
function pushMatrix(matrix,supMatrix){
    for( var i in supMatrix){
        var col = getColumn(supMatrix,i)
        matrix.push(col)
    }
    return matrix
}
function addRoundKey(state,key){
    var mystate = []
    for(var i = 0 ;i< state.length;i++ ){
        var cc = []
        for(var j = 0 ;j< state[i].length;j++ ){
            var c = ((('0x'+ state[i][j]) | 0x0) ^ (('0x'+ key[i][j]) | 0x0)).toString(16).toUpperCase()
            if(c.length<2)c='0'+c
            cc.push(c)
        }
        mystate.push(cc)
    }


    return mystate
}
function shiftRows(state,d=0){
  var result = []
    if(d==0)
        for(var i in state){
          var temp = [...state[i]]
          for(var j=0;j<i;j++){
            temp.push(temp.shift())
          }
          result.push(temp)
    }
    else 
        for(var i in state){
          var temp = [...state[i]]
          for(var j=0;j<i;j++){
          var poped = temp.pop()
          temp.unshift(poped)
        }
        result.push(temp)
    }
    return result
}
function mixColumn(state,d=0){
    const mixMatrixR = [
        ['02','03','01','01'],
        ['01','02','03','01'],
        ['01','01','02','03'],
        ['03','01','01','02'],
    ]
    const iMixMatrix = [
        ['0E','0B','0D','09'],
        ['09','0E','0B','0D'],
        ['0D','09','0E','0B'],
        ['0B','0D','09','0E'],
    ]
    var mixMatrix = d==0? mixMatrixR : iMixMatrix
    var newState = []
    for(var i in mixMatrix){
        var row = []
        for(var j in mixMatrix[i]){  
            
            var el = multipalHexRow(getColumn(state,j),mixMatrix[i])
            row.push(el)
        }
        newState.push(row)
    }
    
    return newState

}
function getColumn(matrix,j){
    var col = []
    for(var i in matrix){
        col.push(matrix[i][j])
    }
    return col
}
function multipalHexRow(col,row){
    results=[]
    for(var i = 0 ; i<4; i++){
        results.push(multipalHex(col[i],row[i]))
    }

     var result1 = xor(hexToBinary(results[0]),hexToBinary(results[1]))
     
     var result2 = xor(hexToBinary(results[2]),hexToBinary(results[3]))
    
     var result = xor(result1,result2)
     
    result = (('0b' +result) | 0b0).toString(16)
    if(result.length < 2)
        result = '0' + result
     return result.toUpperCase()
}
function stringToHexMatrix(msg){
msg = switchCharcter(msg)
var msgMatrix = []
var k=0
for(var i=0; i<4; i++){
    var row =[]
    for(var j=0; j<4; j++){
    var c = "00"
    if(k<msg.length){
        c= msg.charCodeAt(k).toString(16)
        if(c.length < 2){
        c = "0" + c
        }
        k++
    }
    row.push(c)
    }
    msgMatrix.push(row)
}
return msgMatrix
}
function switchCharcter(msg){
const switechedChars = ['ş','Ş','ı','İ','ç','Ç','ö','Ö','ü','Ü','Ğ','ğ']
var newMsg = ''
for(var i=0;i<msg.length;i++){
    var c = msg.charAt(i)
    if(switechedChars.includes(c))
    c = switchCase(c)
    newMsg += c
}
function switchCase(c){
    switch (c){
    case 'ş': return 's';
    case 'Ş': return 'S';
    case 'ı': return 'i';
    case 'İ': return 'I';
    case 'ç': return 'c';
    case 'Ç': return 'C';
    case 'ö': return 'o';
    case 'Ö': return 'O';
    case 'ü': return 'u';
    case 'Ü': return 'U';
    case 'Ğ': return 'G';
    case 'ğ': return 'g';
    default : break;
    }
    return c
}
return newMsg
}
function subByteTable(num,d=0){
  // console.log(num)
const invSTable = [
    ['52','09','6A','D5','30','36','A5','38','BF','40','A3','9E','81','F3','D7','FB'],
    ['7C','E3','39','82','9B','2F','FF','87','34','8E','43','44','C4','DE','E9','CB'],
    ['54','7B','94','32','A6','C2','23','3D','EE','4C','95','0B','42','FA','C3','4E'],
    ['08','2E','A1','66','28','D9','24','B2','76','5B','A2','49','6D','8B','D1','25'],
    ['72','F8','F6','64','86','68','98','16','D4','A4','5C','CC','5D','65','B6','92'],
    ['6C','70','48','50','FD','ED','B9','DA','5E','15','46','57','A7','8D','9D','84'],
    ['90','D8','AB','00','8C','BC','D3','0A','F7','E4','58','05','B8','B3','45','06'],
    ['D0','2C','1E','8F','CA','3F','0F','02','C1','AF','BD','03','01','13','8A','6B'],
    ['3A','91','11','41','4F','67','DC','EA','97','F2','CF','CE','F0','B4','E6','73'],
    ['96','AC','74','22','E7','AD','35','85','E2','F9','37','E8','1C','75','DF','6E'],
    ['47','F1','1A','71','1D','29','C5','89','6F','B7','62','0E','AA','18','BE','1B'],
    ['FC','56','3E','4B','C6','D2','79','20','9A','DB','C0','FE','78','CD','5A','F4'],
    ['1F','DD','A8','33','88','07','C7','31','B1','12','10','59','27','80','EC','5F'],
    ['60','51','7F','A9','19','B5','4A','0D','2D','E5','7A','9F','93','C9','9C','EF'],
    ['A0','E0','3B','4D','AE','2A','F5','B0','C8','EB','BB','3C','83','53','99','61'],
    ['17','2B','04','7E','BA','77','D6','26','E1','69','14','63','55','21','0C','7D']
]

const sTableR = [
      ['63', '7c', '77', '7b', 'f2', '6b', '6f', 'c5', '30', '01', '67', '2b', 'fe', 'd7', 'ab', '76'],
      ['ca', '82', 'c9', '7d', 'fa', '59', '47', 'f0', 'ad', 'd4', 'a2', 'af', '9c', 'a4', '72', 'c0'],
      ['b7', 'fd', '93', '26', '36', '3f', 'f7', 'cc', '34', 'a5', 'e5', 'f1', '71', 'd8', '31', '15'],
      ['04', 'c7', '23', 'c3', '18', '96', '05', '9a', '07', '12', '80', 'e2', 'eb', '27', 'b2', '75'], 
      ['09', '83', '2c', '1a', '1b', '6e', '5a', 'a0', '52', '3b', 'd6', 'b3', '29', 'e3', '2f', '84'], 
      ['53', 'd1', '00', 'ed', '20', 'fc', 'b1', '5b', '6a', 'cb', 'be', '39', '4a', '4c', '58', 'cf'],
      ['d0', 'ef', 'aa', 'fb', '43', '4d', '33', '85', '45', 'f9', '02', '7f', '50', '3c', '9f', 'a8'], 
      ['51', 'a3', '40', '8f', '92', '9d', '38', 'f5', 'bc', 'b6', 'da', '21', '10', 'ff', 'f3', 'd2'],
      ['cd', '0c', '13', 'ec', '5f', '97', '44', '17', 'c4', 'a7', '7e', '3d', '64', '5d', '19', '73'],
      ['60', '81', '4f', 'dc', '22', '2a', '90', '88', '46', 'ee', 'b8', '14', 'de', '5e', '0b', 'db'], 
      ['e0', '32', '3a', '0a', '49', '06', '24', '5c', 'c2', 'd3', 'ac', '62', '91', '95', 'e4', '79'], 
      ['e7', 'c8', '37', '6d', '8d', 'd5', '4e', 'a9', '6c', '56', 'f4', 'ea', '65', '7a', 'ae', '08'],
      ['ba', '78', '25', '2e', '1c', 'a6', 'b4', 'c6', 'e8', 'dd', '74', '1f', '4b', 'bd', '8b', '8a'], 
      ['70', '3e', 'b5', '66', '48', '03', 'f6', '0e', '61', '35', '57', 'b9', '86', 'c1', '1d', '9e'],
      ['e1', 'f8', '98', '11', '69', 'd9', '8e', '94', '9b', '1e', '87', 'e9', 'ce', '55', '28', 'df'],
      ['8c', 'a1', '89', '0d', 'bf', 'e6', '42', '68', '41', '99', '2d', '0f', 'b0', '54', 'bb', '16']
]

const sTable = d == 0 ? sTableR: invSTable             
var newMatrix = []
for(var i =0; i < num.length; i++){
    var row = []
    for(var j=0; j<num[i].length; j++){
        var r = ('0x'+ num[i][j].charAt(0)) | 0x0
        var c = ('0x'+ num[i][j].charAt(1)) | 0x0
        row.push(sTable[r][c])
    }
    newMatrix.push(row)
}
return newMatrix
}
function inversTable(table){
let iTable= []
for(var i =0; i < table.length; i++){
    var row = []
    for(var j=0; j<table[i].length; j++){
    row.push(findTableItem(toHex(i,j),table))
    }
    iTable.push(row)
    
}
return iTable
}
function findTableItem(item,table){
for(var i =0; i < table.length; i++){
    for(var j=0; j<table[i].length; j++){
    if(item.toUpperCase() == table[i][j].toUpperCase())
        return toHex(i,j)
    }
}
}
function hexToBinary(num,len=8){
num = "0x" + num 
num = num | 0x0
num = num.toString(2)
while(num.length < len)
    num = '0'+num
return num
}
function toHex(num1,num2=''){
num1 = (num1).toString(16)
num2 = (num2).toString(16)
return (num1 + '' + num2).toUpperCase() 
}
function toDec(num){
    return (('0x' + num ) * 1).toString(10)
}
function addTwoHex(num1,num2){
    num1 = ('0x' + num1) * 1
    num2 = ('0x' + num2) * 1
    var result = num1 + num2
    if(result > 255)
        result = result - 255
    return result.toString(16)
}
function convertHexToIndex(num){
    if(num.length < 2) num = '0'+ num
    var r = toDec(num.charAt(0))
    var c = toDec(num.charAt(1))
    return {r,c}
}
function shiftWord(word){
    var newWord = [...word]
    var shifted = newWord.shift()
    newWord.push(shifted)
    return newWord
}
function Recon(word,round){
    const recon = [
        ['01','00','00','00'],
        ['02','00','00','00'],
        ['04','00','00','00'],
        ['08','00','00','00'],
        ['10','00','00','00'],
        ['20','00','00','00'],
        ['40','00','00','00'],
        ['80','00','00','00'],
        ['1B','00','00','00'],
        ['36','00','00','00'],
    ]
    return xorTwoWords(word, recon[round])
}
function subByteWord(word){
    var newMat = [word]
    var sWordMat = subByteTable(newMat)
    return sWordMat[0]
}
function xorTwoWords(word1,word2){
    var result = []
    for(var i in word1){
        var c =xor(hexToBinary(word1[i]),hexToBinary(word2[i]))
        c = binaryToDecimal(c).toString(16)
        if(c.length< 2)
            c = '0' + c
        result.push(c)
    }
    return result
}
function multipalHex(num,num2){
  num = ('0x'+num) | 0x0
  num= num.toString(2)
  num2 = ('0x'+num2) | 0x0
  num2= num2.toString(2)
  
  poly = []
  poly2 = []
  for(var i=0; i<num.length; i++){
    j=num.length - i-1
    var c = num.charAt(i)
    if(c == '1')poly.push( j)
    }
    for(var i=0; i<num2.length; i++){
    j=num2.length - i-1
    var c = num2.charAt(i)
    if(c == '1')poly2.push(j)
    }

    result = []
    for (var i in poly){
      for (var j in poly2){
        var t = poly[i] + poly2[j]
        x =result.indexOf(t)
        if(x >-1){
          result.splice(x,1)
        }
        else
          result.push(t)
      }
    }
    
    binaryResult =''
    for(var i=result[0]; i >= 0 ;i--){
      if(result.includes(i)){
        binaryResult += '1'
      }else binaryResult += '0'
    }
    const mod11b = 0b100011011 
    while(binaryResult.length > 8){
      firstDigets = binaryResult.slice(0,9)
      remain = binaryResult.slice(9)
      firstDigets =  (('0b'+firstDigets)^ mod11b).toString(2)
      binaryResult = firstDigets + remain
      while(c=binaryResult.charAt(0) != '1'){
        binaryResult = binaryResult.slice(1)
      }
    }

    hexResult = (('0b' + binaryResult) | 0b0).toString(16)
    while(hexResult.length < 2){
      hexResult = '0' + hexResult
    }
    return  hexResult
}
        





// function AESEncryption(msg,key){
//     var temp =''
//     var stateBlocks = []
//     var roundKeys = findAESRoundKeys(key)
//     for(var i=0; i<msg.length; i++){
//       temp += msg.charAt(i)
//       if ( i%16 == 15){
//         stateBlocks.push(stringToHexMatrix(temp))
//         temp = ''
//       }
//     }
//     if(msg.length % 16 != 0){
//       stateBlocks.push(stringToHexMatrix(temp))
//     }
//     var cipherMsgBloks = []
//     for(var i in stateBlocks){
//         var cipherMsg = addRoundKey(stateBlocks[i],roundKeys[1])
        
//         for(var j=2;j<roundKeys.length - 1;j++){

//             cipherMsg = shiftRows(cipherMsg)

//             cipherMsg = subByteTable(cipherMsg)

//             cipherMsg = addRoundKey(cipherMsg,roundKeys[j])
//         }
//         cipherMsg = shiftRows(cipherMsg)
//         cipherMsg = subByteTable(cipherMsg)
//         cipherMsg = addRoundKey(cipherMsg,roundKeys[roundKeys.length - 1])
//         cipherMsgBloks.push(cipherMsg)
//     }
//     return cipherMsgBloks
//   }
// function AESDecryption(msg,key){

// }
// function findAESRoundKeys(key){
// var roundKeys = []
// var w0 = stringToHexMatrix(key)
// // w0 = [
// //     ['2b','28','ab','09'],
// //     ['7e','ae','f7','cf'],
// //     ['15','d2','15','4f'],
// //     ['16','a6','88','3c']
// // ]
// pushMatrix(roundKeys,w0)
// var j=0

// for(var i=3 ;i < 10 * 4 + 3;i++){

//     if(i % 4 == 3){
//         var wi = firstWord(roundKeys[i],roundKeys[i-3],j)
//         j++
//     }else{
//         var wi = xorTwoWords(roundKeys[i],roundKeys[i-3])
//     }
//        roundKeys.push(wi)
// }
// var roundKeysBlocks = []
// for(var i=0 ;i< roundKeys.length;){
//     var key = []
//     for(var j= 0;j<4;j++){
//         key.push(roundKeys[i])
//         i++
//     }
//     roundKeysBlocks.push(key)
// }
// return roundKeysBlocks
// }
// function firstWord(w,w0,r){
//     sh = shiftWord(w)
//     sb = subByteWord(sh)
//     re = Recon(sb,r)
//     newWord = xorTwoWords(w0,re)
//     return newWord
// }
// function pushMatrix(matrix,supMatrix){
//     for( var i in supMatrix){
//         var col = getColumn(supMatrix,i)
//         matrix.push(col)
//     }
//     return matrix
// }
// function addRoundKey(state,key){
//     var mystate = []
//     for(var i = 0 ;i< state.length;i++ ){
//         var cc = []
//         for(var j = 0 ;j< state[i].length;j++ ){
//             var c = 'cc'//((('0x'+ state[i][j]) | 0x0) ^ (('0x'+ key[i][j]) | 0x0)).toString(16).toUpperCase()
//             cc.push(c)
//         }
        
//         //newState[i] = row
//         mystate.push(cc)
//     }
  
//     mystate = [
//         ['02','03','01','01'],
//         ['01','02','03','01'],
//         ['01','01','02','03'],
//         ['03','01','01','02'],
//     ]
//     console.log(mystate)
//     return mystate
// }
// function shiftRows(state,d=0){
    
//     if(d==0)
//         for(var i in state){
//         for(var j=0;j<i;j++){
//         var shifted = state[i].shift()
//         state.push(shifted)
//         }
//     }
//     else 
//         for(var i in state){
//         for(var j=0;j<i;j++){
//         var poped = state[i].pop()
//         state.unshift(poped)
//         }
//     }
//     return state
// }
// function mixColumn(state,d=0){
//     const mixMatrixR = [
//         ['02','03','01','01'],
//         ['01','02','03','01'],
//         ['01','01','02','03'],
//         ['03','01','01','02'],
//     ]
//     const iMixMatrix = [
//         ['0E','0B','0D','09'],
//         ['09','0E','0B','0D'],
//         ['0D','09','0E','0B'],
//         ['0B','0D','09','0E'],
//     ]
//     var mixMatrix = d==0? mixMatrixR : iMixMatrix
//     var newState = []
//     for(var i in mixMatrix){
//         var row = []
//         for(var j in mixMatrix[i]){  
            
//             var el = multipalHexRow(getColumn(state,j),mixMatrix[i])
//             row.push(el)
//         }
//         newState.push(row)
//     }
    
//     return newState

// }
// function getColumn(matrix,j){
//     var col = []
//     for(var i in matrix){
//         col.push(matrix[i][j])
//     }
//     return col
// }
// function multipalHexRow(col,row){
//     results=[]
//     for(var i = 0 ; i<4; i++){
//         results.push(multipalHex(col[i],row[i]))
//     }

//      var result1 = xor(hexToBinary(results[0]),hexToBinary(results[1]))
     
//      var result2 = xor(hexToBinary(results[2]),hexToBinary(results[3]))
    
//      var result = xor(result1,result2)
     
//     result = (('0b' +result) | 0b0).toString(16)
//     if(result.length < 2)
//         result = '0' + result
//      return result.toUpperCase()
// }
// function multipalHex(num,num2){
//     num = ('0x'+num) | 0x0
//     num= num.toString(2)
//     num2 = ('0x'+num2) | 0x0
//     num2= num2.toString(2)
    
//     poly = []
//     poly2 = []
//     for(var i=0; i<num.length; i++){
//         j=num.length - i-1
//         var c = num.charAt(i)
//         if(c == '1')poly.push( j)
//     }
//     for(var i=0; i<num2.length; i++){
//         j=num2.length - i-1
//         var c = num2.charAt(i)
//         if(c == '1')poly2.push(j)
//     }
//         result = []
//     for (var i in poly){
//         for (var j in poly2){
//             var t = poly[i] + poly2[j]
//             x =result.indexOf(t)
//             if(x >-1){
//             result.splice(x,1)
//             }
//             else
//             result.push(t)
//         }
//     }
//     binaryResult =''
//     j = 0
//     for(var i=result[0]; i >= 0 ;i--){
//         if(i == result[j]){
//             binaryResult += '1'
//             j++
//         }else binaryResult += '0'
//     }
//     const mod11b = 0b100011011 
//     while(binaryResult.length > 8){
//         binaryResult =  (('0b'+binaryResult)^ mod11b).toString(2)
//         while(c=binaryResult.charAt(0) != '1'){
//             binaryResult = binaryResult.slice(1)
//         }
//     }
    
//     hexResult = (('0b' + binaryResult) | 0b0).toString(16)
//     while(hexResult.length < 2){
//         hexResult = '0' + hexResult
//         }
//     return  hexResult
    
// // var lnum1 = log(num1)
// // var lnum2 = log(num2)
// // var eResult = exponentials(addTwoHex(lnum1,lnum2))
// // return eResult
// /*var temp2 = num2
// var temp1 = num1
// num2 = ("0x" + num2) | 0x0
// num1 = ("0x" + num1) | 0x0
// num1 = num1.toString(2)

// if (num2 == 1){
//     return temp1
// }
// else if (num2 == 2){
    
//     while(num1.length<8)
//         num1 = '0' + num1

//     if(num1.charAt(0) == '0'){
//         num1 = num1.slice(1,num1.length) + '0'
//         return (("0b" + num1)| 0b0).toString(16)
//     }else{
//         num1 = num1.slice(1,num1.length) + '0'
//         num1 = xor(num1,'00011011')
//         return (("0b" + num1)| 0b0).toString(16)
//     }
// }else{
//     if(num2 % 2 == 0){
//     num2 = num2 / 2
//     var num = multipalHex(temp1, num2.toString(16))
//     var numTemp = (('0x' + num) | 0x0 ).toString(2)
//     while(numTemp.length < 8)
//         numTemp = '0' + numTemp
//     var result = xor(numTemp, numTemp)
//     result = (("0b" + result)| 0b0).toString(16).toUpperCase()
//     while(result.length < 2)
//         result = '0' + result
//     return result
//     }
//     else{
//     num2 = Math.round( num2/2)
//     var num = multipalHex(temp1, num2.toString(16)) 
//     var num5 = multipalHex(temp1, (num2-1).toString(16)) 
//     var numTemp1 = (('0x' + num) | 0x0 ).toString(2)
//     var numTemp2 = (('0x' + num5 ) | 0x0 ).toString(2)
//     while(numTemp1.length < 8)
//         numTemp1 = '0' + numTemp1
//     while(numTemp2.length < 8)
//         numTemp2 = '0' + numTemp2
//     var result = xor(numTemp1, numTemp2)
//     console.log(num,num5)
//     result = (("0b" + result)| 0b0).toString(16).toUpperCase()
//     while(result.length < 2)
//         result = '0' + result
//     return result
//     }
// }*/

// /* num1 = '0x' + num1
// num2 = '0x' + num2
// var result = (num1 * num2 ).toString(16)
// if(result.length < 2){
//     result = "0" + result
//     return result 
// }else if(result.length > 2){
//     console.log(result)
//     result = result.slice(1)
//     result = xor(hexToBinary(result),'00011011')
//     return result
// }else return result*/
// }
// function stringToHexMatrix(msg){
// msg = switchCharcter(msg)
// var msgMatrix = []
// var k=0
// for(var i=0; i<4; i++){
//     var row =[]
//     for(var j=0; j<4; j++){
//     var c = "00"
//     if(k<msg.length){
//         c= msg.charCodeAt(k).toString(16)
//         if(c.length < 2){
//         c = "0" + c
//         }
//         k++
//     }
//     row.push(c)
//     }
//     msgMatrix.push(row)
// }
// return msgMatrix
// }
// function switchCharcter(msg){
// const switechedChars = ['ş','Ş','ı','İ','ç','Ç','ö','Ö','ü','Ü','Ğ','ğ']
// var newMsg = ''
// for(var i=0;i<msg.length;i++){
//     var c = msg.charAt(i)
//     if(switechedChars.includes(c))
//     c = switchCase(c)
//     newMsg += c
// }
// function switchCase(c){
//     switch (c){
//     case 'ş': return 's';
//     case 'Ş': return 'S';
//     case 'ı': return 'i';
//     case 'İ': return 'I';
//     case 'ç': return 'c';
//     case 'Ç': return 'C';
//     case 'ö': return 'o';
//     case 'Ö': return 'O';
//     case 'ü': return 'u';
//     case 'Ü': return 'U';
//     case 'Ğ': return 'G';
//     case 'ğ': return 'g';
//     default : break;
//     }
//     return c
// }
// return newMsg
// }
// function subByteTable(num,d=0){
// const invSTable = [
//     ['52','09','6A','D5','30','36','A5','38','BF','40','A3','9E','81','F3','D7','FB'],
//     ['7C','E3','39','82','9B','2F','FF','87','34','8E','43','44','C3','DE','E9','CB'],
//     ['54','7B','94','32','A6','C2','23','3D','EE','4C','95','0B','42','FA','C3','4E'],
//     ['08','2E','A1','66','28','D9','24','B2','76','5B','A2','49','6D','8D','D1','25'],
//     ['72','F8','F6','64','86','68','98','16','D4','A4','5C','CC','5D','65','B6','92'],
//     ['6C','70','48','50','FD','ED','B9','DA','5E','15','46','57','A7','8D','9D','84'],
//     ['90','D8','AB','00','8C','BC','D3','0A','F7','E4','58','05','B8','B3','45','06'],
//     ['D0','2C','1E','8F','CA','3F','0F','02','C1','AF','BD','03','01','13','BA','6B'],
//     ['3A','91','11','41','4F','67','DC','EA','97','F2','CF','CE','F0','B4','E6','73'],
//     ['96','AC','74','22','E7','AD','35','85','E2','F9','37','E8','1C','75','DF','6E'],
//     ['47','F1','1A','71','1D','29','C5','89','6F','B7','62','0E','AA','18','BE','1B'],
//     ['FC','56','3E','4B','C6','D2','79','20','9A','DB','C0','FE','78','CD','5A','F4'],
//     ['1F','DD','A8','33','88','07','C7','31','B1','12','10','59','27','80','EC','5F'],
//     ['60','51','7F','A9','19','B5','4A','0D','2D','E5','7A','9F','93','C9','9C','EF'],
//     ['A0','E0','3B','4D','AE','2A','F5','B0','C8','EB','BB','3C','83','53','99','61'],
//     ['17','2B','04','7E','BA','77','D6','26','E1','69','14','63','55','21','0C','7D']
// ]
// const sTable = d == 0 ? inversTable(invSTable): invSTable             
// var newMatrix = []
// for(var i =0; i < num.length; i++){
//     var row = []
//     for(var j=0; j<num[i].length; j++){
//         var r = ('0x'+ num[i][j].charAt(0)) | 0x0
//         var c = ('0x'+ num[i][j].charAt(1)) | 0x0
//         row.push(sTable[r][c])
//     }
//     newMatrix.push(row)
// }
// return newMatrix
// }
// function inversTable(table){
// let iTable= []
// for(var i =0; i < table.length; i++){
//     var row = []
//     for(var j=0; j<table[i].length; j++){
//     row.push(findTableItem(toHex(i,j),table))
//     }
//     iTable.push(row)
// }
// return iTable
// }
// function findTableItem(item,table){
// for(var i =0; i < table.length; i++){
//     for(var j=0; j<table[i].length; j++){
//     if(item == table[i][j])
//         return toHex(i,j)
//     }
// }
// }
// function hexToBinary(num,len=8){
// num = "0x" + num 
// num = num | 0x0
// num = num.toString(2)
// while(num.length < len)
//     num = '0'+num
// return num
// }
// function toHex(num1,num2=''){
// num1 = (num1).toString(16)
// num2 = (num2).toString(16)
// return (num1 + '' + num2).toUpperCase() 
// }
// function toDec(num){
//     return (('0x' + num ) * 1).toString(10)
// }
// function addTwoHex(num1,num2){
//     num1 = ('0x' + num1) * 1
//     num2 = ('0x' + num2) * 1
//     var result = num1 + num2
//     if(result > 255)
//         result = result - 255
//     return result.toString(16)
// }
// function convertHexToIndex(num){
//     if(num.length < 2) num = '0'+ num
//     var r = toDec(num.charAt(0))
//     var c = toDec(num.charAt(1))
//     return {r,c}
// }

// function exponentials(num){
//     const eTable = [
//         ['01','03','05','0f','11','33','55','ff','1a','2e','72','96','a1','f8','13','35'],
//         ['5f','e1','38','48','d8','73','95','a4','f7','02','06','0a','1e','22','66','aa'],
//         ['e5','34','5c','e4','37','59','eb','26','6a','be','d9','70','90','ab','e6','31'],
//         ['53','f5','04','0c','14','3c','44','cc','4f','d1','68','b8','d3','6e','b2','cd'],
//         ['4c','d4','67','a9','e0','3b','4d','d7','62','a6','f1','08','18','28','78','88'],
//         ['83','9e','b9','d0','6b','bd','dc','7f','81','98','b3','ce','49','db','76','9a'],
//         ['b5','c4','57','f9','10','30','50','f0','0b','1d','27','69','bb','d6','61','a3'],
//         ['fe','19','2b','7d','87','92','ad','ec','2f','71','93','ae','e9','20','60','a0'],
//         ['fb','16','3a','4e','d2','6d','b7','c2','5d','e7','32','56','fa','15','3f','41'],
//         ['c3','5e','e2','3d','47','c9','40','c0','5b','ed','2c','74','9c','bf','da','75'],
//         ['9f','ba','d5','64','ac','ef','2a','7e','82','9d','bc','df','7a','8e','89','80'],
//         ['9b','b6','c1','58','e8','23','65','af','ea','25','6f','b1','c8','43','c5','54'],
//         ['fc','1f','21','63','a5','f4','07','09','1b','2d','77','99','b0','cb','46','ca'],
//         ['45','cf','4a','de','79','8b','86','91','a8','e3','3e','42','c6','51','f3','0e'],
//         ['12','36','5a','ee','29','7b','8d','8c','8f','8a','85','94','a7','f2','0d','17'],
//         ['39','4b','dd','7c','84','97','a2','fd','1c','24','6c','b4','c7','52','f6','01']
//     ]
//     if(num == '')return '00'
//     var {r,c} = convertHexToIndex(num)
//     return eTable[r][c]
// }

// function log(num){
//     const lTable = [
//         [ '' , '00', '19', '01', '32', '02', '1a', 'c6', '4b', 'c7', '1b', '68', '33', 'ee', 'df', '03'],
//         ['64', '04', 'e0', '0e', '34', '8d', '81', 'ef', '4c', '71', '08', 'c8', 'f8', '69', '1c', 'c1'],
//         ['7d', 'c2', '1d', 'b5', 'f9', 'b9', '27', '6a', '4d', 'e4', 'a6', '72', '9a', 'c9', '09', '78'], 
//         ['65', '2f', '8a', '05', '21', '0f', 'e1', '24', '12', 'f0', '82', '45', '35', '93', 'da', '8e'], 
//         ['96', '8f', 'db', 'bd', '36', 'd0', 'ce', '94', '13', '5c', 'd2', 'f1', '40', '46', '83', '38'],
//         ['66', 'dd', 'fd', '30', 'bf', '06', '8b', '62', 'b3', '25', 'e2', '98', '22', '88', '91', '10'], 
//         ['7e', '6e', '48', 'c3', 'a3', 'b6', '1e', '42', '3a', '6b', '28', '54', 'fa', '85', '3d', 'ba'],
//         ['2b', '79', '0a', '15', '9b', '9f', '5e', 'ca', '4e', 'd4', 'ac', 'e5', 'f3', '73', 'a7', '57'],
//         ['af', '58', 'a8', '50', 'f4', 'ea', 'd6', '74', '4f', 'ae', 'e9', 'd5', 'e7', 'e6', 'ad', 'e8'], 
//         ['2c', 'd7', '75', '7a', 'eb', '16', '0b', 'f5', '59', 'cb', '5f', 'b0', '9c', 'a9', '51', 'a0'],
//         ['7f', '0c', 'f6', '6f', '17', 'c4', '49', 'ec', 'd8', '43', '1f', '29', 'a4', '76', '7b', 'b7'],
//         ['cc', 'bb', '3e', '5a', 'fb', '60', 'b1', '86', '3b', '52', 'a1', '6c', 'aa', '55', '29', '9d'],
//         ['97', 'b2', '87', '90', '61', 'be', 'dc', 'fc', 'bc', '95', 'cf', 'cd', '37', '3f', '5b', 'd1'], 
//         ['53', '39', '84', '3c', '41', 'a2', '6d', '47', '14', '2a', '9e', '5d', '56', 'f2', 'd3', 'ab'],
//         ['44', '11', '92', 'd9', '23', '20', '2e', '89', 'b4', '7c', 'b8', '26', '77', '99', 'e3', 'a5'],
//         ['67', '4a', 'ed', 'de', 'c5', '31', 'fe', '18', '0d', '63', '8c', '80', 'c0', 'f7', '70', '07']
//     ]
//     var {r,c} = convertHexToIndex(num)
//     return lTable[r][c]
// }
// function shiftWord(word){
//     var newWord = [...word]
//     var shifted = newWord.shift()
//     newWord.push(shifted)
//     return newWord
// }
// function Recon(word,round){
//     const recon = [
//         ['01','00','00','00'],
//         ['02','00','00','00'],
//         ['04','00','00','00'],
//         ['08','00','00','00'],
//         ['10','00','00','00'],
//         ['20','00','00','00'],
//         ['40','00','00','00'],
//         ['80','00','00','00'],
//         ['1B','00','00','00'],
//         ['36','00','00','00'],
//     ]
//     return xorTwoWords(word, recon[round])
// }

// function subByteWord(word){
//     var newMat = [word]
//     var sWordMat = subByteTable(newMat)
//     return sWordMat[0]
// }

// function xorTwoWords(word1,word2){
//     var result = []
//     for(var i in word1){
//         var c =xor(hexToBinary(word1[i]),hexToBinary(word2[i]))
//         c = binaryToDecimal(c).toString(16)
//         if(c.length< 2)
//             c = '0' + c
//         result.push(c)
//     }
//     return result
// }