const electron = require('electron')
const url = require('url')
const path = require('path')
const fs = require('fs');
const { google } = require('googleapis');
const customsearch = google.customsearch('v1');
const request = require('request');

const { app, BrowserWindow } = electron;
let mainWindow;
var nImages;

function getImgFromArray(dataArray) {
    var imgArrayDownloaded = []
    for (let i = 0; i < dataArray.length; i++) {
        imgArrayDownloaded.push(dataArray.items[i].link);
    }
    return imgArrayDownloaded;
}

function downloadGoogleArray(googleArray) {
    for (let i = 0; i < googleArray.length; i++) {
        downloadImg(googleArray[i]);
    }
}

function downloadImg(url = "https://www.google.com/images/srpr/logo3w.png") {
    var download = function (uri, filename, callback) {
        request.head(uri, function (err, res, body) {
            console.log('content-type:', res.headers['content-type']);
            console.log('content-length:', res.headers['content-length']);
            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        });
    };
    nImages = nImages + 1;
    var imgName = `../images/m (${nImages}).png`;
    download(url, imgName, function () {
        console.log('added ' + imgName);
        writeToFile(imgName);
    });
}

function getImgfromNet() {
    if (module === require.main) {
        // You can get a custom search engine id at
        // https://www.google.com/cse/create/new
        const options = {
            q: "plane",
            apiKey: "AIzaSyAwUpzM9DJr58Y3y_8TMnMkfwCBtCEGcTs",
            cx: "010789280150233095101:gry9brqojdc"
        };
        imgRequest(options).catch(console.error);
    }
}

async function imgRequest(options) {
    const res = await customsearch.cse.list({
        cx: options.cx,
        q: options.q,
        auth: options.apiKey,
        searchType: "image"
    });
    var googleArray = getImgFromArray(res.data);
    downloadGoogleArray(googleArray);
    //console.log(res.data.items[0].link);
    return res.data;
}

function writeToFile(data = "no text provided") {
    data = data + '\n';
    fs.appendFile('imagesFile.txt', data, function (err, data) {
        if (err) console.log(err);
        console.log("Address added");
    });
}

function readFile(callback) {
    var arrayImg;
    fs.readFile('imagesFile.txt', function (error, data) {
        if (error)
            callback(error, null);
        else {
            arrayImg = data.toString().split("\n");
            callback(null, arrayImg);
        }
    });
}

function ipc(imgArray) {
    var imgNumber = 0;
    const { ipcMain } = require('electron')
    ipcMain.on('asynchronous-message', (event, arg) => {
        console.log(arg) // prints "ping"

        event.sender.send('asynchronous-reply', imgArray[imgNumber])
        if (imgNumber + 1 == imgArray.length) {
            imgNumber = 0;
        }
        else {
            imgNumber++;
        }
        event.returnValue = 'pong'
    })
}

function showWindow() {
    mainWindow = new BrowserWindow({})
    mainWindow.setMenu(null);
    mainWindow.setTitle("Meme Viewer");
    mainWindow.setSize(800, 600, 1);
    mainWindow.setResizable(false)
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '/pages/home.html'),
        protocol: 'file:',
        slashes: true
    }));
    //writeToFile();
}

//main
app.on('ready', function () {
    showWindow();
    //getting images array
    var imgArray = readFile(function (err, data) {
        if (err) {
            console.log("ERROR : ", err);
        } else {
            nImages = data.length;
            //downloadImg();
            ipc(data);
        }
    });
    getImgfromNet();
});
