function addPixel(basePixel, overlayPixel) {
    // Alpha blend
    var overlayAlpha = overlayPixel[3] / 255,
        result = [0, 0, 0, 255];
    for (var i = 0; i < 3; i++) {
        //result[i] = (basePixel[i] * (overlayAlpha ? baseAlpha / 255 : 2) + overlayPixel[i] * overlayAlpha / 255) / 2;
        result[i] = (basePixel[i] * (1 - overlayAlpha) + overlayPixel[i] * overlayAlpha);
    }
    return result;
}
function getImageDataFromImage(image, width, height) {
    width = width || 640;
    height = height || 640;
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, width, height);
    return context.getImageData(0, 0, width, height);
}
function overlayImageData(baseImageData, overlayImageData) {
    var result = new ImageData(baseImageData.width, baseImageData.height);
    for (var i = 0; i < baseImageData.data.length; i += 4) {
        var resultantPixel = addPixel(
            [baseImageData.data[i], baseImageData.data[i + 1], baseImageData.data[i + 2], baseImageData.data[i + 3]],
            [overlayImageData.data[i], overlayImageData.data[i + 1], overlayImageData.data[i + 2], overlayImageData.data[i + 3]]
        );
        result.data[i] = resultantPixel[0];
        result.data[i + 1] = resultantPixel[1];
        result.data[i + 2] = resultantPixel[2];
        result.data[i + 3] = resultantPixel[3];
    }
    return result;
}
function getDataUrlFromImageData(imageData) {
    var canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d').putImageData(imageData, 0, 0);
    return canvas.toDataURL()
}
function getImageFromDataUrl(dataUrl) {
    var image = document.createElement('img');
    image.src = dataUrl;
    return image
}
function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {
        type: 'image/png'
    });
}
var authToken;
window.fbAsyncInit = function () {
    FB.init({
        appId: '1569889776373198',
        cookie: true,
        xfbml: true,
        version: 'v2.8'
    });
    FB.AppEvents.logPageView();
};
(function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {
        return;
    }
    js = d.createElement(s);
    js.id = id;
    js.src = '//connect.facebook.net/en_US/sdk.js';
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
function statusChangeCallback(response) {
    console.log('statusChangeCallback');
    console.log(response);
    if (response.status === 'connected') {
        testAPI();
    } else if (response.status === 'not_authorized') {
        document.getElementById('status').innerHTML = 'Please log ' +
            'into this app.';
    } else {
        document.getElementById('status').innerHTML = 'Please log ' +
            'into Facebook.';
    }
}
function checkLoginState() {
    FB.getLoginStatus(function (response) {
        authToken = response.authResponse.accessToken;
        statusChangeCallback(response);
    });
}
function postFacebookImage(blobImageData) {
    var imageFormData = new FormData();
    imageFormData.append('access_token', authToken);
    imageFormData.append('source', blobImageData);
    imageFormData.append('caption', '#udaan17 #teamudaan17 #teamudaan\nhttp://udaan17.in:8000');
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://graph.facebook.com/me/photos?access_token=' + authToken);
    xhr.send(imageFormData);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            console.log('Done');
            console.log(xhr);
            var uploadButton = document.getElementById('upload-button');
            uploadButton.innerHTML = 'Redirecting...';
            uploadButton.classList.add('btn-success');
            window.open('https://www.facebook.com/photo.php?fbid=' + JSON.parse(xhr.response).id);
        }
    }
}

function expandCard() {
    var cardClassList = document.getElementById('main-card').classList;
    cardClassList.remove('col-md-offset-3');
    cardClassList.remove('col-md-6');
    cardClassList.remove('col-sm-offset-2');
    cardClassList.remove('col-sm-8');
    cardClassList.add('col-md-offset-2');
    cardClassList.add('col-md-8');
    cardClassList.add('col-sm-offset-2');
    cardClassList.add('col-sm-8');
    var loginSection = document.getElementById('login-section');
    loginSection.hidden = true;

    var imageSection = document.getElementById('image-section');
    var uploadSection = document.getElementById('upload-section');
    setTimeout(function(){
        imageSection.hidden = false;
        uploadSection.hidden = false;
    }, 500);
}

function testAPI() {
    expandCard();
    console.log('Welcome!  Fetching your information.... ');
    FB.api('/me', function (response) {
        console.log('Successful login for: ' + response.name);
        document.getElementById('status').innerHTML =
            'Logged in as ' + response.name;
    });
    FB.api('/me/picture?width=720&height=720', 'GET', {}, function (response) {
        var profilePictureElement = document.getElementById('profile-picture');
        profilePictureElement.crossOrigin = 'Anonymous';
        profilePictureElement.src = response.data.url;
        profilePictureElement.addEventListener('load', function () {
            updateOverlayImages();
            var uploadButton = document.getElementById('upload-button');
            uploadButton.addEventListener('click', function () {
                console.log('Uploading...');
                var uploadButton = document.getElementById('upload-button');
                uploadButton.innerHTML = 'Uploading...';
                uploadButton.classList.remove('btn-primary');
                uploadButton.disabled = true;
                postFacebookImage(dataURItoBlob(document.getElementById('overlaid-profile-picture').src));
            });
            var overlayImages = document.getElementsByClassName('overlaid-image');
            for (var i = 0; i < overlayImages.length; i++) {
                overlayImages[i].addEventListener('click', function () {
                    document.getElementById('overlaid-profile-picture').src = this.src;
                });
            }
        });
    });
}
document.getElementById('logout').addEventListener('click', function () {
    FB.logout();
    document.getElementById('status').innerHTML = "You have been logged out.";
});


function updateOverlayImages() {
    var overlaidImageEl = document.getElementById('overlaid-images'),
        overlayImages = document.getElementsByClassName('overlay-image');
    for(var i = 0; i < overlayImages.length; i++) {
        var img = document.createElement('img');
        img.src = getDataUrlFromImageData(overlayImageData(
            getImageDataFromImage(document.getElementById('profile-picture'), 640, 640),
            getImageDataFromImage(overlayImages[i], 640, 640)
        ));
        img.classList.add('overlaid-image');
        overlaidImageEl.appendChild(img);
    }
    document.getElementById('overlaid-profile-picture').src = overlaidImageEl.firstElementChild.src;
}