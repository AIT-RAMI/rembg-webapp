const dropArea = document.getElementById('drop-area');
const fileElem = document.getElementById('fileElem');
const preview = document.getElementById('preview');
const sendButton = document.getElementById('sendButton');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

dropArea.addEventListener('drop', handleDrop, false);

document.addEventListener('paste', handlePaste, false);

fileElem.addEventListener('change', handleFileSelect, false);

sendButton.addEventListener('click', sendImage, false);

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    dropArea.classList.add('highlight');
}

function unhighlight() {
    dropArea.classList.remove('highlight');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    handleFiles(files);
}

function handlePaste(e) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
            const blob = items[i].getAsFile();
            handleFiles([blob]);
        }
    }
}

function handleFileSelect(e) {
    const files = e.target.files;

    handleFiles(files);
}

function handleFiles(files) {
    const file = files[0];
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = function() {
                preview.innerHTML = '';
                preview.appendChild(img);
                sendButton.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    } else {
        alert('Please select an image file.');
    }
}

function sendImage() {
    const imgDataUrl = preview.firstChild.src;
    const blob = dataURItoBlob(imgDataUrl);
    const image = new File([blob], "image");
    const formData = new FormData();
    formData.append('image', image, 'image');
    
    const processingMsg = document.createElement('p');
    processingMsg.textContent = 'Processing...';
    const container = document.getElementById('processedImageContainer');
    container.innerHTML = '';
    container.appendChild(processingMsg);
    fetch('/', {
        method: 'POST',
        body: formData
    }).then(response => {
        if (response.ok) {
            return response.blob();
            
        } else {
            throw new Error('Error sending image.');
        }
    }).then(blob => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = function() {
                const processedImg = document.createElement('img');
                processedImg.src = img.src;
                processedImg.alt = 'Processed Image';
                processedImg.style.maxWidth = '100%';
                processedImg.style.maxHeight = '300px';

                const container = document.getElementById('processedImageContainer');
                container.innerHTML = '';
                container.appendChild(processedImg);

                const downloadBtn = document.createElement('button');
                downloadBtn.textContent = 'Download Image';
                downloadBtn.classList.add('send-button');

                downloadBtn.addEventListener('click', function() {
                    const a = document.createElement('a');
                    a.href = img.src;
                    a.download = 'processed_image.png';
                    a.click();
                });

                const download_container = document.getElementById('downloadContainer');
                download_container.innerHTML = '';
                download_container.appendChild(downloadBtn);

                downloadBtn.style.display = 'block';
            }
        };
        reader.readAsDataURL(blob);
    }).catch(error => {
        console.error('Error sending image:', error);
    });
}

function downloadImage(imageUrl) {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = 'processed_image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}