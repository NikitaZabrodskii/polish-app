import "reflect-metadata";
import { DataSource } from "typeorm";
import { Test } from "./entity/Test";
import { User } from "./entity/User";
import path from "path";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "tests.db",
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
  } catch (error) {
    console.error("Error during Data Source initialization:", error);
    throw error;
  }
};
