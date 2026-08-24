import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('projects', { schema: 'public' })
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'uygulama_adi' })
  uygulamaAdi: string;

  @Column({ nullable: true })
  sektorluk: string;

  @Column({ name: 'tanim_uygulama_aciklama', nullable: true })
  tanimUygulamaAciklama: string;

  @Column({ name: 'canli_url', nullable: true })
  canliUrl: string;

  @Column({ name: 'test_url', nullable: true })
  testUrl: string;

  @Column({ name: 'aktif_pasif', nullable: true })
  aktifPasif: string;

  @Column({ nullable: true })
  frontend: string;

  @Column({ name: 'fe_version', nullable: true })
  feVersion: string;

  @Column({ nullable: true })
  backend: string;

  @Column({ name: 'be_version', nullable: true })
  beVersion: string;

  @Column({ name: 'database_type', nullable: true })
  databaseType: string;

  @Column({ nullable: true })
  platform: string;

  @Column({ name: 'de_sorumlu', nullable: true })
  deSorumlu: string;

  @Column({ name: 'sla', nullable: true })
  sla: string;

  @Column({ nullable: true })
  complexity: string;

  @Column({
    name: 'custom_fields',
    type: 'jsonb',
    nullable: true,
    default: () => "'{}'::jsonb",
  })
  customFields: Record<string, string>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
