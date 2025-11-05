const { MongoClient } = require('mongodb');

async function run() {
  const client = new MongoClient('mongodb://localhost:27017');

  try {
    await client.connect();

    const db = client.db('lb10');
    const collection = db.collection('myCollection');

    // Очищаю колекцію для чистого старту
    await collection.deleteMany({});

    // Додавання записів
    await collection.insertMany([
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 30 },
    ]);

    // Відкриваємо Change Stream на колекції
    const changeStream = collection.watch();

    changeStream.on('change', async (change) => {
      console.log('Отримано подію:', change.operationType);

      if (change.operationType === 'insert') {
        // Виконати вставку документа (умовно продемонстровано)
        console.log('Вставлено новий документ:', change.fullDocument);
        // Тут можна вставити логіку на вставку, якщо треба
      }

      if (change.operationType === 'update') {
        // Виконати оновлення документа (умовно)
        console.log('Оновлено документ з _id:', change.documentKey._id);
        // Можна отримати оновлені поля через change.updateDescription
      }

      if (change.operationType === 'delete') {
        // Виконати видалення документа
        console.log('Видалено документ з _id:', change.documentKey._id);
      }
    });

    console.log('Change Stream запущено, чекаємо змін...');

    // Будь-яка функція, передана як аргумент setImmediate(), 
    // є зворотним викликом, який виконується на наступній ітерації циклу обробки подій.
    // Імітую події вставки, оновлення, видалення:
    setImmediate(async () => {
      await collection.insertOne({ name: 'Changed User', age: 40 });
      await collection.updateOne({ name: 'Changed User' }, { $set: { age: 41 } });
      setTimeout(()=>{}, 1000);
      await collection.deleteOne({ name: 'Changed User' });
    })

    // Невелика затримка, щоб обробились події change
    setTimeout(async () => {
      await changeStream.close();
      await client.close();
      console.log('Завершення роботи.');
      process.exit(0); // Завершити процес
    }, 2000);

  } catch (err) {
    console.error(err);
    if (changeStream) {
      await changeStream.close();
    }
    if (client) {
      await client.close();
    }
    process.exit(1); // Завершити процес з помилкою
  }
}

run();

// Конфіг. файл додати
// replication:
//   replSetName: rs0

// Перезапуск служби.

// MongoDB shell
// rs.initiate()

// node example.js

// Output:
// Change Stream запущено, чекаємо змін...
// Отримано подію: insert
// Вставлено новий документ: {
//   _id: new ObjectId('690baed4e22a14d87701aacc'),
//   name: 'Changed User',
//   age: 40
// }
// Отримано подію: update
// Оновлено документ з _id: new ObjectId('690baed4e22a14d87701aacc')
// Отримано подію: delete
// Видалено документ з _id: new ObjectId('690baed4e22a14d87701aacc')
// Завершення роботи.
