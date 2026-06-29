import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassThrough, Readable } from 'stream';
import { Client } from 'minio';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { fileViewSelect } from './file.selects';
import { DeleteFilePayloadDto, FileBaseEntityResponseDto, InitUploadDto, PresignedUrlEntityDto, UploadDataEntityDto } from './file.schema';


@Injectable()
export class FileService {
  private readonly client: Client;
  private readonly bucket: string;
  private readonly logger = new Logger(FileService.name);

  private readonly UPLOAD_TTL_SECONDS = 30 * 60; // 30 минут
  private readonly DOWNLOAD_TTL_SECONDS = 24 * 60 * 60; // 24 часа
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB

  private readonly minioHost: string;
  private readonly minioPort?: number;
  private readonly minioUseSSL: boolean;


  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const minioHost = this.configService.getOrThrow<string>('MINIO_HOST', { infer: true });
    const minioPort = this.configService.get<number>('MINIO_PORT', { infer: true });
    const minioUseSSL = this.configService.get<boolean>('MINIO_USE_SSL', { infer: true });
    const minioAccessKey = this.configService.get<string>('MINIO_ROOT_USER', { infer: true });
    const minioSecretKey = this.configService.get<string>('MINIO_ROOT_PASSWORD', { infer: true });
    this.bucket = this.configService.getOrThrow<string>('MINIO_BUCKET', { infer: true });

    // Сохраняем для дальнейшего использования
    this.minioHost = minioHost;
    this.minioPort = minioPort;
    this.minioUseSSL = minioUseSSL;

