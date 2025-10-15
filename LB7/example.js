const { MongoClient } = require("mongodb");

async function main() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri, {
    writeConcern: { w: "majority" },
    readConcern: { level: "snapshot" },
  });

  try {
    await client.connect();
    const db = client.db("lb7");
    const accounts = db.collection("accounts");

    // Очистка колекції та вставка початкових даних
    await accounts.drop().catch(() => {}); // ігноруємо помилку, якщо колекції нема
    await accounts.insertMany([
      { accountId: 1, owner: "Іван", balance: 1000 },
      { accountId: 2, owner: "Олена", balance: 500 },
    ]);

    // Починаємо сесію
    const session = client.startSession();

    try {
      session.startTransaction();

      // Зменшуємо баланс відправника, перевіряємо що достатньо коштів
      const result1 = await accounts.updateOne(
        { accountId: 1, balance: { $gte: 200 } },
        { $inc: { balance: -200 } },
        { session }
      );
      if (result1.matchedCount === 0) {
        throw new Error("Недостатньо коштів на рахунку відправника");
      }

      // Збільшуємо баланс отримувача
      await accounts.updateOne(
        { accountId: 2 },
        { $inc: { balance: 200 } },
        { session }
      );

      // Фіксуємо транзакцію
      await session.commitTransaction();
      console.log("Транзакція успішно виконана.");

    } catch (error) {
      console.error("Помилка у транзакції, виконуємо відкат:", error);
      await session.abortTransaction();
    } finally {
      await session.endSession();
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

main();

// node example.js
