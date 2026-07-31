import { User } from './src/models';
import { sequelize } from './src/config/database';
import { comparePassword, hashPassword } from './src/utils/auth';
import { runSeeds } from './src/database/seed';

async function checkAndFixAdminLogin() {
  await sequelize.authenticate();
  console.log('Database connected.');

  let user = await User.findOne({
    where: { username: 'admin' },
  });

  if (!user) {
    console.log('Admin user not found. Running seed...');
    await runSeeds();
    user = await User.findOne({ where: { username: 'admin' } });
  }

  if (!user) {
    console.error('STILL NO ADMIN USER FOUND!');
    process.exit(1);
  }

  console.log('Found user:', {
    id: user.id,
    username: user.username,
    email: user.email,
    status: user.status,
    failed_login_attempts: user.failed_login_attempts,
    locked_until: user.locked_until,
  });

  const testPassword = 'AdminPassword123!';
  let isMatch = await comparePassword(testPassword, user.password_hash);
  console.log(`Password match test for '${testPassword}':`, isMatch);

  if (!isMatch || user.status !== 'ACTIVE' || user.failed_login_attempts > 0 || user.locked_until) {
    console.log('Resetting admin password and clearing locks...');
    const newHash = await hashPassword(testPassword);
    await user.update({
      password_hash: newHash,
      status: 'ACTIVE',
      failed_login_attempts: 0,
      locked_until: null,
    });

    isMatch = await comparePassword(testPassword, user.password_hash);
    console.log('After reset, password match test:', isMatch);
  }

  console.log('=== ADMIN LOGIN ACCOUNT IS FULLY READY ===');
  process.exit(0);
}

checkAndFixAdminLogin().catch((err) => {
  console.error(err);
  process.exit(1);
});
