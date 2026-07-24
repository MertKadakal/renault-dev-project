import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

export interface Item {
  id: number;            // Otomatik artan ID
  ad: string;            // Primary Key (Benzersiz Kimlik)
  direktörlük: string;
  tanım?: string;        // Opsiyonel
  url: string;
  test_url?: string;     // Opsiyonel
  aktif_pasif: boolean;
  frontend: string;
  fe_version: string;
  backend: string;
  be_version: string;
  database: string;
  platform: string;
  dev: string;
  sla: string;
}

@Injectable()
export class ItemsService {
  private items: Item[] = [];
  private idCounter = 1;

  // READ ALL (Hepsini Getir)
  findAll(): Item[] {
    return this.items;
  }

  // READ ONE (Tek Birini Getir)
  findOne(id: number): Item {
    const item = this.items.find((i) => i.id === id);
    if (!item) {
      throw new NotFoundException(`${id} ID'li öge bulunamadı.`);
    }
    return item;
  }

  // CREATE (Ekle)
  create(createItemDto: CreateItemDto): Item {
    const newItem: Item = {
      id: this.idCounter++,
      ...createItemDto,
    };
    this.items.push(newItem);
    return newItem;
  }

  // UPDATE (Güncelle)
  update(id: number, updateItemDto: UpdateItemDto): Item {
    const item = this.findOne(id); // Yoksa hata fırlatır
    const updatedItem = { ...item, ...updateItemDto };
    
    this.items = this.items.map((i) => (i.id === id ? updatedItem : i));
    return updatedItem;
  }

  // DELETE (Sil)
  remove(id: number): { message: string } {
    this.findOne(id); // Var olduğunu doğrula
    this.items = this.items.filter((i) => i.id !== id);
    return { message: `${id} ID'li öge başarıyla silindi.` };
  }
}