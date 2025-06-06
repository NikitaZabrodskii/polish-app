import { Repository } from "typeorm";
import { Test } from "../entity/Test";
import { AppDataSource } from "../data-source";

export class TestService {
  private testRepository: Repository<Test>;

  constructor() {
    this.testRepository = AppDataSource.getRepository(Test);
  }

  // Create a new test
  async createTest(
    title: string,
    text: string,
    answers: string[],
    type: string,
    audiofile?: string
  ): Promise<Test> {
    const test = new Test();
    test.title = title;
    test.text = text;
    test.answers = answers;
    test.audiofile = audiofile || "";

    return await this.testRepository.save(test);
  }

  // Get all tests (only titles)
  async getAllTests(): Promise<{ id: number; title: string }[]> {
    return await this.testRepository.find({
      select: ["id", "title"],
    });
  }

  // Get test by ID
  async getTestById(id: number): Promise<Test | null> {
    return await this.testRepository.findOneBy({ id });
  }

  // Delete test by ID
  async deleteTest(id: number): Promise<void> {
    await this.testRepository.delete(id);
  }
}

export default new TestService();
