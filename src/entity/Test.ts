import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Test {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string; // e.g., "multiple_choice", "true_false", "audio_question", etc.

  @Column()
  title: string;

  @Column("text")
  content: string; // JSON string containing flexible content based on type

  @Column({ nullable: true })
  audiofile: string; // Path to audio file if exists
}
