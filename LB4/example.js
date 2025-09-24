// 1. Генерування осмислених документів
const db = connect("mongodb://localhost:27017/lb3");
var bulkDocs = [];
var cities = ["Kyiv", "Lviv", "Odessa", "Dnipro", "Kharkiv"];
var products = ["laptop", "phone", "tablet", "monitor", "keyboard"];
for (var i = 0; i < 10000; i++) {
  bulkDocs.push({
    userId: i,                    // ID користувача (1000 унікальних)
    city: cities[i % cities.length],    // Місто
    product: products[i % products.length], // Назва продукту
    price: Math.floor(Math.random() * 1000) + 100, // Ціна товару від 100 до 1099
    quantity: Math.floor(Math.random() * 10) + 1,  // Кількість від 1 до 10
    purchaseDate: new Date(Date.now() - Math.floor(Math.random() * 1000000000)), // Дата покупки
    status: i % 2 === 0 ? "completed" : "pending", // Статус замовлення
    updatedAt: new Date()               // Часто змінюване поле, індекс ставити не варто
  });
}

db.mycollection.drop()

// Масово додаємо документи в колекцію
db.mycollection.insertMany(bulkDocs);

// 2. Запит без індексів + замір часу
var start = new Date();
db.mycollection.find({ city: "Kyiv", status: "completed" }).sort({ purchaseDate: -1 }).toArray();
var end = new Date();
print("Час без індексів (мс): " + (end - start));

// 3. Створення індексів (одинарні та складений)
db.mycollection.createIndex({ city: 1 });
db.mycollection.createIndex({ status: 1 });
db.mycollection.createIndex({ purchaseDate: -1 });
db.mycollection.createIndex({ city: 1, status: 1, purchaseDate: -1 }); // Compound index для фільтрації та сортування

// 4. Запит після створення індексів + замір часу
start = new Date();
db.mycollection.find({ city: "Kyiv", status: "completed" }).sort({ purchaseDate: -1 }).toArray();
end = new Date();
print("Час з індексами (мс): " + (end - start));


// mongosh example.js 

// Output: Час без індексів (мс): 60
//         Час з індексами (мс): 29


// 5. Висновок (порівняння часу виводиться нижче)
// Запит фільтрує за містом і статусом, сортує за датою покупки.
// Створюються індекси: по полях для фільтрації та сортування, а також складений індекс для комплексної оптимізації.
// Показується час виконання запитів до і після індексації, останній зменшився.
