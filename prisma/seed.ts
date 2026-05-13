import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10)

  // Create Superadmin
  const superadmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      email: 'admin@notaris.com',
      passwordHash: passwordHash,
      fullName: 'Super Administrator',
      role: Role.SUPERADMIN,
    },
  })

  console.log('Superadmin created:', superadmin.username)

  // Create some sample clients
  const client1 = await prisma.client.create({
    data: {
      name: 'Budi Santoso',
      email: 'budi@example.com',
      phone: '08123456789',
      address: 'Jl. Merdeka No. 10, Jakarta',
      npwp: '12.345.678.9-012.000',
    },
  })

  console.log('Sample client created:', client1.name)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
