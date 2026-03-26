import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
       console.log("No user found");
       return;
    }
    const video = await prisma.video.create({
      data: {
        title: "Test Video",
        description: "Test Video",
        video_url: "https://ytgokwlwvgmjgkssckws.supabase.co/storage/v1/object/public/videos/4ytyrl0xa6u_1774510408595.webm",
        thumbnail_url: "https://ytgokwlwvgmjgkssckws.supabase.co/storage/v1/object/public/thumbnails/8b2v12yzrip_1774510417514.png",
        user_id: user.id
      }
    });
    console.log("Success:", video);
  } catch (e) {
    console.error("Prisma error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
