const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.POSTGRES_USER || 'assetuser'}:${process.env.POSTGRES_PASSWORD || 'AssetSecure2026!Passwd'}@${process.env.DB_HOST || 'asset-postgres'}:${process.env.DB_PORT || 5432}/${process.env.POSTGRES_DB || 'assetdb'}`,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  logger.info('Kết nối cơ sở dữ liệu PostgreSQL thành công');
});

pool.on('error', (err) => {
  logger.error('Lỗi kết nối cơ sở dữ liệu PostgreSQL không mong đợi', { error: err.message, stack: err.stack });
});

// Hàm khởi tạo DB tự động nếu cần
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    logger.info('Đang kiểm tra và khởi tạo bảng dữ liệu...');
    
    const possibleInitPaths = [
      path.join(__dirname, '../../database/init.sql'),
      path.join(__dirname, '../database/init.sql'),
      '/docker-entrypoint-initdb.d/01-init.sql'
    ];
    let initSqlPath = possibleInitPaths.find(p => fs.existsSync(p));
    if (initSqlPath) {
      const initSql = fs.readFileSync(initSqlPath, 'utf8');
      await client.query(initSql);
      logger.info(`Cấu trúc bảng từ ${initSqlPath} đã sẵn sàng`);
    }

    // Kiểm tra dữ liệu tài sản, nếu rỗng thì nạp seed.sql
    const countRes = await client.query('SELECT COUNT(*) FROM assets');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      const possibleSeedPaths = [
        path.join(__dirname, '../../database/seed.sql'),
        path.join(__dirname, '../database/seed.sql'),
        '/docker-entrypoint-initdb.d/02-seed.sql'
      ];
      let seedSqlPath = possibleSeedPaths.find(p => fs.existsSync(p));
      if (seedSqlPath) {
        logger.info(`Bảng assets rỗng. Đang tự động nạp dữ liệu mẫu từ ${seedSqlPath}...`);
        const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
        await client.query(seedSql);
        logger.info('Nạp dữ liệu mẫu thành công!');
      }
    } else {
      logger.info(`Cơ sở dữ liệu đã có sẵn ${countRes.rows[0].count} tài sản.`);
    }

    client.release();
  } catch (err) {
    logger.error('Lỗi khi khởi tạo cơ sở dữ liệu', { error: err.message });
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initializeDatabase,
};
