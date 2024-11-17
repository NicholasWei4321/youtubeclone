import express from 'express';
import {uploadThumbnail} from "./storage";

import { 
  uploadProcessedVideo,
  downloadRawVideo,
  deleteRawVideo,
  deleteProcessedVideo,
  deleteThumbnail,
  convertVideo,
  setupDirectories,
  generateThumbnail
} from './storage';

// Create the local directories for videos
setupDirectories();

const app = express();
app.use(express.json());

import { isVideoNew, setVideo } from "./firestore";
import { storage } from 'firebase-admin';
// Process a video file from Cloud Storage into 360p

app.post('/process-video', async (req, res) => {

  // Get the bucket and filename from the Cloud Pub/Sub message
  let data;
  try {
    const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
    data = JSON.parse(message);
    if (!data.name) {
      throw new Error('Invalid message payload received.');
    }
  } catch (error) {
    console.error(error);
    res.status(400).send('Bad Request: missing video file name.');
    return;
  }

  const inputFileName = data.name; // In format of <UID>-<DATE>.<EXTENSION>
  const outputFileName = `processed-${inputFileName}`;
  const videoId = inputFileName.split('.')[0];

  if (!isVideoNew(videoId)) {
    res.status(400).send('Bad Request: video already processing or processed.');
    return;
  } else {
    await setVideo(videoId, {
      id: videoId,
      uid: videoId.split('-')[0],
      status: 'processing'
    });
  }

  // Download the raw video from Cloud Storage
  await downloadRawVideo(inputFileName);
  let thumbnailFileName = videoId + ".jpg";
  // Process the video into 360p
  try { 
    await convertVideo(inputFileName, outputFileName);
    await generateThumbnail(inputFileName, thumbnailFileName)
  } catch (err) {
    await Promise.all([
      deleteRawVideo(inputFileName),
      deleteProcessedVideo(outputFileName),
      deleteThumbnail(thumbnailFileName)
    ]);
     res.status(500).send('Processing failed');
     return;
  }

  // Upload the processed video to Cloud Storage
  await uploadProcessedVideo(outputFileName);
  await uploadThumbnail(thumbnailFileName);

  await setVideo(videoId, {
    status: 'processed',
    filename: outputFileName
  });

  await Promise.all([
    deleteRawVideo(inputFileName),
    deleteProcessedVideo(outputFileName),
    deleteThumbnail(thumbnailFileName)
  ]);

   res.status(200).send('Processing finished successfully');
   return;
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
