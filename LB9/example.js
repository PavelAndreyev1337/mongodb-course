// Підключення до MongoDB
const { MongoClient } = require("mongodb");
require('dotenv').config();


// 1. Створити БД в MongoDB Atlas та додати документи з векторними ембедингами в колекцію.
// [
//   { "_id": 1, "name": "Документ A", "embedding": [0.1, 0.2, 0.3, 0.4] },
//   { "_id": 2, "name": "Документ B", "embedding": [0.3, 0.1, 0.5, 0.2] },
//   { "_id": 3, "name": "Документ C", "embedding": [0.4, 0.4, 0.2, 0.1] }
// ]

// 2. Cтворити векторний індекс в MongoDB Atlas через Compass.

async function run() {
  // адреса MongoDB Atlas сервера
  const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.ojw1gda.mongodb.net/?appName=Cluster0`
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("lb9");
    const collection = db.collection("documents");

    // 3. Виконання векторного пошуку ($vectorSearch у агрегації)
    const cursor = collection.aggregate([
      {
        $vectorSearch: {
          index: "default",
          queryVector: [0.2, 0.1, 0.4, 0.3],
          path: "embedding",
          numCandidates: 3,   // Обов'язково вказати це поле
          limit: 2
        }
      },
      {
        $project: {
          name: 1,
          embedding: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ]);

    // 4. Виведення результатів
    const results = await cursor.toArray();
    results.forEach(doc => {
      console.log(`ID: ${doc._id}, Name: ${doc.name}, Score: ${doc.score}, Embedding: ${doc.embedding}`);
    });

  } finally {
    await client.close();
  }
}

run().catch(console.error);

// node example.js

// OUTPUT:
// ID: 2, Name: Документ B, Score: 0.9823819398880005, Embedding: 0.3,0.1,0.5,0.2
// ID: 1, Name: Документ A, Score: 0.9666666984558105, Embedding: 0.1,0.2,0.3,0.4
