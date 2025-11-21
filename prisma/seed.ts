import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data (optional - hati-hati di production!)
  console.log('🧹 Cleaning existing data...');
  await prisma.activityLog.deleteMany();
  await prisma.service.deleteMany();
  await prisma.priceApproval.deleteMany();
  await prisma.dealItem.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.reportCache.deleteMany();

  // Hash password untuk semua user
  const defaultPassword = 'password123'; // Password default untuk semua user
  const hashedPassword = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

  // 1. Create Products
  console.log('📦 Creating products...');
  const products = await Promise.all([
    prisma.product.create({
      data: {
        code: 'PKG-50',
        name: 'Paket Internet 50 Mbps',
        description: 'Paket internet dengan kecepatan 50 Mbps, cocok untuk penggunaan rumah tangga',
        hpp: 200000, // Harga pokok penjualan
        marginPercent: 25.00, // Margin 25%
        sellingPrice: 250000, // 200000 * 1.25 = 250000
        speedMbps: 50,
        bandwidth: '50 Mbps',
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        code: 'PKG-100',
        name: 'Paket Internet 100 Mbps',
        description: 'Paket internet dengan kecepatan 100 Mbps, cocok untuk bisnis kecil',
        hpp: 350000,
        marginPercent: 30.00, // Margin 30%
        sellingPrice: 455000, // 350000 * 1.30 = 455000
        speedMbps: 100,
        bandwidth: '100 Mbps',
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        code: 'PKG-200',
        name: 'Paket Internet 200 Mbps',
        description: 'Paket internet dengan kecepatan 200 Mbps, cocok untuk bisnis menengah',
        hpp: 600000,
        marginPercent: 28.00, // Margin 28%
        sellingPrice: 768000, // 600000 * 1.28 = 768000
        speedMbps: 200,
        bandwidth: '200 Mbps',
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        code: 'PKG-500',
        name: 'Paket Internet 500 Mbps',
        description: 'Paket internet dengan kecepatan 500 Mbps, cocok untuk bisnis besar',
        hpp: 1200000,
        marginPercent: 25.00, // Margin 25%
        sellingPrice: 1500000, // 1200000 * 1.25 = 1500000
        speedMbps: 500,
        bandwidth: '500 Mbps',
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        code: 'PKG-1000',
        name: 'Paket Internet 1 Gbps',
        description: 'Paket internet dengan kecepatan 1 Gbps, cocok untuk enterprise',
        hpp: 2000000,
        marginPercent: 30.00, // Margin 30%
        sellingPrice: 2600000, // 2000000 * 1.30 = 2600000
        speedMbps: 1000,
        bandwidth: '1 Gbps',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products`);

  // 2. Create Managers
  console.log('👔 Creating managers...');
  const managers = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Budi Santoso',
        email: 'budi.manager@smart.com',
        password: hashedPassword,
        role: 'MANAGER',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Siti Nurhaliza',
        email: 'siti.manager@smart.com',
        password: hashedPassword,
        role: 'MANAGER',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${managers.length} managers`);

  // 3. Create Sales
  console.log('👤 Creating sales...');
  const sales = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Ahmad Fauzi',
        email: 'ahmad.sales@smart.com',
        password: hashedPassword,
        role: 'SALES',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Dewi Lestari',
        email: 'dewi.sales@smart.com',
        password: hashedPassword,
        role: 'SALES',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Rizki Pratama',
        email: 'rizki.sales@smart.com',
        password: hashedPassword,
        role: 'SALES',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Sari Indah',
        email: 'sari.sales@smart.com',
        password: hashedPassword,
        role: 'SALES',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Bambang Wijaya',
        email: 'bambang.sales@smart.com',
        password: hashedPassword,
        role: 'SALES',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${sales.length} sales`);

  // 4. Create Leads (2 leads untuk masing-masing sales = 10 leads total)
  console.log('📋 Creating leads...');
  const leadSources = ['WEBSITE', 'WALKIN', 'PARTNER', 'REFERRAL', 'OTHER'] as const;
  const leadStatuses = ['NEW', 'CONTACTED', 'QUALIFIED'] as const;

  const leads = [];

  // Lead untuk Sales 1 (Ahmad Fauzi)
  leads.push(
    prisma.lead.create({
      data: {
        name: 'PT. Maju Jaya',
        contact: '081234567890',
        email: 'contact@majujaya.com',
        address: 'Jl. Sudirman No. 123, Jakarta Pusat',
        needs: 'Internet 100 Mbps untuk kantor dengan 20 karyawan',
        source: 'WEBSITE',
        status: 'NEW',
        ownerId: sales[0].id,
      },
    }),
    prisma.lead.create({
      data: {
        name: 'CV. Sejahtera Abadi',
        contact: '081234567891',
        email: 'info@sejahteraabadi.com',
        address: 'Jl. Thamrin No. 456, Jakarta Pusat',
        needs: 'Internet 200 Mbps untuk data center',
        source: 'PARTNER',
        status: 'CONTACTED',
        ownerId: sales[0].id,
      },
    })
  );

  // Lead untuk Sales 2 (Dewi Lestari)
  leads.push(
    prisma.lead.create({
      data: {
        name: 'PT. Teknologi Nusantara',
        contact: '081234567892',
        email: 'sales@teknus.com',
        address: 'Jl. Gatot Subroto No. 789, Jakarta Selatan',
        needs: 'Internet 50 Mbps untuk rumah kantor',
        source: 'WALKIN',
        status: 'QUALIFIED',
        ownerId: sales[1].id,
      },
    }),
    prisma.lead.create({
      data: {
        name: 'UD. Makmur Sentosa',
        contact: '081234567893',
        email: 'ud.makmur@email.com',
        address: 'Jl. Kebon Jeruk No. 321, Jakarta Barat',
        needs: 'Internet 100 Mbps untuk toko online',
        source: 'REFERRAL',
        status: 'NEW',
        ownerId: sales[1].id,
      },
    })
  );

  // Lead untuk Sales 3 (Rizki Pratama)
  leads.push(
    prisma.lead.create({
      data: {
        name: 'PT. Digital Indonesia',
        contact: '081234567894',
        email: 'hello@digitalindo.com',
        address: 'Jl. HR Rasuna Said No. 654, Jakarta Selatan',
        needs: 'Internet 500 Mbps untuk server hosting',
        source: 'WEBSITE',
        status: 'CONTACTED',
        ownerId: sales[2].id,
      },
    }),
    prisma.lead.create({
      data: {
        name: 'CV. Mandiri Jaya',
        contact: '081234567895',
        email: 'info@mandirijaya.com',
        address: 'Jl. Pasar Minggu No. 987, Jakarta Selatan',
        needs: 'Internet 200 Mbps untuk backup server',
        source: 'PARTNER',
        status: 'QUALIFIED',
        ownerId: sales[2].id,
      },
    })
  );

  // Lead untuk Sales 4 (Sari Indah)
  leads.push(
    prisma.lead.create({
      data: {
        name: 'PT. Global Solutions',
        contact: '081234567896',
        email: 'contact@globalsol.com',
        address: 'Jl. Kuningan No. 147, Jakarta Selatan',
        needs: 'Internet 1 Gbps untuk data center enterprise',
        source: 'WEBSITE',
        status: 'NEW',
        ownerId: sales[3].id,
      },
    }),
    prisma.lead.create({
      data: {
        name: 'PT. Sinergi Digital',
        contact: '081234567897',
        email: 'info@sinergidigital.com',
        address: 'Jl. Senopati No. 258, Jakarta Selatan',
        needs: 'Internet 100 Mbps untuk kantor cabang',
        source: 'WALKIN',
        status: 'CONTACTED',
        ownerId: sales[3].id,
      },
    })
  );

  // Lead untuk Sales 5 (Bambang Wijaya)
  leads.push(
    prisma.lead.create({
      data: {
        name: 'CV. Prima Teknologi',
        contact: '081234567898',
        email: 'prima@teknologi.com',
        address: 'Jl. Cikini No. 369, Jakarta Pusat',
        needs: 'Internet 50 Mbps untuk startup',
        source: 'REFERRAL',
        status: 'QUALIFIED',
        ownerId: sales[4].id,
      },
    }),
    prisma.lead.create({
      data: {
        name: 'PT. Nusantara Sejahtera',
        contact: '081234567899',
        email: 'nusantara@sejahtera.com',
        address: 'Jl. Menteng No. 741, Jakarta Pusat',
        needs: 'Internet 200 Mbps untuk kantor pusat',
        source: 'OTHER',
        status: 'NEW',
        ownerId: sales[4].id,
      },
    })
  );

  const createdLeads = await Promise.all(leads);
  console.log(`✅ Created ${createdLeads.length} leads`);

  // Summary
  console.log('\n📊 Seed Summary:');
  console.log(`   Products: ${products.length}`);
  console.log(`   Managers: ${managers.length}`);
  console.log(`   Sales: ${sales.length}`);
  console.log(`   Leads: ${createdLeads.length}`);
  console.log('\n🔑 Default password for all users: password123');
  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

