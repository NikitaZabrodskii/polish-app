import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Test {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  text: string;

  @Column({
    type: "simple-json",
    transformer: {
      from: (value: string): string[] => JSON.parse(value),
      to: (value: string[]): string => JSON.stringify(value),
    },
  })
  answers: string[];

  @Column({ nullable: true })
  audiofile: string;
}
