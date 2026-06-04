import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";

/**
 * Upload a file to AWS S3
 * @param file - File object from FormData
 * @param folder - Folder path in S3 (e.g., "documents/students")
 * @param fileName - Custom file name (optional)
 * @returns S3 key (not full URL)
 */
export async function uploadToS3(
  file: File,
  folder: string,
  fileName?: string
): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename - use timestamp only, no spaces
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const uniqueFileName = fileName || `${timestamp}.${fileExtension}`;
    const s3Key = `${folder}/${uniqueFileName}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        "original-name": file.name,
        "upload-date": new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    // Return S3 key only (not full URL)
    return s3Key;
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error("Failed to upload file to S3");
  }
}

/**
 * Generate a signed URL for downloading/viewing a file from S3
 * @param s3Key - S3 object key (not full URL)
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL
 */
export async function getSignedDownloadUrl(
  s3Key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error("Signed URL Generation Error:", error);
    throw new Error("Failed to generate signed URL");
  }
}

/**
 * Delete a file from S3
 * @param s3Key - S3 object key (not full URL)
 */
export async function deleteFromS3(s3Key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error("S3 Delete Error:", error);
    throw new Error("Failed to delete file from S3");
  }
}

/**
 * Check whether an S3 key exists in the bucket (HEAD request — no data transfer)
 * @param s3Key - S3 object key
 * @returns true if the object exists, false otherwise
 */
export async function s3KeyExists(s3Key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });
    await s3Client.send(command);
    return true;
  } catch (error: any) {
    // 404 / NoSuchKey means the object doesn't exist
    if (error?.name === "NotFound" || error?.$metadata?.httpStatusCode === 404) {
      return false;
    }
    // Re-throw unexpected errors (permissions, network, etc.)
    throw error;
  }
}

/**
 * Extract S3 key from full S3 URL or return as-is if already a key
 * @param s3Url - Full S3 URL or S3 key
 * @returns S3 key
 */
export function extractS3KeyFromUrl(s3Url: string): string {
  try {
    // If it's already a key (doesn't start with http), return as-is
    if (!s3Url.startsWith("http")) {
      return s3Url;
    }
    
    // Extract key from full URL
    // URL format: https://bucket.s3.region.amazonaws.com/key
    const url = new URL(s3Url);
    let key = url.pathname.substring(1); // Remove leading slash
    
    // Decode the key to handle URL-encoded characters
    key = decodeURIComponent(key);
    
    return key;
  } catch {
    return s3Url;
  }
}

