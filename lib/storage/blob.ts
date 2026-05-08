import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  type PutBlobResult,
  type PutCommandOptions,
  put as vercelPut,
} from "@vercel/blob";

type PutBody = Parameters<typeof vercelPut>[1];

class BlobStorage {
  private s3: S3Client | null = null;
  private readonly bucket: string;
  private readonly endpoint: string;
  private readonly useLocal: boolean;

  constructor() {
    this.bucket = process.env.MINIO_BUCKET ?? "chatbot";
    this.endpoint = process.env.MINIO_ENDPOINT ?? "http://localhost:9000";
    this.useLocal = !process.env.BLOB_READ_WRITE_TOKEN;
  }

  private getClient(): S3Client {
    if (!this.s3) {
      this.s3 = new S3Client({
        endpoint: this.endpoint,
        region: "us-east-1",
        credentials: {
          accessKeyId: process.env.MINIO_ROOT_USER ?? "minioadmin",
          secretAccessKey: process.env.MINIO_ROOT_PASSWORD ?? "minioadmin",
        },
        forcePathStyle: true,
      });
    }
    return this.s3;
  }

  private async ensureBucket(): Promise<void> {
    const client = this.getClient();
    try {
      await client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  private async toBuffer(body: PutBody): Promise<Buffer> {
    if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
      return Buffer.from(body as ArrayBuffer);
    }
    if (body instanceof Blob) {
      return Buffer.from(await body.arrayBuffer());
    }
    if (typeof body === "string") {
      return Buffer.from(body, "utf-8");
    }
    // ReadableStream
    const chunks: Uint8Array[] = [];
    const reader = (body as ReadableStream<Uint8Array>).getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        chunks.push(value);
      }
    }
    return Buffer.concat(chunks);
  }

  async put(
    pathname: string,
    body: PutBody,
    options: PutCommandOptions
  ): Promise<PutBlobResult> {
    if (!this.useLocal) {
      return vercelPut(pathname, body, options);
    }

    await this.ensureBucket();
    const buffer = await this.toBuffer(body);
    const client = this.getClient();

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: pathname,
        Body: buffer,
        ContentType: options?.contentType ?? "application/octet-stream",
        ACL: options?.access === "public" ? "public-read" : undefined,
      })
    );

    const url = `${this.endpoint}/${this.bucket}/${pathname}`;
    return {
      url,
      downloadUrl: url,
      pathname,
      contentType: options?.contentType ?? "application/octet-stream",
      contentDisposition: `attachment; filename="${pathname}"`,
    };
  }
}

export const blob = new BlobStorage();
