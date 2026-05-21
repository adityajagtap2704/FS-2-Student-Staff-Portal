import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

export async function GET() {
  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || "ap-south-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });

    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET_NAME || "",
      MaxKeys: 10,
      Prefix: "documents/students/",
    });

    const response = await s3Client.send(command);

    return NextResponse.json({
      success: true,
      bucket: process.env.AWS_S3_BUCKET_NAME,
      region: process.env.AWS_REGION,
      filesFound: response.Contents?.length || 0,
      files: response.Contents?.map(f => ({
        key: f.Key,
        size: f.Size,
        lastModified: f.LastModified,
      })) || [],
    });
  } catch (error) {
    console.error("S3 Test Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
