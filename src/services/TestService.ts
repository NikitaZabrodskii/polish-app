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
    title: string,
    text: string,
    answers: string[],
    audiofile: string | null
  ): Promise<Test> {
    const testRepository = this.dataSource.getRepository(Test);

    const test = await testRepository.findOneBy({ id });

    if (!test) {
      throw new Error(`Test with ID ${id} not found`);
    }

    test.title = title;
    test.text = text;
    test.answers = answers;

    // Handle null or undefined
    if (audiofile === null || audiofile === undefined) {
      test.audiofile = ""; // Empty string for no audio
    } else {
      test.audiofile = audiofile;
    }

    return testRepository.save(test);
  }

  async createTest(
    title: string,
    text: string,
    answers: string[],
    audiofile?: string
  ): Promise<Test> {
    const testRepository = this.dataSource.getRepository(Test);
    const test = new Test();
    test.title = title;
    test.text = text;
    test.answers = answers;

    // Handle undefined
    test.audiofile = audiofile || "";

    return testRepository.save(test);
  }

  async getAllTests(): Promise<Test[]> {
    const testRepository = this.dataSource.getRepository(Test);
    return testRepository.find();
  }

  async getTestById(id: number): Promise<Test | null> {
    const testRepository = this.dataSource.getRepository(Test);
    return testRepository.findOneBy({ id });
  }
}

// Create an instance using AppDataSource
const testService = new TestService(AppDataSource);

export default testService;
