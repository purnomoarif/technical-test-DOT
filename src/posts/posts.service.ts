import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreatePostDto {
  title: string;
  content: string;
}

export class UpdatePostDto {
  title?: string;
  content?: string;
}

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePostDto, authorId: number) {
    return this.prisma.post.create({
      data: {
        title: dto.title,
        content: dto.content,
        authorId,
      },
    });
  }

  findAll() {
    return this.prisma.post.findMany({
      include: { author: { select: { id: true, name: true, email: true } } },
    });
  }

  findOne(id: number) {
    return this.prisma.post.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
  }

  update(id: number, dto: UpdatePostDto) {
    return this.prisma.post.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.post.delete({ where: { id } });
  }
}
