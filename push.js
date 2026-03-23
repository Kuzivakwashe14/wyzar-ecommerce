const { execSync } = require('child_process');

try {
  console.log('Adding backend file...');
  execSync('git add backend/routes/adminOrders.js');
  
  console.log('Adding frontend file...');
  execSync('git add "frontend/app/(admin)/admin/orders/page.tsx"');
  
  console.log('Committing...');
  execSync('git commit -m "fix(orders): align frontend status values with Prisma enums"');
  
  console.log('Pushing...');
  execSync('git push');
  
  console.log('Success!');
} catch (e) {
  console.error('Failed:', e.message);
  if (e.stdout) console.log(e.stdout.toString());
  if (e.stderr) console.error(e.stderr.toString());
}
