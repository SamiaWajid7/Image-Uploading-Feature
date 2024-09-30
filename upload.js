const bearerToken = '2edb2031c84ca06814efa780c7af6dda75b44500569ff1314de7e731f1b5694c';

const uploadFiles = async (files, progressBars) => {
  console.log("uploadFiles", files);
  try {
    const response = await axios.post(
      // 'https://brickell-watch-new.herokuapp.com/api/v1/uploads/images',
      {
        filenames: files.map((file) => file.name),
      },
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    );

    console.log('Response:', response);

    if (!response.data || !response.data.data || !response.data.data.urls) {
      throw new Error('No URLs returned from the server');
    }

    const { urls } = response.data.data;

    const uploadPromises = urls.map(async (urlObj, index) => {
      const file = files[index];
      const { progressBar, sizeLabel, thumbnail } = progressBars[index]; // Get progress bar elements

      try {
        await axios.put(urlObj.url, file, {
          headers: {
            'Content-Type': file.type,
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            console.log(`Upload progress for ${file.name}: ${percentCompleted}%`);

            // Update progress bar
            if (progressBar) {
              progressBar.style.width = `${percentCompleted}%`;
            }  else {
              console.error('Progress bar element is missing');
            }

            // Update size label
            if (sizeLabel) {
              sizeLabel.textContent = `${(progressEvent.loaded / (1024 * 1024)).toFixed(2)} MB of ${(file.size / (1024 * 1024)).toFixed(2)} MB`;
            }
          },
        });

        // Set the thumbnail source after upload
        thumbnail.src = URL.createObjectURL(file);
        thumbnail.alt = file.name; 

        return urlObj.unique_filename;
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
        return null;
      }
    });

    const uploadedFileNames = await Promise.all(uploadPromises);
    const successfulUploads = uploadedFileNames.filter((name) => name !== null);
    console.log('Successfully uploaded files:', successfulUploads);
    return successfulUploads;
  } catch (error) {
    console.error('Error fetching pre-signed URLs:', error);
    return [];
  }
};



const deleteFile = async (fileName) => {
  try {
    const response = await axios.delete(
      `https://your-api-endpoint.com/api/v1/uploads/images/${fileName}`, 
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    );

    console.log('File deleted successfully:', response.data);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false; 
  }
};

window.deleteFile = deleteFile;

export default uploadFiles;
export { deleteFile };
