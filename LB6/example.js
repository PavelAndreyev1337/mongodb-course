// Cтворюємо часову колекцію, вставляємо демонстраційні дані і виконуємо спрощену агрегацію, що підраховує середнє, максимум і мінімум температури по годинах.

// Створення колекції часових рядів
const db = connect("mongodb://localhost:27017/lb4");

db.sensorData.drop()

db.createCollection("sensorData", {
  timeseries: {
    timeField: "timestamp",
    metaField: "sensorId",
    granularity: "minutes"
  }
});

// Вставка даних
db.sensorData.insertMany([
  { timestamp: ISODate("2025-10-08T09:00:00Z"), sensorId: "A100", temperature: 22.5 },
  { timestamp: ISODate("2025-10-08T09:15:00Z"), sensorId: "A100", temperature: 22.7 },
  { timestamp: ISODate("2025-10-08T09:45:00Z"), sensorId: "A100", temperature: 22.6 },
  { timestamp: ISODate("2025-10-08T10:00:00Z"), sensorId: "A100", temperature: 23.0 },
  { timestamp: ISODate("2025-10-08T10:30:00Z"), sensorId: "A100", temperature: 23.2 },
  { timestamp: ISODate("2025-10-08T11:00:00Z"), sensorId: "A100", temperature: 23.3 }
]);

// Агрегація: обчислення середньої, мінімальної і максимальної температури по годинах
const result = db.sensorData.aggregate([
  {
    $match: {
      sensorId: "A100",
      timestamp: { $gte: ISODate("2025-10-08T00:00:00Z"), $lt: ISODate("2025-10-09T00:00:00Z") }
    }
  },
  {
    $group: {
      _id: {
        year: { $year: "$timestamp" },
        month: { $month: "$timestamp" },
        day: { $dayOfMonth: "$timestamp" },
        hour: { $hour: "$timestamp" }
      },
      averageTemperature: { $avg: "$temperature" },
      maxTemperature: { $max: "$temperature" },
      minTemperature: { $min: "$temperature" }
    }
  },
  {
    $sort: {
      "_id.year": 1, // сортування за полем year всередині _id
      "_id.month": 1,
      "_id.day": 1,
      "_id.hour": 1
    }
  }
]).toArray();

print("Результати агрегації:");
printjson(result);


// mongosh example.js 