    this.client = new Client({
      endPoint: minioHost,
      port: minioPort,
      useSSL: minioUseSSL,
      accessKey: minioAccessKey,
      secretKey: minioSecretKey,
    });
    this.testConnection();
  }


  /*
  Проверяет подключение к MinIO
  */
  private async testConnection(): Promise<void> {
    try {
      const bucketExists = await this.client.bucketExists(this.bucket);
      if (!bucketExists) {
        this.logger.warn(`Bucket ${this.bucket} does not exist. Attempting to create...`);
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Bucket ${this.bucket} created successfully`);
      } else {
        this.logger.log(`Bucket ${this.bucket} exists`);
      }
      const buckets = await this.client.listBuckets();
      this.logger.log(`Successfully connected to MinIO. Available buckets: ${buckets.map(b => b.name).join(', ')}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to connect to MinIO:', error);
      throw new Error(`MinIO connection failed: ${errorMessage}`);
    }
  }


  /*
  Генерирует presigned URL для загрузки файла
  */
  async getUploadUrl(data: InitUploadDto): Promise<UploadDataEntityDto> {
    const { fileName, fileSize, mimeType } = data;

    if (fileSize > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    const objectKey = uuidv4();
    const expiresAt = new Date(Date.now() + this.UPLOAD_TTL_SECONDS * 1000);

    const url = await this.client.presignedPutObject(
      this.bucket,
      objectKey,
      this.UPLOAD_TTL_SECONDS,
    );

    return {
      objectKey,
      url,
      expiresAt,
      fileName,
      fileSize,
      mimeType: mimeType || 'application/octet-stream',
    };
  }


  /*
  Генерирует presigned URL для скачивания файла
  */
  async getDownloadUrl(objectKey: string): Promise<PresignedUrlEntityDto> {
    // Проверяем существование в БД
    const file = await this.prisma.file.findFirst({
      where: {
        objectKey,
        isDeleted: false,
      },
    });

    if (!file) {
      throw new NotFoundException(`File with key ${objectKey} not found in database`);
    }

    // Проверяем существование в MinIO
    await this.verifyFileInMinIO(objectKey);

    const expiresAt = new Date(Date.now() + this.DOWNLOAD_TTL_SECONDS * 1000);

    const url = await this.client.presignedGetObject(
      this.bucket,
      objectKey,
      this.DOWNLOAD_TTL_SECONDS,
    );

    return { url, expiresAt };
  }


  /*
  Сохраняет метаданные файла после успешной загрузки
  */
  async saveFileMetadata(
    userId: number,
    objectKey: string,
    ftsFunctionDetailId: number,
    originalName: string,
    fileSize: number,
    mimeType: string,
  ): Promise<FileBaseEntityResponseDto> {
    await this.verifyFileInMinIO(objectKey);
    await this.ensureFileNotExists(objectKey);

    return this.prisma.file.create({
      data: {
        creatorId: userId,
        ftsFunctionDetailId,
        objectKey,
        originalName,
        size: fileSize,
        mimeType,
        isUploadConfirmed: true,
      },
      select: fileViewSelect,
    });
  }
  
  /*
  Мягкое удаление в БД + физическое удаление из MinIO.
  */
  async deleteFile(userId: number, objectKey: string): Promise<DeleteFilePayloadDto> {
    const files = await this.prisma.file.findMany({
      where: {
        objectKey,
        isDeleted: false,
      },
      select: {
        id: true,
        ftsFunctionDetailId: true,
      },
    });

    if (files.length === 0) {
      throw new NotFoundException(`No active files with key ${objectKey} found`);
    }

    const deletedAt = new Date();

    await this.prisma.file.updateMany({
      where: { id: { in: files.map(f => f.id) } },
      data: {
        deleterId: userId,
        deletedAt,
        isDeleted: true,
      },
    });

    await this.deleteFileByKey(objectKey);

    return {
      success: true,
      objectKey,
      deletedAt,
    };
  }

  /**
   * Получает информацию о файле по objectKey
   */
  async getFileInfo(objectKey: string): Promise<FileBaseEntityResponseDto> {
    const file = await this.prisma.file.findFirst({
      where: {
        objectKey,
        isDeleted: false,
      },
      select: fileViewSelect,
    });

    if (!file) {
      throw new NotFoundException(`File with key ${objectKey} not found`);
    }

    return file;
  }

  /**
   * Получает все файлы функции детализации
   */
  async getFilesByFtsFunctionDetail(ftsFunctionDetailId: number): Promise<FileBaseEntityResponseDto[]> {
    const files = await this.prisma.file.findMany({
      where: {
        ftsFunctionDetailId,
        isDeleted: false,
      },
      select: fileViewSelect,
      orderBy: { createdAt: 'desc' },
    });

    return files;
  }

  /**
   * Проверяет существование файла в MinIO
   */
  private async verifyFileInMinIO(objectKey: string): Promise<void> {
    try {
      await this.client.statObject(this.bucket, objectKey);
    } catch (error: any) {
      if (error.code === 'NotFound') {
        throw new NotFoundException(`File with key ${objectKey} not found in storage`);
      }
      throw error;
    }
  }

  /**
   * Убеждается, что файл с таким objectKey еще не существует в БД
   */
  private async ensureFileNotExists(objectKey: string): Promise<void> {
    const existingFile = await this.prisma.file.findFirst({
      where: { objectKey, isDeleted: false },
    });

    if (existingFile) {
      throw new BadRequestException(`File with key ${objectKey} already exists in database`);
    }
  }

  /**
  * Получение списка объектов в бакете с префиксом
  */
  async listObjects(prefix: string): Promise<{ name: string; size: number; modified: Date }[]> {
    const objects: { name: string; size: number; modified: Date }[] = [];

    return new Promise((resolve, reject) => {
      const stream = this.client.listObjects(this.bucket, prefix, true);

      stream.on('data', obj => {
        if (obj.name) {
          objects.push({
            name: obj.name,
            size: obj.size || 0,
            modified: obj.lastModified || new Date(),
          });
        }
      });

      stream.on('error', reject);
      stream.on('end', () => resolve(objects));
    });
  }

  /**
  * Проверка существования файла в MinIO
  */
  async checkFileExists(objectKey: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucket, objectKey);
      return true;
    } catch (error: any) {
      if (error.code === 'NotFound') {
        return false;
      }
      this.logger.error(`Error checking file ${objectKey}: ${error.message}`);
      return false;
    }
  }

  /**
   * Получение потока файла из MinIO
   */
  async getFileStream(objectKey: string): Promise<Readable> {
    const exists = await this.checkFileExists(objectKey);
    if (!exists) {
      throw new NotFoundException(`File with key ${objectKey} not found in storage`);
    }

    try {
      const stream = await this.client.getObject(this.bucket, objectKey);
      return stream;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Загрузка стрима в MinIO
   */
  async getUploadStream(objectKey: string): Promise<PassThrough> {
    const pass = new PassThrough();
    const uploadPromise = this.client.putObject(this.bucket, objectKey, pass);
    this.uploadPromises.set(objectKey, uploadPromise);

    uploadPromise
      .then((etag) => {
        this.uploadPromises.delete(objectKey);
      })
      .catch(err => {
        this.uploadPromises.delete(objectKey);
        pass.destroy(err);
      });

    return pass;
  }

  /**
   * Удаление файла по objectKey
   */
  async deleteFileByKey(objectKey: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, objectKey);
      this.logger.log(`File ${objectKey} deleted from MinIO`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      this.logger.error(`Failed to delete ${objectKey}: ${message}`);
    }
  }

  private uploadPromises = new Map<string, Promise<any>>();

  async getUploadPromise(objectKey: string): Promise<any> {
    const promise = this.uploadPromises.get(objectKey);
    if (!promise) {
      throw new Error(`No upload in progress for ${objectKey}`);
    }
    return promise;
  }
}
