import { db } from '../src/lib/db/index.js';
import { user } from '../src/lib/db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  // Check if admin exists
  const existingUsers = await db.select().from(user).where(eq(user.username, 'admin')).limit(1);
  
  if (existingUsers.length > 0) {
    // Update existing admin password
    await db.update(user)
      .set({ passwordHash: passwordHash })
      .where(eq(user.id, existingUsers[0].id));
    console.log('Admin password updated successfully: admin');
  } else {
    // Create new admin
    await db.insert(user).values({
      id: `admin-${Date.now()}`,
      username: 'admin',
      email: 'admin@notaris.com',
      passwordHash: passwordHash,
      fullName: 'Administrator',
      role: 'ADMINISTRATOR',
      isActive: true,
    });
    console.log('Admin user created successfully: admin / admin123');
  }
  
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
