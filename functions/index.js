const functions = require("firebase-functions");
const admin = require("firebase-admin")
const {TwitterApi} = require("twitter-api-v2");
const {OpenAIApi, Configuration} = require('openai')

admin.initializeApp();

const dbRef = admin.firestore().doc('tokens/demo')
const dbAuthRef = admin.firestore().doc('tokens/test')

const twitterClient = new TwitterApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
})

const configuration = new Configuration({
    apiKey: process.env.OPENAI_SECRET
})
const  openAi = new OpenAIApi(configuration)

const callbackURL = 'http://127.0.0.1:5000/bottas-the-twitter-bot/us-central1/callback'

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.auth = functions.https.onRequest(async (request, response) => {

    const {url, codeVerifier, state} = twitterClient.generateOAuth2AuthLink(
        callbackURL,
        {scope: ['tweet.read', "tweet.write", 'users.read', 'offline.access']}
    )
    await dbRef.set({codeVerifier, state})
    response.redirect(url)

})

exports.callback = functions.https.onRequest(async (request, response) => {

    const {state, code} = request.query
    const dbSnapshot = await dbRef.get()
    const {codeVerifier, state: storedState} = dbSnapshot.data()

    if(state !== storedState)
        return response.status(400).send('Tokens do not match!')

    const {client: loggedInClient, accessToken, refreshToken} = await twitterClient.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri: callbackURL
    })

    await dbAuthRef.set({accessToken, refreshToken})

    response.sendStatus(200)

})

exports.tweet = functions.https.onRequest(async (request, response) => {

    const dbSnapshot = await dbAuthRef.get()
    const {refreshToken} = dbSnapshot.data()

    const {client: refreshedClient, accessToken, refreshToken: newRefreshToken} = await twitterClient.refreshOAuth2Token(refreshToken)

    await dbAuthRef.set({accessToken, refreshToken: newRefreshToken})

    const choice = Math.round(Math.random())
    if(choice === 0) {
        const newTweet = await openAi.createCompletion('text-davinci-001', {
            prompt: prompts[Math.floor(Math.random() * prompts.length)],
            max_tokens: 64,
            temperature: 0.9
        })
        const {data} = await refreshedClient.v2.tweet(newTweet.data.choices[0].text)
        response.send(data)
    }
    else {
        const number = Math.floor( Math.random()*99 + 1 )
        const {data} = await refreshedClient.v2.tweet(`#NFT Racing Number #${number} ${numbers[number]}`)
        response.send(data)
    }

})


const numbers = {
    1: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908193567625707521',
    2: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908194667137335297',
    3: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908195766648963073',
    4: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908196866160590849',
    5: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908197965672218625',
    6: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908199065183846401',
    7: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908200164695474177',
    8: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908201264207101953',
    9: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908202363718729729',
    10: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908203463230357505',
    11: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908204562741985281',
    12: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908205662253613057',
    13: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908206761765240833',
    14: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908207861276868609',
    15: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908208960788496385',
    16: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908210060300124161',
    17: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908211159811751937',
    18: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908212259323379713',
    19: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908272732462907393',
    20: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908213358835007489',
    21: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908215557858263041',
    22: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908216657369890817',
    23: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908217756881518593',
    24: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908218856393146369',
    25: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908219955904774145',
    26: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908221055416401921',
    27: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908222154928029697',
    28: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908223254439657473',
    29: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908224353951285249',
    30: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908225453462913025',
    31: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908249642718724097',
    32: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908227652486168577',
    33: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908228751997796353',
    34: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908294722695462913',
    35: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908230951021051905',
    36: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908232050532679681',
    37: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908233150044307457',
    38: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908234249555935233',
    39: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908235349067563009',
    40: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908236448579190785',
    41: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908237548090818561',
    42: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908238647602446337',
    43: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908239747114074113',
    44: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908240846625701889',
    45: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908241946137329665',
    46: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908243045648957441',
    47: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908244145160585217',
    48: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908245244672212993',
    49: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908246344183840769',
    50: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908247443695468545',
    51: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908248543207096321',
    52: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908250742230351873',
    53: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908251841741979649',
    54: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908252941253607425',
    55: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908254040765235201',
    56: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908255140276862977',
    57: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908256239788490753',
    58: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908257339300118529',
    59: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908258438811746305',
    60: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908259538323374081',
    61: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908260637835001857',
    62: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908261737346629633',
    63: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908262836858257409',
    64: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908263936369885185',
    65: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908265035881512961',
    66: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908266135393140737',
    67: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908267234904768513',
    68: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908268334416396289',
    69: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908269433928024065',
    70: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908270533439651841',
    71: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908271632951279617',
    72: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908273831974535169',
    73: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908274931486162945',
    74: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908276030997790721',
    75: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908277130509418497',
    76: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908278230021046273',
    77: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908279329532674049',
    78: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908280429044301825',
    79: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908281528555929601',
    80: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908282628067557377',
    81: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908283727579185153',
    82: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908284827090812929',
    83: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908285926602440705',
    84: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908287026114068481',
    85: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908288125625696257',
    86: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908289225137324033',
    87: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908290324648951809',
    88: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908291424160579585',
    89: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908292523672207361',
    90: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908293623183835137',
    91: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908295822207090689',
    92: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908296921718718465',
    93: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908298021230346241',
    94: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908299120741974017',
    95: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908300220253601793',
    96: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908301319765229569',
    97: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908302419276857345',
    98: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908303518788485121',
    99: 'https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/90096766601740376544093248888205879595899618879220787878744908304618300112897',
}


const prompts = [
    'formula 1',
    'Kevin Magnussen is good',
    'Hass F1 team has improved',
    'nikita mazepin sucks',
    'lewis hamilton is overrated',
    'Tell @Banks to check out our NFT collection',
    'NFT is the future',
    'OpenSea NFT collections',
    'nico hulkenberg is the super sub',
    'fernando alonso el plan',
    'sebastian vettel is a hippie',
    'Racing Number Club',
    'Mint is live',
    'max verstapen is very aggressive',
    'Sergio Perez viva Mexico',
    'Valentino Rossi 46 number',
    'Yamaha moto gp',
    'Mercedes best cars ever',
    'Valteri Bottas better than Russell',
    'Crypto is the future',
    'Mining crypto',
    'New mint',
    'New NFT Collection',
    'sell @LoganPaul a Racing Number',
    'tell @garyvee to buy a Racing Number',
    'investing into nft',
    'investing into crypto',
    'polygon blockchain is awesome',
    'ethereum gas fees',
    'bitcoin vs ethereum',
    'solana vs ethereum',
    'bitcoin future',
    'Racing numbers on cars',
    'NASCAR numbers on cars',
    'Racing Numbers',
    'Cool racing numbers',
    'Carlos Sainz Jr is underrated',
    'Charles Leclerc is confident',
    'George Russell lacks confidence',
    'Aston Martin poor performance',
    'ferrari is the best',
    'essere ferrari',
    'red bull and bybit',
    'McLaren is struggling',
    'Mercedes weak engines',
    'Invest in this NFT collection',
    'Lando Norris is good',
    'Danny Ric is a legend',
    'Danny Duncan 69',
    '99 number',
    '14 Trippe Red',
    'Juice Wrld number',
    '10',
    'Number one',
    'famous racing numbers',
    'tweet about crypto',
]
