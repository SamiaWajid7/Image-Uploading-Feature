import uploadFiles from './upload.js';
import { deleteFile } from './upload.js';  

document.addEventListener("DOMContentLoaded", () => {
  const uploadBox = document.getElementById("uploadBox");
  const fileInput = document.getElementById("fileInput");
  let cropper;
  let currentRotation = 0;
  let focusedImage = document.getElementById("focusedImage");
  const focusedVideo = document.getElementById('focusedVideo');
  const focusedImageContainer = document.getElementById('focusedImageContainer'); // Container for focused image/video
  const imageTray = document.getElementById("imageTray");
  const initialInterface = document.getElementById("initialInterface");
  const editingInterface = document.getElementById("editingInterface");
  const uploadProgressInterface = document.getElementById("uploadProgressInterface");
  const progressContainer = document.getElementById("progressContainer");
  let filesToUpload = [];
  // const uploadAllButton = document.getElementById("uploadFilesButton");
  const addPhotosButton = document.getElementById("add-btn");
  const MAX_SIZE_MB = 50;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024; // Convert MB to bytes
  let uploadInterfaceDiv = document.getElementById("uploadProgressInterface");
  let currentInterfaceDiv = null; 
  let validFiles = []; // Array to hold files that meet the size requirements



  // Trigger file input when clicking the upload box
  uploadBox.addEventListener("click", () => {
    fileInput.click();
  });

  // Stop event propagation on file input to prevent double triggering
  fileInput.addEventListener("click", (event) => {
    console.log("File input clicked");
    event.stopPropagation();
  });

  function handleFileInput(event) {
    const files = Array.from(event.target.files);

    // Clear the arrays and image tray if the user clicked "Browse" from the uploading interface
    if (clearPreviousFiles) {
        imageTray.innerHTML = ''; // This removes all the previously uploaded images from the tray
        filesToUpload = [];       // Reset the filesToUpload array to store only new files
        validFiles = [];          // Reset the validFiles array to store only new valid files
        clearPreviousFiles = false;  // Reset the flag after clearing the previous files
    }

    if (files.length > 0) {
        // Check if any valid files are added
        let hasValidFiles = false;

        // Process each file
        files.forEach((file, index) => {
            const fileType = file.type.split('/')[0]; // Get the file type (image or video)

            // Check for images
            if (fileType === "image") {
                if (file.size > MAX_SIZE_BYTES) { // Size limit
                    alert(`The file ${file.name} exceeds the size limit.`);
                    return; // Skip this file and continue with the next
                }

                // Handle image file
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = document.createElement("img");
                    img.src = e.target.result;
                    img.classList.add("tray-image");
                    img.setAttribute('data-filename', file.name); // Associate filename with image

                    img.addEventListener("click", function () {
                        updateFocusedMedia("image", img, file);
                    });

                    imageTray.appendChild(img); // Add image to the tray

                    if (index === 0 && !document.querySelector(".tray-image.selected")) {
                        updateFocusedMedia("image", img, file); // Focus the first image
                    }

                    // Set hasValidFiles to true after adding a valid file
                    validFiles.push(file);
                    hasValidFiles = true;
                    // Hide initial interface and show editing interface
                    if (initialInterface) {
                        initialInterface.style.display = "none";
                    }
                    if (editingInterface) {
                        editingInterface.style.display = "flex";
                    }
                };
                reader.readAsDataURL(file); // Read the file as a data URL

            } else if (fileType === "video") {
                if (file.size > 300 * 1024 * 1024) { // Size limit
                    alert(`The video ${file.name} exceeds the size limit.`);
                    return; // Skip this video and continue with the next
                }

                const videoElement = document.createElement("video");
                videoElement.src = URL.createObjectURL(file);

                videoElement.onloadedmetadata = function () {
                    const duration = videoElement.duration; // Get the duration of the video in seconds
                    if (duration > 180) { // Duration limit
                        alert(`The video ${file.name} exceeds the 3 minutes duration limit.`);
                        return; // Skip this video
                    }

                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d");
                    canvas.width = 160; // Thumbnail width
                    canvas.height = 90; // Thumbnail height

                    videoElement.currentTime = 0; // Seek to the start
                    videoElement.onseeked = function () {
                        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                        const thumbnailDataUrl = canvas.toDataURL(); // Get the thumbnail image as a data URL

                        const videoThumbnail = document.createElement("img");
                        videoThumbnail.src = thumbnailDataUrl; // Use the generated thumbnail
                        videoThumbnail.classList.add("tray-image");
                        videoThumbnail.setAttribute('data-filename', file.name); // Associate filename with video
                        videoThumbnail.setAttribute('data-file', URL.createObjectURL(file)); // Store video URL

                        videoThumbnail.addEventListener("click", function () {
                            updateFocusedMedia("video", videoThumbnail, file);
                        });

                        imageTray.appendChild(videoThumbnail); // Add video thumbnail to the tray

                        // Focus the video thumbnail
                       if (!document.querySelector(".tray-image.selected")) {
                           updateFocusedMedia("video", videoThumbnail, file); // Focus the first video
                          }
                      
                        // Set hasValidFiles to true after adding a valid file
                        validFiles.push(file);
                        hasValidFiles = true;
                        // Hide initial interface and show editing interface
                        if (initialInterface) {
                            initialInterface.style.display = "none";
                        }
                        if (editingInterface) {
                            editingInterface.style.display = "flex";
                        }
                    };
                };

            else {
                alert(`The file ${file.name} is neither an image nor a video.`);
                return; // Skip unsupported file types and continue with the next
            }
        });

        

        // No need to check if valid files were added at the end since it's already handled in the loop.
        // Transfer valid files to the filesToUpload array
        filesToUpload = [...validFiles]; // Spread operator to copy valid files
        console.log("Final Files to Upload:", filesToUpload); // Log the final array
    }
}


// Helper function to update focused media (image or video)
function updateFocusedMedia(type, thumbnail, file) {
  const currentlySelected = document.querySelector(".tray-image.selected");
  if (currentlySelected) {
      currentlySelected.classList.remove("selected");
  }

  // Update focus depending on media type
  if (type === "image") {
      focusedImage.src = thumbnail.src; // Set image source
      focusedImage.style.display = "block"; // Show image
      focusedVideo.style.display = "none"; // Hide video
  } else if (type === "video") {
      // Get the actual video file from the thumbnail's data-file attribute
      const videoFileUrl = thumbnail.getAttribute('data-file');
      if (videoFileUrl) {
          focusedVideo.src = videoFileUrl; // Set video source using the actual video file URL
          focusedVideo.style.display = "block"; // Show video
          focusedImage.style.display = "none"; // Hide image
      }
  }

  // Highlight the clicked thumbnail as selected
  thumbnail.classList.add("selected");
}


  // Attach the combined function to the file input change event
  fileInput.addEventListener("change", handleFileInput);
  
  addPhotosButton.addEventListener("click", () => {
    fileInput.click(); // Trigger the file input to open the file dialog
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

 // Handle delete icon click (remove the focused media)
// Handle delete icon click (remove the focused media)
document.getElementById('delete').addEventListener('click', () => {
  const selectedMedia = document.querySelector(".tray-image.selected"); // Get the currently selected media

  if (selectedMedia) {
      // Get the filename of the media to delete
      const fileNameToDelete = selectedMedia.getAttribute('data-filename');

      // Remove the selected media from the tray
      selectedMedia.remove();

      // Update the focused media to the next available media, if any
      const newSelectedMedia = document.querySelector(".tray-image");
      if (newSelectedMedia) {
          newSelectedMedia.classList.add("selected");

          // Check if the new selected media is an image or a video
          const mediaFileType = newSelectedMedia.getAttribute('data-file') ? "video" : "image";

          // Update the focused media container based on the media type
          if (mediaFileType === "image") {
              focusedImage.src = newSelectedMedia.src; // Set the focused image src
              focusedImage.style.display = "block"; // Show the image container
              focusedVideo.style.display = "none"; // Hide the video container
          } else if (mediaFileType === "video") {
              // Get the actual video file URL from the new selected media
              const videoFileUrl = newSelectedMedia.getAttribute('data-file');
              if (videoFileUrl) {
                  focusedVideo.src = videoFileUrl; // Set the focused video src
                  focusedVideo.style.display = "block"; // Show the video container
                  focusedImage.style.display = "none"; // Hide the image container
                  focusedVideo.load(); // Reload the video to ensure it plays correctly
              }
          }
      } else {
          // No more media in the tray, clear the focused media
          focusedImage.src = "";
          focusedVideo.src = "";
          focusedImage.style.display = "none";
          focusedVideo.style.display = "none";

          if (initialInterface) {
              initialInterface.style.display = "flex"; // Show the initial interface if no media is left
          }

          if (editingInterface) {
              editingInterface.style.display = "none"; // Hide the editing interface if no media is left
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
    
  // function showUploadProgressInterface() {
  //   if (editingInterface) {
  //     editingInterface.style.display = "none";
  //   }
  
  //   if (uploadProgressInterface) {
  //     uploadProgressInterface.style.display = "block";
  //   }
  // }

  // Function to show the upload progress interface
  function showUploadProgressInterface() {
    if (editingInterface) {
          editingInterface.style.display = "none";
    }
    if (uploadProgressInterface) {
          uploadProgressInterface.style.display = "block";
        }
  }
  
  // function createFileUploadInterface() {
  //   // Create the container div
  //   const interfaceDiv = document.createElement('div');
  //   interfaceDiv.className = 'file-upload-interface';

  //   // Create the "Browse/Drag files" text div
  //   const textDiv = document.createElement('div');
  //   textDiv.innerText = "Browse / Drag & Drop Photos";
  //   textDiv.className = 'browse-text';

  //   // Create the clickable div to open file explorer
  //   const uploadDiv = document.createElement('div');
  //   uploadDiv.className = 'upload-area';

  //   // Create the hidden file input
  //   const fileInput = document.createElement('input');
  //   fileInput.type = 'file';
  //   fileInput.multiple = true;
  //   fileInput.style.display = 'none'; // Hide the file input

  //   // Attach event listener to open file dialog
  //   uploadDiv.addEventListener('click', () => fileInput.click());

  //   // Handle file selection
  //   fileInput.addEventListener("change", (event) => {
  //     handleFileInput(event);

  //     // Hide the interface after files are selected
  //     // if (currentInterfaceDiv) {
  //     //   currentInterfaceDiv.style.display = 'none';
  //     //   uploadInterfaceDiv.style.display = 'none';
  //     // }
  //   });
   

  //   // Append elements to the interface div
  //   interfaceDiv.appendChild(textDiv);
  //   interfaceDiv.appendChild(uploadDiv);
  //   interfaceDiv.appendChild(fileInput);

  //   // Append the interface to the container
  //   // document.getElementById('interface-container').appendChild(interfaceDiv);
  //   // currentInterfaceDiv = interfaceDiv;
  // }
  let clearPreviousFiles = false; // Flag to control whether previous files should be cleared

// Function to create the file upload interface
// function createFileUploadInterface() {
//   // Create the container div
//   const interfaceDiv = document.createElement('div');
//   interfaceDiv.className = 'file-upload-interface';

//   // Create the "Browse/Drag files" text div
//   const textDiv = document.createElement('div');
//   textDiv.innerText = "Browse / Drag & Drop Photos";
//   textDiv.className = 'browse-text';

//   // Create the clickable div to open file explorer
//   const uploadDiv = document.createElement('div');
//   uploadDiv.className = 'upload-area';

//   // Create the hidden file input
//   const fileInput = document.createElement('input');
//   fileInput.type = 'file';
//   fileInput.multiple = true;
//   fileInput.style.display = 'none'; // Hide the file input

//   // Attach event listener to open file dialog
//   // uploadDiv.addEventListener('click', () => fileInput.click());

//   // When the user clicks the Browse button
//   uploadDiv.addEventListener('click', () => {
//     clearPreviousFiles = true;  // Set flag to true when browsing for new files
//     fileInput.click();          // Trigger the file dialog to open
//   });
//   // Handle file selection
//   fileInput.addEventListener("change", (event) => {
//     handleFileInput(event);
//       // Hide the interface after files are selected
//       if (currentInterfaceDiv) {
//         currentInterfaceDiv.style.display = 'none';
//         uploadInterfaceDiv.style.display = 'none';
//       }
  

//   });

//   // Append elements to the interface div
//   interfaceDiv.appendChild(textDiv);
//   interfaceDiv.appendChild(uploadDiv);
//   interfaceDiv.appendChild(fileInput);

//   // Append the interface to the container
//   document.getElementById('interface-container').appendChild(interfaceDiv);
//   currentInterfaceDiv = interfaceDiv;
//   }

// Function to create the file upload interface
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
  uploadDiv.addEventListener('click', () => {
      clearPreviousFiles = true;  // Set flag to true when browsing for new files
      fileInput.click();          // Trigger the file dialog to open
  });

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

    // Create delete button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("delete-button");
    buttonContainer.appendChild(deleteButton);

    deleteButton.addEventListener('click', async () => {
      console.log("deleteButton click");
      const isDeleted = await deleteFile(file.name); 
  
      if (isDeleted) {
        alert(`The file ${file.name} was successfully deleted.`);
        // fileListContainer.removeChild(fileContainer); 
      } else {
        alert(`Failed to delete the file ${file.name}.`);
      }
    });
  
    // Append the button container to the progress bar wrapper
    progressBarWrapper.appendChild(buttonContainer);
  
    progressContainer.appendChild(progressBarWrapper);

    return { progressBar, sizeLabel, thumbnail, deleteButton, progressBarWrapper };
  }
  
document.getElementById('uploadFilesButton').addEventListener('click', async () => {
  console.log("clicked");
  console.log(filesToUpload);

  createFileUploadInterface();
  // Show the upload progress interface
  showUploadProgressInterface();

  // Create the file upload interface (to be used after the initial upload)

  if (filesToUpload.length > 0) {
    // Create progress bars for each file
    const progressBars = filesToUpload.map(file => createProgressBar(file));
    
    try {
      // Simulate file upload and pass progress bars if necessary
      const result = await uploadFiles(filesToUpload, progressBars); 
      console.log('Upload completed:', result);

     

    } catch (error) {
      console.error('Error during file upload:', error);
    }
  } else {
    console.log('No files to upload.');
  }
  
});



});


