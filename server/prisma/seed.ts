import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

const drinks: [string, string, number][] = [
  ["Iced Latte", "12oz", 49], ["Iced Latte", "16oz", 59],
  ["Salted Caramel", "12oz", 69], ["Salted Caramel", "16oz", 79],
  ["Mocha", "12oz", 69], ["Mocha", "16oz", 79],
  ["Dark Choco", "12oz", 45], ["Dark Choco", "16oz", 55],
  ["Oreo Choco", "12oz", 59], ["Oreo Choco", "16oz", 69],
  ["Oreo C'n Cream", "12oz", 59],
  ["Black Coffee", "16oz", 45],
  ["Coffee Matcha", "16oz", 79],
  ["Milky Matcha", "16oz", 69],
];

async function main() {
  await prisma.inventoryLog.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();

  for (const [name, size, price] of drinks) {
    const p = await prisma.product.create({
      data: { name, size, category: "Drink", unit: "cup", sellingPrice: price, currentStock: 50, lowStockThreshold: 10 },
    });
    await prisma.inventoryLog.create({ data: { productId: p.id, type: "stock_in", quantity: 50, notes: "Initial stock" } });
  }
  const food: [string, number][] = [["Siomai", 8], ["Siopao", 25]];
  for (const [name, price] of food) {
    const p = await prisma.product.create({
      data: { name, size: null, category: "Food", unit: "piece", sellingPrice: price, currentStock: 100, lowStockThreshold: 20 },
    });
    await prisma.inventoryLog.create({ data: { productId: p.id, type: "stock_in", quantity: 100, notes: "Initial stock" } });
  }
  console.log("Seeded 16 products.");
}

main().finally(() => prisma.$disconnect());
