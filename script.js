import uploadFiles from './upload.js';

document.addEventListener("DOMContentLoaded", () => {
  const uploadBox = document.getElementById("uploadBox");
  const fileInput = document.getElementById("fileInput");
  let cropper;
  let currentRotation = 0;
  let focusedImage = document.getElementById("focusedImage");
  const imageTray = document.getElementById("imageTray");
  const initialInterface = document.getElementById("initialInterface");
  const editingInterface = document.getElementById("editingInterface");
  const uploadProgressInterface = document.getElementById("uploadProgressInterface");
  const progressContainer = document.getElementById("progressContainer");
  let filesToUpload = [];
  const uploadAllButton = document.getElementById("uploadFilesButton");
  const addPhotosButton = document.getElementById("add-btn");
  const MAX_SIZE_MB = 50;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024; // Convert MB to bytes
  
  // Trigger file input when clicking the upload box
  uploadBox.addEventListener("click", () => {
    fileInput.click();
  });

  // Stop event propagation on file input to prevent double triggering
  fileInput.addEventListener("click", (event) => {
    console.log("File input clicked");
    event.stopPropagation();
  });    

  // Handle file input change event
//  fileInput.addEventListener("change", (event) => {
//   const files = event.target.files;
//   handleFiles(files);
// });

// Function to handle files and append them to the image tray

// Function to handle file input and append valid files to the image tray and filesToUpload
function handleFileInput(event) {
  const files = Array.from(event.target.files);

  if (files.length > 0) {
    if (initialInterface) {
      initialInterface.style.display = "none";
    }

    if (editingInterface) {
      editingInterface.style.display = "flex";
    }

    if (imageTray) {
      // Optional: Clear existing images before adding new ones
      // imageTray.innerHTML = "";

      let validFiles = []; // Array to hold files that meet the size requirements

      files.forEach((file, index) => {
        if (file.size > MAX_SIZE_BYTES) {
          alert(`The file ${file.name} exceeds the ${MAX_SIZE_MB} MB size limit.`);
          return; // Skip this file and continue with the next one
        }

        validFiles.push(file); // Add the file to the validFiles array

        const reader = new FileReader();

        reader.onload = function (e) {
          const img = document.createElement("img");
          img.src = e.target.result;
          img.classList.add("tray-image");
          img.setAttribute('data-filename', file.name); // Associate filename with image

          // Add event listener to update focused image when tray image is clicked
          img.addEventListener("click", function () {
            // Remove 'selected' class from previously selected image
            const currentlySelectedImg = document.querySelector(".tray-image.selected");
            if (currentlySelectedImg) {
              currentlySelectedImg.classList.remove("selected");
            }

            // Set the new image as focused
            const imageToDisplay = img.dataset.croppedImageUrl ? img.dataset.croppedImageUrl : img.src;
            if (focusedImage) {
              focusedImage.src = imageToDisplay;
              selectNewImage(focusedImage);
            }

            // Highlight the clicked thumbnail as selected
            img.classList.add("selected");
          });

          imageTray.appendChild(img); // Add image to the tray

          // Focus the first image by default only if no other image is selected
          if (index === 0 && !document.querySelector(".tray-image.selected")) {
            img.classList.add("selected");
            if (focusedImage) {
              focusedImage.src = img.src;
              selectNewImage(focusedImage);
            }
          }
        };

        reader.readAsDataURL(file); // Read the file as a data URL
      });

      // Update filesToUpload with only the valid files
      filesToUpload.push(...validFiles);
    }
  }
}

// Attach the combined function to the file input change event
fileInput.addEventListener("change", handleFileInput);
  
addPhotosButton.addEventListener("click", () => {
  fileInput.click(); // Trigger the file input to open the file dialog
  console.log("add clicked");
});

  // Initialize Cropper when needed
  function initializeCropper() {
    if (cropper) {
      cropper.destroy(); // Destroy existing instance if it exists
    }
    cropper = new Cropper(focusedImage, {
      viewMode: 1,
      autoCropArea: 1,
      responsive: true
    });
  }

  // Initialize cropper when crop icon is clicked
  document.getElementById("cropIcon").addEventListener("click", () => {
    if (!cropper) {
      initializeCropper(); // Initialize Cropper.js when crop icon is clicked
    }
  });

  // Handle rotation
  document.getElementById('rotateLeft').addEventListener('click', () => {
    currentRotation -= 90; // Rotate left by 90 degrees
    rotateImage();
  });

  document.getElementById('rotateRight').addEventListener('click', () => {
    currentRotation += 90; // Rotate right by 90 degrees
    rotateImage();
  });

  function rotateImage() {
    if (focusedImage) {
      focusedImage.style.transform = `rotate(${currentRotation}deg)`;
    }
  }
  
  // Save the rotated image as a new image
  function saveRotatedImage() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions equal to focused image dimensions
    const width = focusedImage.naturalWidth;
    const height = focusedImage.naturalHeight;
    canvas.width = width;
    canvas.height = height;

    // Translate and rotate the canvas context
    ctx.translate(width / 2, height / 2);
    ctx.rotate((currentRotation * Math.PI) / 180);
    ctx.drawImage(focusedImage, -width / 2, -height / 2);

    // Convert the rotated canvas to a Blob
    canvas.toBlob((blob) => {
      const newImageURL = URL.createObjectURL(blob);
      const filename = document.querySelector(".tray-image.selected").dataset.filename;

    // Create a new File object for the rotated image
    const rotatedFile = new File([blob], filename || "rotated-image.jpg", { type: blob.type });

    // Replace the original file in filesToUpload with the rotated image
    filesToUpload = filesToUpload.map(file =>
      file.name === filename ? rotatedFile : file
    );

      // Update the main focused image with the rotated version
      focusedImage.src = newImageURL;

      // Find the currently selected image in the tray
      const selectedImg = document.querySelector(".tray-image.selected");
      if (selectedImg) {
        // Update the thumbnail in the tray with the rotated version
        selectedImg.src = newImageURL;

        // Store the new rotated image URL as a data attribute
        selectedImg.dataset.croppedImageUrl = newImageURL;
      }

      // Reset rotation state
      currentRotation = 0;
      focusedImage.style.transform = 'rotate(0deg)';
    });
  }

  // Assuming this is the part where a new image is selected
  function selectNewImage(newImage) {
    // Reset rotation when a new image is selected
    currentRotation = 0;

    // Remove rotation from the previously focused image
    if (focusedImage) {
      focusedImage.style.transform = 'rotate(0deg)'; // Reset the transform
    }

    // Set the new focused image
    focusedImage = newImage;

    // Apply the default rotation (0 degrees)
    rotateImage();
  }

  // Handle delete icon click (remove the focused image)
  document.getElementById('delete').addEventListener('click', () => {
    const selectedImg = document.querySelector(".tray-image.selected");

    if (selectedImg) {

      // Get the filename of the image to delete
      const fileNameToDelete = selectedImg.getAttribute('data-filename');

      // Remove the selected image from the tray
      selectedImg.remove();

      // Update the focused image to the next image, if available
      const newSelectedImg = document.querySelector(".tray-image");
      if (newSelectedImg) {
        newSelectedImg.classList.add("selected");
        focusedImage.src = newSelectedImg.src;
      } else {
        // No more images in the tray, clear the focused image
        focusedImage.src = "";
        if (initialInterface) {
          initialInterface.style.display = "flex";
        }

        if (editingInterface) {
          editingInterface.style.display = "none";
        }
      }
       // Remove the file from the filesToUpload array
    filesToUpload = filesToUpload.filter(file => file.name !== fileNameToDelete);
    }
  });

// Handle tick icon click (finalize crop and update image)
document.getElementById("tickIcon").addEventListener("click", () => {
  if (cropper) {
    const canvas = cropper.getCroppedCanvas();
    if (canvas) {
      // Convert canvas to a Blob (binary image data)
      canvas.toBlob((blob) => {
        const newImageURL = URL.createObjectURL(blob);
        const filename = document.querySelector(".tray-image.selected").dataset.filename;

        const croppedFile = new File([blob], filename || "cropped-image.jpg", { type: blob.type });

         // Replace the original file in filesToUpload with the cropped image
         filesToUpload = filesToUpload.map(file =>
          file.name === filename ? croppedFile : file
        );

        // Update the main focused image with the cropped version
        focusedImage.src = newImageURL;

        // Find the currently selected image in the tray
        const selectedImg = document.querySelector(".tray-image.selected");
        if (selectedImg) {
          // Update the thumbnail in the tray with the cropped version
          selectedImg.src = newImageURL;

          // Store the new cropped image URL as a data attribute
          selectedImg.dataset.croppedImageUrl = newImageURL; 
        } 

        // Clean up: Destroy the Cropper.js instance after cropping
        cropper.destroy();
        cropper = null;
      });
    }
  } else {
    // Save the rotated image if cropping is not active
    saveRotatedImage();
  }
});
    
  function showUploadProgressInterface() {
    if (editingInterface) {
        editingInterface.style.display = "none";
    }
  
    if (uploadProgressInterface) {
        uploadProgressInterface.style.display = "block";
    }
  }
  function createFileUploadInterface() {
    // Create the container div
    const interfaceDiv = document.createElement('div');
    interfaceDiv.className = 'file-upload-interface';

    // Create the "Browse/Drag files" text div
    const textDiv = document.createElement('div');
    textDiv.innerText = "Browse / Drag & Drop Photos";
    textDiv.className = 'browse-text';

    // Create the clickable div to open file explorer
    const uploadDiv = document.createElement('div');
    uploadDiv.className = 'upload-area';

    // Create the hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.style.display = 'none'; // Hide the file input

    // Attach event listener to open file dialog
    uploadDiv.addEventListener('click', () => fileInput.click());

    // Handle file selection
    fileInput.addEventListener("change", (event) => {
      handleFileInput(event);

      // Hide the interface after files are selected
      if (currentInterfaceDiv) {
        currentInterfaceDiv.style.display = 'none';
        uploadInterfaceDiv.style.display = 'none';
      }
  });
   

    // Append elements to the interface div
    interfaceDiv.appendChild(textDiv);
    interfaceDiv.appendChild(uploadDiv);
    interfaceDiv.appendChild(fileInput);

    // Append the interface to the container
    document.getElementById('interface-container').appendChild(interfaceDiv);
    currentInterfaceDiv = interfaceDiv;
}

// Handle "Upload All" button click
document.getElementById('uploadFilesButton').addEventListener('click', async () => {
  createFileUploadInterface(); // Create or update the file upload interface
  showUploadProgressInterface();

  const fileInput = document.getElementById('fileInput');
  const files = fileInput.files;

  if (files.length === 0) {
    alert('No files selected.');
    return;
  }

  const fileArray = Array.from(files);

  try {
    const successfulUploads = await uploadFiles(fileArray);
    console.log('Successfully uploaded files:', successfulUploads);
  } catch (error) {
    console.error('Error uploading files:', error);
  }
});

// Function to delete a file from S3
function deleteFileFromS3(file) {
  return fetch(`http://localhost:3000/delete-file?filename=${encodeURIComponent(file.name)}`, {
    method: 'DELETE',
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to delete file ${file.name} from S3`);
    }
    return response.json();
  });
  }
  
// Function to create progress bar and controls
function createProgressBar(file) {
  const progressBarWrapper = document.createElement("div");
  progressBarWrapper.classList.add("progress-bar-wrapper");

  const fileNameLabel = document.createElement("span");
  fileNameLabel.textContent = file.name;
  fileNameLabel.style.fontSize = "12px"; // Set the font size to 12px
  progressBarWrapper.appendChild(fileNameLabel);

  const thumbnail = document.createElement("img");
  thumbnail.classList.add("thumbnail");
  progressBarWrapper.appendChild(thumbnail);

  const sizeLabel = document.createElement("span");
  sizeLabel.classList.add("size-label");
  sizeLabel.textContent = "0 MB of " + (file.size / (1024 * 1024)).toFixed(2) + " MB";
  progressBarWrapper.appendChild(sizeLabel);

  const progressBar = document.createElement("div");
  progressBar.classList.add("progress-bar");
  progressBarWrapper.appendChild(progressBar);

  // Create a container for the buttons
  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("button-container");

  const pauseButton = document.createElement("button");
  pauseButton.textContent = "Pause";
  pauseButton.classList.add("pause-button");
  buttonContainer.appendChild(pauseButton);

  // Create delete button
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.classList.add("delete-button");
  buttonContainer.appendChild(deleteButton);

  // Append the button container to the progress bar wrapper
  progressBarWrapper.appendChild(buttonContainer);
  
  progressContainer.appendChild(progressBarWrapper);

  return { progressBar, sizeLabel, thumbnail, pauseButton, deleteButton, progressBarWrapper  };
}
  
// Function to upload a file with progress
function uploadFileWithProgress(file, presignedUrl) {
  const chunkSize = 3 * 1024 * 1024; // 3 MB chunks
  const totalChunks = Math.ceil(file.size / chunkSize);
  let currentChunk = 0;
  let isPaused = false;
  let controller = new AbortController();
  let uploadedBytes = 0;  // To keep track of uploaded bytes

  const { progressBar, sizeLabel, thumbnail, pauseButton, deleteButton, progressBarWrapper } = createProgressBar(file);  // Create and get the progress bar elements

  // Calculate progress and update the progress bar
  function updateProgress() {
    const percentage = Math.round((uploadedBytes / file.size) * 100);
    progressBar.style.width = `${percentage}%`;

    // Ensure that we don't exceed the total file size
    const uploadedMB = (uploadedBytes / (1024 * 1024)).toFixed(2);
    const totalMB = (file.size / (1024 * 1024)).toFixed(2);

    sizeLabel.textContent = `${uploadedMB} MB of ${totalMB} MB`;
  }

  // Function to upload a chunk
  function uploadChunk(chunk, chunkNumber) {
    return fetch(presignedUrl, {
      method: 'PUT',
      body: chunk,
      signal: controller.signal
    }).then(response => {
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      // Update the cumulative bytes uploaded
      uploadedBytes += chunk.size;
      updateProgress();  // Update progress after each chunk upload

      if (currentChunk < totalChunks) {
        uploadNextChunk();  // Continue to the next chunk
      } else {
        // Handle the completion of the file upload
        console.log(`File ${file.name} uploaded successfully!`);
        thumbnail.src = URL.createObjectURL(file);

         // Hide the pause button after upload is complete
         pauseButton.style.display = "none";

        // Attach delete functionality
        deleteButton.addEventListener('click', () => {
          deleteFileFromS3(file).then(() => {
            progressBarWrapper.remove();
            console.log(`File ${file.name} deleted successfully from S3.`);
          }).catch(error => {
            console.error(`Failed to delete file ${file.name} from S3:`, error);
          });
        });
      }
    }).catch(error => {
      console.error('Error uploading chunk:', error);
    });
  }

  // Function to upload the next chunk
  function uploadNextChunk() {
    if (isPaused) return;

    const start = currentChunk * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    currentChunk++;

    uploadChunk(chunk, currentChunk);
  }

  // Function to handle pause/resume
  function handlePauseResume() {
    if (isPaused) {
      controller = new AbortController();
      isPaused = false;
      pauseButton.textContent = "Pause";
      uploadNextChunk();
    } else {
      controller.abort();
      isPaused = true;
      pauseButton.textContent = "Resume";
    }
  }

  pauseButton.addEventListener('click', handlePauseResume);

  // Start uploading chunks
  uploadNextChunk();
}

// Event listener for browseMoreFilesButton
// const browseMoreFilesButton = document.getElementById("browseMoreFilesButton");

// browseMoreFilesButton.addEventListener("click", () => {
//   fileInput.click();
  // });
  let uploadInterfaceDiv = document.getElementById("uploadProgressInterface");
  let currentInterfaceDiv = null; // Global variable to store the reference to the created interface div

// Example trigger: Attach the creation function to an element click
// document.getElementById('uploadFilesButton').addEventListener('click', createFileUploadInterface);

});
