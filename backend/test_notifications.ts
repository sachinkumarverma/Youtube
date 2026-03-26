import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const notifs = await prisma.notification.findMany();
    console.log('Notifications:', notifs.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
