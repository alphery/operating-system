import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
    private s3: AWS.S3;

    constructor(private configService: ConfigService) {
        this.s3 = new AWS.S3({
            accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
            region: this.configService.get('AWS_REGION'),
        });
    }

    async uploadFile(file: Express.Multer.File, bucket: string) {
        const { originalname, buffer, mimetype } = file;

        const params = {
            Bucket: bucket,
            Key: `${Date.now()}-${originalname}`,
            Body: buffer,
            ContentType: mimetype,
            ACL: 'public-read',
        };

        return await this.s3.upload(params).promise();
    }

    async getFile(key: string, bucket: string) {
        const params = {
            Bucket: bucket,
            Key: key,
        };
        return await this.s3.getObject(params).promise();
    }
}
