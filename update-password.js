const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function updatePassword() {
  const prisma = new PrismaClient()

  try {
    console.log('🔐 Updating admin password...')

    // Hash the new password
    const newHashedPassword = await bcrypt.hash('tobito123', 12)

    // Update the demo admin user
    const updatedUser = await prisma.user.update({
      where: { email: 'demo@legalai.gov.in' },
      data: {
        password: newHashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        badge: true,
      },
    })

    console.log('✅ Password updated successfully!')
    console.log(`👤 User: ${updatedUser.name}`)
    console.log(`📧 Email: ${updatedUser.email}`)
    console.log(`🏷️ Badge: ${updatedUser.badge}`)
    console.log(`🔑 New Password: tobito123`)

  } catch (error) {
    console.error('❌ Error updating password:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updatePassword()
