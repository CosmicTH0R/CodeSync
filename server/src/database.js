import { MongoClient } from 'mongodb';
import { config } from './config.js';

let mongoClient = null;
let roomsDb = null;
let roomsCollection = null;

export const connectMongoDB = async () => {
  try {
    mongoClient = new MongoClient(config.MONGODB_URI);
    await mongoClient.connect();
    roomsDb = mongoClient.db('codesync');
    roomsCollection = roomsDb.collection('rooms');
    
    // Create index on roomId for faster lookups
    await roomsCollection.createIndex({ roomId: 1 });
    
    console.log('[MongoDB] Connected successfully');
  } catch (error) {
    console.error('[MongoDB] Connection error:', error.message);
    process.exit(1);
  }
};

export const getRoomFromDB = async (roomId) => {
  if (!roomsCollection) return null;
  return await roomsCollection.findOne({ roomId });
};

export const getRoomsFromDB = async () => {
  if (!roomsCollection) return [];
  return await roomsCollection.find({}).toArray();
};

export const saveRoomToDB = async (room) => {
  if (!roomsCollection) return;
  await roomsCollection.updateOne(
    { roomId: room.roomId },
    { $set: room },
    { upsert: true }
  );
};

export const deleteRoomFromDB = async (roomId) => {
  if (!roomsCollection) return;
  await roomsCollection.deleteOne({ roomId });
};

export const closeMongoDB = async () => {
  if (mongoClient) {
    await mongoClient.close();
    console.log('[MongoDB] Connection closed');
  }
};
