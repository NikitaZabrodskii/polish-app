import { Repository } from "typeorm";
import { User } from "../entity/User";
import { AppDataSource } from "../data-source";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables.");
}

export class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  // Register a new user
  async register(username: string, password: string): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });
    if (existingUser) {
      throw new Error("Username already exists");
    }

    // Create new user
    const user = new User();
    user.username = username;
    user.password = password;

    // Hash the password
    await user.hashPassword();

    // Save user to database
    return await this.userRepository.save(user);
  }

  // Login a user and generate a token
  async login(
    username: string,
    password: string
  ): Promise<{ user: User; token: string }> {
    // Find user
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      throw new Error("Invalid username or password");
    }

    // Check password
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid username or password");
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET as string,
      {
        expiresIn: "1d", // Token expires in 1 day
      }
    );

    return { user, token };
  }

  // Change user password
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<User> {
    // Find user
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isPasswordValid = await user.checkPassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Update password
    user.password = newPassword;
    await user.hashPassword();

    // Save updated user
    return await this.userRepository.save(user);
  }

  // Get user by ID
  async getUserById(id: number): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }
}

export default new UserService();
