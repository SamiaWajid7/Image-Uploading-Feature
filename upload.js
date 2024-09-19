const bearerToken = '141ce8f86b51248a2c47a687cfc6b2432c77e47c4eb278025cb534dacfe02092';

const uploadFiles = async (files) => {
  try {
    const response = await axios.post(
      'https://brickell-watch-new.herokuapp.com/api/v1/uploads/images',
      {
        filenames: files.map((file) => file.name),
      },
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    );

    const { urls } = response.data;

    const uploadPromises = urls.map(async (urlObj, index) => {
      const file = files[index];
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
          },
        });

        return urlObj.unique_filename;
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
        return null;
      }
    });

    const uploadedFileNames = await Promise.all(uploadPromises);

    const successfulUploads = uploadedFileNames.filter(
      (name) => name !== null
    );
    console.log('Successfully uploaded files:', successfulUploads);

    return successfulUploads;
  } catch (error) {
    console.error('Error fetching pre-signed URLs:', error);
    return [];
  }
};

export default uploadFiles;
