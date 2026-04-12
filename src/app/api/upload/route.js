import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || "http://localhost:9000",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "admin",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "password",
  },
  forcePathStyle: true, // Required for MinIO
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
    const bucketName = process.env.MINIO_BUCKET || "photos";

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // Public URL construction
    // If MINIO_PUBLIC_URL is provided, use it, otherwise fallback to the endpoint/bucket
    const publicUrlBase = process.env.MINIO_PUBLIC_URL || `${process.env.MINIO_ENDPOINT || "http://localhost:9000"}/${bucketName}`;
    const imageUrl = `${publicUrlBase}/${fileName}`;

    return Response.json({ imageUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
