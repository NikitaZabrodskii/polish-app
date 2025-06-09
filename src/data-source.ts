import "reflect-metadata";
import { DataSource } from "typeorm";
import { Test } from "./entity/Test";
import { User } from "./entity/User";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists for persistent storage
const uploadsDir = path.join(__dirname, "../uploads");
const audioDir = path.join(uploadsDir, "audio");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory for persistent storage");
}

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
  console.log("Created audio subdirectory for audio files");
}

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: path.join(__dirname, "../uploads/tests.db"),
  synchronize: true,
  logging: false,
  entities: [Test, User],
  migrations: [],
  subscribers: [],
});

// Initialize the data source
export const initializeDataSource = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log("Data Source has been initialized!");
    console.log(
      "Database location:",
      path.join(__dirname, "../uploads/tests.db")
    );
    console.log(
      "Audio files location:",
      path.join(__dirname, "../uploads/audio")
    );
  } catch (error) {
    console.error("Error during Data Source initialization:", error);
    throw error;
  }
};
