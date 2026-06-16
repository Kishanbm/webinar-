const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database...');
  
  // Create a test user
  const user = await prisma.user.create({
    data: {
      name: 'Admin Test',
      email: 'admin-test-' + Date.now() + '@navigationtrading.com'
    }
  });
  console.log('✅ Created User:', user.email);

  // Create a test post
  const post = await prisma.post.create({
    data: {
      title: 'Hello from the New CMS',
      slug: 'hello-world-' + Date.now(),
      content: '<h1>Welcome!</h1><p>This is the first test post inserted successfully into Supabase.</p>',
      authorId: user.id
    }
  });
  console.log('✅ Created Post:', post.title);
  
  console.log('Database connection and schema are fully verified!');
}

main()
  .catch(e => {
    console.error('❌ Error during testing:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
