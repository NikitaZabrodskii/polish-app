import { DataSource } from "typeorm";
import { Test } from "../entity/Test";
import { AppDataSource } from "../data-source";

class TestService {
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async deleteTest(id: number): Promise<void> {
    const testRepository = this.dataSource.getRepository(Test);
    await testRepository.delete(id);
  }

  async updateTest(
    id: number,
    type: string,
    title: string,
    content: any, // Flexible content object
    audiofile: string | null
  ): Promise<Test> {
    const testRepository = this.dataSource.getRepository(Test);

    const test = await testRepository.findOneBy({ id });

    if (!test) {
      throw new Error(`Test with ID ${id} not found`);
    }

    test.type = type;
    test.title = title;
    test.content = JSON.stringify(content); // Store content as JSON string
    test.audiofile = audiofile || "";

    return testRepository.save(test);
  }

  async createTest(
    type: string,
    title: string,
    content: any, // Flexible content object
    audiofile?: string
  ): Promise<Test> {
    const testRepository = this.dataSource.getRepository(Test);
    const test = new Test();
    test.type = type;
    test.title = title;
    test.content = JSON.stringify(content); // Store content as JSON string
    test.audiofile = audiofile || "";

    return testRepository.save(test);
  }

  async getAllTests(): Promise<Test[]> {
    const testRepository = this.dataSource.getRepository(Test);
    const tests = await testRepository.find({
      select: ["id", "type", "title"], // Only return basic info for list view
    });

    return tests;
  }

  async getTestById(id: number): Promise<Test | null> {
    const testRepository = this.dataSource.getRepository(Test);
    const test = await testRepository.findOneBy({ id });

    // Parse content back to object for API response
    if (test && test.content) {
      try {
        (test as any).parsedContent = JSON.parse(test.content);
      } catch (error) {
        console.error("Error parsing test content:", error);
        (test as any).parsedContent = {};
      }
    }

    return test;
  }
}

// Create an instance using AppDataSource
const testService = new TestService(AppDataSource);

export default testService;
